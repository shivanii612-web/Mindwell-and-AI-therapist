import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import { queueAppointmentConfirmation, queueAppointmentReminder } from '../services/notificationService.js';
import { getCachedData, setCachedData, deleteCachedData } from '../utils/redisClient.js';
import logger from '../utils/logger.js';

// USER: Cancel their own appointment (only allowed status update from user side)
export const updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user._id;
        const role = req.user.role;

        // Users may only cancel their own appointments
        // Admins may set any status
        const allowedUserStatuses = ['Cancelled'];
        const allowedAdminStatuses = ['Cancelled', 'Completed', 'Pending Review', 'Accepted', 'Rejected'];

        const allowed = role === 'admin' ? allowedAdminStatuses : allowedUserStatuses;
        if (!allowed.includes(status)) {
            return res.status(403).json({ message: `Status '${status}' not permitted for your role.` });
        }

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Non-admin users can only modify their own appointments
        const isOwner = appointment.userId?.toString() === userId.toString() ||
            appointment.user_id?.toString() === userId.toString();

        if (role !== 'admin' && !isOwner) {
            return res.status(403).json({ message: 'Access denied' });
        }

        appointment.status = status;
        await appointment.save();

        // Invalidate cache
        try {
            await deleteCachedData(`appointments:user:${userId}`);
        } catch (_) { /* non-fatal */ }

        res.json(appointment);
    } catch (error) {
        console.error('MindWell: updateAppointmentStatus error:', error);
        res.status(500).json({ message: 'Failed to update appointment status' });
    }
};

// Get a single appointment by ID (for consultation room)
export const getAppointmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const appointment = await Appointment.findById(id)
            .populate('userId', 'full_name email')
            .populate('therapistId', 'full_name email');

        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        // Only allow the participant themselves (user or therapist) or admin
        const uid = req.user._id.toString();
        const role = req.user.role;
        const isOwner = appointment.userId?._id.toString() === uid ||
            appointment.therapistId?._id?.toString() === uid;

        if (!isOwner && role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(appointment);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch appointment' });
    }
};

export const createAppointment = async (req, res) => {
    console.log('MindWell: Appointment Request Body:', req.body);
    try {
        const { sessionType, preferredDate, preferredTime, reason, notes } = req.body;

        // Always use req.user from JWT — never trust frontend-supplied userId
        const authenticatedUser = req.user;
        const authenticatedUserId = authenticatedUser._id;

        const newAppointment = new Appointment({
            userId: authenticatedUserId,
            sessionType,
            preferredDate,
            preferredTime,
            reason,
            notes,
            status: 'Pending Review'
        });

        await newAppointment.save();

        // Invalidate appointment cache for this user (non-fatal if Redis is unavailable)
        try {
            await deleteCachedData(`appointments:user:${authenticatedUserId}`);
        } catch (cacheErr) {
            console.warn('MindWell: Cache invalidation skipped (Redis may be unavailable):', cacheErr.message);
        }

        // Queue email confirmation — wrapped so a notification failure does NOT fail the request
        try {
            const emailData = {
                userName: authenticatedUser.full_name || authenticatedUser.email.split('@')[0],
                userEmail: authenticatedUser.email,
                sessionType,
                preferredDate: new Date(preferredDate).toDateString(),
                preferredTime,
                reason,
                notes
            };

            await queueAppointmentConfirmation(emailData);

            const appointmentDate = new Date(preferredDate);
            const reminderTime = new Date(appointmentDate.getTime() - (24 * 60 * 60 * 1000));
            const now = new Date();
            let delay = reminderTime.getTime() - now.getTime();
            if (delay < 0) delay = 1000 * 60 * 5;

            await queueAppointmentReminder({
                ...emailData,
                isReminder: true,
                appointmentId: newAppointment._id
            }, delay);
        } catch (notifyErr) {
            console.warn('MindWell: Appointment notification queuing failed (non-fatal):', notifyErr.message);
        }

        res.status(201).json(newAppointment);
    } catch (error) {
        console.error('MindWell: Error creating appointment:', error);
        res.status(500).json({ message: error.message || 'Internal server error during appointment creation' });
    }
};

