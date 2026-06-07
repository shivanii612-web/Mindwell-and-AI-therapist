import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import ConsultationMessage from '../models/ConsultationMessage.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'mindwell-secure-secret-2024';

/**
 * Verify a JWT token and return the user document.
 * Returns null if token is missing, invalid, or user not found.
 */
const verifySocketToken = async (token) => {
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id).lean();
        return user || null;
    } catch {
        return null;
    }
};

/**
 * Check if a user is an allowed participant for a given appointment.
 * Allowed: the patient (userId / user_id), the assigned therapist, or admin.
 */
const isAllowedParticipant = (appointment, userId, userRole) => {
    if (userRole === 'admin') return true;
    const uid = userId.toString();
    const isPatient =
        appointment.userId?.toString() === uid ||
        appointment.user_id?.toString() === uid;
    const isTherapist = appointment.therapistId?.toString() === uid;
    return isPatient || isTherapist;
};

/**
 * initConsultationSocket — attaches all Socket.io consultation chat
 * logic to the provided io instance.
 *
 * This function is intentionally isolated so that server/index.js
 * stays clean and the socket logic can be tested independently.
 */
export const initConsultationSocket = (io) => {
    // ── Socket-level JWT Authentication Middleware ──────────────────
    // Runs once per socket connection before any event handler fires.
    io.use(async (socket, next) => {
        try {
            const token =
                socket.handshake.auth?.token ||
                socket.handshake.headers?.authorization?.replace('Bearer ', '');

            const user = await verifySocketToken(token);
            if (!user) {
                return next(new Error('Authentication failed: invalid or missing token.'));
            }

            // Attach user to socket so event handlers can use it
            socket.user = user;
            next();
        } catch (err) {
            next(new Error('Socket authentication error.'));
        }
    });

    io.on('connection', (socket) => {
        const { _id: userId, role: userRole, full_name: userName } = socket.user;
        console.log(`MindWell Socket: Connected — user=${userId} role=${userRole} socketId=${socket.id}`);

        // Every connected socket joins their personal room immediately.
        // This lets the server push session_started / session_ended events
        // to the patient even when they haven't opened the consultation page yet.
        socket.join(`user:${userId}`);

        // ── join_consultation_room ────────────────────────────────────
        // Client sends: { appointmentId }
        // Server joins the socket into room `consultation:${appointmentId}`
        // and emits the message history back to the requesting socket only.
        socket.on('join_consultation_room', async ({ appointmentId } = {}) => {
            try {
                if (!appointmentId || !mongoose.Types.ObjectId.isValid(appointmentId)) {
                    socket.emit('consultation_error', { message: 'Invalid appointment ID.' });
                    return;
                }

                const appointment = await Appointment.findById(appointmentId);
                if (!appointment) {
                    socket.emit('consultation_error', { message: 'Appointment not found.' });
                    return;
                }

                if (!isAllowedParticipant(appointment, userId, userRole)) {
                    socket.emit('consultation_error', { message: 'Access denied: you are not a participant in this consultation.' });
                    return;
                }

                const roomId = `consultation:${appointmentId}`;

                // Leave any previously joined consultation rooms to prevent cross-session bleed
                for (const room of socket.rooms) {
                    if (room.startsWith('consultation:') && room !== roomId) {
                        socket.leave(room);
                    }
                }

                socket.join(roomId);
                console.log(`MindWell Socket: user=${userId} joined room=${roomId}`);

                // Load and return persisted message history to this socket only
                const history = await ConsultationMessage.find({ appointmentId })
                    .sort({ createdAt: 1 })
                    .populate('senderId', 'full_name role')
                    .lean();

                socket.emit('consultation_history', { appointmentId, messages: history });
            } catch (err) {
                console.error('MindWell Socket: join_consultation_room error:', err);
                socket.emit('consultation_error', { message: 'Failed to join consultation room.' });
            }
        });

        // ── send_consultation_message ─────────────────────────────────
        // Client sends: { appointmentId, message }
        // Server: validates, persists to MongoDB, broadcasts to room.
        socket.on('send_consultation_message', async ({ appointmentId, message } = {}) => {
            try {
                // Input validation
                if (!appointmentId || !mongoose.Types.ObjectId.isValid(appointmentId)) {
                    socket.emit('consultation_error', { message: 'Invalid appointment ID.' });
                    return;
                }
                if (!message || typeof message !== 'string' || !message.trim()) {
                    socket.emit('consultation_error', { message: 'Message cannot be empty.' });
                    return;
                }
                if (message.trim().length > 4000) {
                    socket.emit('consultation_error', { message: 'Message too long (max 4000 characters).' });
                    return;
                }

                // Re-validate participant access on every send
                const appointment = await Appointment.findById(appointmentId);
                if (!appointment || !isAllowedParticipant(appointment, userId, userRole)) {
                    socket.emit('consultation_error', { message: 'Access denied.' });
                    return;
                }

                // Persist to MongoDB
                const savedMsg = await ConsultationMessage.create({
                    appointmentId,
                    senderId: userId,
                    senderRole: userRole,
                    message: message.trim(),
                });

                // Build the payload for the room — include sender name for display
                const payload = {
                    _id: savedMsg._id.toString(),
                    appointmentId,
                    senderId: {
                        _id: userId.toString(),
                        full_name: userName || 'Unknown',
                        role: userRole,
                    },
                    senderRole: userRole,
                    message: savedMsg.message,
                    createdAt: savedMsg.createdAt,
                };

                // Emit ONLY to the appointment-specific room — not globally
                const roomId = `consultation:${appointmentId}`;
                io.to(roomId).emit('receive_consultation_message', payload);

                console.log(`MindWell Socket: message saved & emitted to room=${roomId} from user=${userId}`);
            } catch (err) {
                console.error('MindWell Socket: send_consultation_message error:', err);
                socket.emit('consultation_error', { message: 'Failed to send message.' });
            }
        });

        // ── disconnect ────────────────────────────────────────────────
        socket.on('disconnect', (reason) => {
            console.log(`MindWell Socket: Disconnected — user=${userId} reason=${reason}`);
        });
    });

    console.log('MindWell Socket: Consultation socket handler initialised.');
};