export const getAppointments = async (req, res) => {
    try {
        const query = {
            $or: [
                { userId: req.user._id },
                { user_id: req.user._id }
            ]
        };

        const appointments = await Appointment.find(query)
            .populate('therapistId', 'full_name email') // so user sees assigned therapist name
            .sort({ createdAt: -1 });
        res.status(200).json(appointments);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// THERAPIST: Get all unassigned pending appointments visible to all therapists
export const getPendingAppointments = async (req, res) => {
    try {
        // Only return appointments that are truly unassigned — status Pending Review AND therapistId is null
        // This ensures an already-accepted appointment never appears in another therapist's pending list
        const appointments = await Appointment.find({
            status: 'Pending Review',
            $or: [
                { therapistId: null },
                { therapistId: { $exists: false } }
            ]
        })
            .populate('userId', 'full_name email')
            .sort({ createdAt: -1 });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch pending appointments' });
    }
};

// THERAPIST: Get appointments assigned to this therapist
export const getTherapistAppointments = async (req, res) => {
    try {
        const therapistId = req.user._id; // use _id consistently
        const appointments = await Appointment.find({ therapistId })
            .populate('userId', 'full_name email')
            .sort({ preferredDate: 1 });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch therapist appointments' });
    }
};

// THERAPIST: Accept an appointment — atomic to prevent race conditions
// Two therapists clicking Accept at the same moment:
//   - First request: findOneAndUpdate finds doc where status='Pending Review' AND therapistId=null → updates it
//   - Second request: findOneAndUpdate finds NO matching doc (therapistId is now set) → returns null → 409
export const acceptAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const therapistId = req.user._id;

        // Atomic: find appointment only if it is still unassigned
        const appointment = await Appointment.findOneAndUpdate(
            {
                _id: id,
                status: 'Pending Review',
                $or: [
                    { therapistId: null },
                    { therapistId: { $exists: false } }
                ]
            },
            {
                $set: {
                    status: 'Accepted',
                    therapistId,
                    acceptedAt: new Date(),
                }
            },
            { new: true }
        ).populate('userId', 'full_name email');

        // If null → another therapist already accepted this appointment
        if (!appointment) {
            return res.status(409).json({
                message: 'Appointment already accepted by another therapist.'
            });
        }

        // Invalidate user appointment cache (non-fatal)
        try {
            const patientId = appointment.userId?._id || appointment.userId;
            await deleteCachedData(`appointments:user:${patientId}`);
        } catch (_) { /* non-fatal */ }

        // Emit real-time events via Socket.io
        const io = req.app.get('io');
        if (io) {
            const appointmentId = id.toString();
            const payload = {
                appointmentId,
                therapistId: therapistId.toString(),
                therapistName: req.user.full_name || 'Your Therapist',
                status: 'Accepted',
            };

            // Notify the patient
            const patientId = appointment.userId?._id?.toString() || appointment.userId?.toString();
            if (patientId) {
                io.to(`user:${patientId}`).emit('appointment_accepted', payload);
            }

            // Notify ALL therapists so their pending lists update without refresh
            // We emit to every connected socket with role=therapist
            io.emit('appointment_taken', { appointmentId });
        }

        res.json({ message: 'Appointment accepted', appointment });
    } catch (error) {
        console.error('MindWell: acceptAppointment error:', error);
        res.status(500).json({ message: 'Failed to accept appointment' });
    }
};

// THERAPIST: Reject an appointment
export const rejectAppointment = async (req, res) => {
    try {
        const { id } = req.params;

        const appointment = await Appointment.findByIdAndUpdate(
            id,
            { status: 'Rejected' },
            { new: true }
        ).populate('userId', 'full_name email');

        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        await deleteCachedData(`appointments:user:${appointment.userId._id}`);

        res.json({ message: 'Appointment rejected', appointment });
    } catch (error) {
        res.status(500).json({ message: 'Failed to reject appointment' });
    }
};

// THERAPIST: Get session notes for an appointment (therapist/admin only)
export const getSessionNotes = async (req, res) => {
    try {
        const { id } = req.params;
        const uid = req.user._id.toString();
        const role = req.user.role;

        const appointment = await Appointment.findById(id);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        // Only the assigned therapist or admin may read notes
        const isAssignedTherapist = appointment.therapistId?.toString() === uid;
        if (!isAssignedTherapist && role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: only the assigned therapist can view session notes' });
        }

        res.json({ sessionNotes: appointment.sessionNotes || '' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch session notes' });
    }
};

// THERAPIST: Save/update session notes (does NOT change appointment status)
export const addSessionNotes = async (req, res) => {
    try {
        const { id } = req.params;
        const { sessionNotes } = req.body;
        const uid = req.user._id.toString();
        const role = req.user.role;

        if (typeof sessionNotes !== 'string') {
            return res.status(400).json({ message: 'sessionNotes must be a string' });
        }

        const appointment = await Appointment.findById(id);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        // Only the assigned therapist or admin may update notes
        const isAssignedTherapist = appointment.therapistId?.toString() === uid;
        if (!isAssignedTherapist && role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: only the assigned therapist can save session notes' });
        }

        appointment.sessionNotes = sessionNotes;
        await appointment.save();

        // Invalidate cache so user appointment list stays accurate
        await deleteCachedData(`appointments:user:${appointment.userId}`);

        res.json({ message: 'Session notes saved', sessionNotes: appointment.sessionNotes });
    } catch (error) {
        res.status(500).json({ message: 'Failed to save session notes' });
    }
};

// ADMIN: Get all appointments
export const getAllAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find({})
            .populate('userId', 'full_name email')
            .populate('therapistId', 'full_name email')
            .sort({ createdAt: -1 });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch all appointments' });
    }
};

// ADMIN: Get all users
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, '-password -refreshToken -resetPasswordToken').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch users' });
    }
};

// ADMIN: Update user role
export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['user', 'therapist', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const user = await User.findByIdAndUpdate(id, { role }, { new: true, select: '-password -refreshToken' });
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({ message: 'User role updated', user });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update user role' });
    }
};

/**
 * THERAPIST: Start a consultation session.
 * Sets sessionStatus = 'live' and records sessionStartedAt.
 * Emits 'session_started' via Socket.io to the patient's personal room.
 * Only the assigned therapist (or admin) may call this.
 */
export const startSession = async (req, res) => {
    try {
        const { id } = req.params;
        const therapistId = req.user._id;
        const role = req.user.role;

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }

        // Only assigned therapist or admin can start
        const isAssigned = appointment.therapistId?.toString() === therapistId.toString();
        if (!isAssigned && role !== 'admin') {
            return res.status(403).json({ message: 'Only the assigned therapist can start this session.' });
        }

        if (appointment.status !== 'Accepted') {
            return res.status(400).json({ message: 'Session can only be started for Accepted appointments.' });
        }

        appointment.sessionStatus = 'live';
        appointment.sessionStartedAt = new Date();
        await appointment.save();

        // Emit via Socket.io if io is available (attached to app in index.js)
        const io = req.app.get('io');
        if (io) {
            // Emit to the appointment room (both parties may already be listening)
            io.to(`consultation:${id}`).emit('session_started', {
                appointmentId: id,
                sessionStartedAt: appointment.sessionStartedAt,
            });
            // Also emit to the patient's personal room so they get notified even if
            // they haven't opened the consultation room yet
            const patientId = appointment.userId?.toString() || appointment.user_id?.toString();
            if (patientId) {
                io.to(`user:${patientId}`).emit('session_started', {
                    appointmentId: id,
                    sessionStartedAt: appointment.sessionStartedAt,
                });
            }
        }

        res.json({ message: 'Session started', appointment });
    } catch (error) {
        console.error('MindWell: startSession error:', error);
        res.status(500).json({ message: 'Failed to start session.' });
    }
};

/**
 * THERAPIST: End a consultation session.
 * Sets sessionStatus = 'ended' and records sessionEndedAt.
 * Emits 'session_ended' via Socket.io.
 */
export const endSession = async (req, res) => {
    try {
        const { id } = req.params;
        const therapistId = req.user._id;
        const role = req.user.role;

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }

        const isAssigned = appointment.therapistId?.toString() === therapistId.toString();
        if (!isAssigned && role !== 'admin') {
            return res.status(403).json({ message: 'Only the assigned therapist can end this session.' });
        }

        appointment.sessionStatus = 'ended';
        appointment.sessionEndedAt = new Date();
        await appointment.save();

        const io = req.app.get('io');
        if (io) {
            io.to(`consultation:${id}`).emit('session_ended', { appointmentId: id });
            const patientId = appointment.userId?.toString() || appointment.user_id?.toString();
            if (patientId) {
                io.to(`user:${patientId}`).emit('session_ended', { appointmentId: id });
            }
        }

        res.json({ message: 'Session ended', appointment });
    } catch (error) {
        console.error('MindWell: endSession error:', error);
        res.status(500).json({ message: 'Failed to end session.' });
    }
};

/**
 * THERAPIST/ADMIN: Reset a session back to pending_session.
 * Used to undo an accidentally started session.
 */
export const resetSession = async (req, res) => {
    try {
        const { id } = req.params;
        const therapistId = req.user._id;
        const role = req.user.role;

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }

        const isAssigned = appointment.therapistId?.toString() === therapistId.toString();
        if (!isAssigned && role !== 'admin') {
            return res.status(403).json({ message: 'Only the assigned therapist can reset this session.' });
        }

        appointment.sessionStatus = 'pending_session';
        appointment.sessionStartedAt = null;
        await appointment.save();

        // Notify connected clients
        const io = req.app.get('io');
        if (io) {
            io.to(`consultation:${id}`).emit('session_ended', { appointmentId: id });
            const patientId = appointment.userId?.toString() || appointment.user_id?.toString();
            if (patientId) {
                io.to(`user:${patientId}`).emit('session_ended', { appointmentId: id });
            }
        }

        res.json({ message: 'Session reset to pending', appointment });
    } catch (error) {
        console.error('MindWell: resetSession error:', error);
        res.status(500).json({ message: 'Failed to reset session.' });
    }
};
