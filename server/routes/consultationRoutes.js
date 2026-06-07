import express from 'express';
import mongoose from 'mongoose';
import { auth } from '../middleware/authMiddleware.js';
import Appointment from '../models/Appointment.js';
import ConsultationMessage from '../models/ConsultationMessage.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// ─── Shared participant access check ────────────────────────────────────────
const isParticipant = (appointment, requesterId, requesterRole) => {
    if (requesterRole === 'admin') return true;
    const rid = requesterId.toString();
    const isPatient =
        appointment.userId?.toString() === rid ||
        appointment.user_id?.toString() === rid;
    const isAssignedTherapist =
        appointment.therapistId?.toString() === rid;
    return isPatient || isAssignedTherapist;
};

/**
 * POST /api/consultations/:appointmentId/daily-room
 *
 * Creates (or retrieves existing) Daily.co room for an accepted appointment.
 * DAILY_API_KEY never leaves the backend — frontend receives only the room URL.
 *
 * Access: appointment owner (user), assigned therapist, or admin.
 * Requirement: appointment.status must be 'Accepted'.
 */
router.post('/:appointmentId/daily-room', async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const requesterId = req.user._id;
        const requesterRole = req.user.role;

        if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
            return res.status(400).json({ error: 'Invalid appointment ID.' });
        }

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found.' });
        }

        if (!isParticipant(appointment, requesterId, requesterRole)) {
            return res.status(403).json({ error: 'Access denied. You are not a participant in this consultation.' });
        }

        if (appointment.status !== 'Accepted') {
            return res.status(400).json({ error: 'Consultation room is only available for accepted appointments.' });
        }

        // ── Reuse existing room if already created ──────────────────────
        if (appointment.dailyRoomUrl && appointment.dailyRoomName) {
            console.log(`MindWell Daily: Reusing existing room for appointment ${appointmentId}`);
            return res.json({
                roomUrl: appointment.dailyRoomUrl,
                roomName: appointment.dailyRoomName,
            });
        }

        // ── Create new Daily room ───────────────────────────────────────
        const DAILY_API_KEY = process.env.DAILY_API_KEY;
        const DAILY_DOMAIN = process.env.DAILY_DOMAIN;

        if (!DAILY_API_KEY || !DAILY_DOMAIN) {
            console.error('MindWell Daily: DAILY_API_KEY or DAILY_DOMAIN not set in environment.');
            return res.status(500).json({ error: 'Video service is not configured. Please contact support.' });
        }

        // Room name: deterministic slug from appointmentId — guarantees idempotency
        // even if two requests race before the DB is updated.
        const roomName = `mw-${appointmentId}`;

        // Check if room already exists on Daily side (handles race condition)
        let roomUrl = null;
        const checkRes = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${DAILY_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        if (checkRes.ok) {
            // Room already exists on Daily — use it
            const existingRoom = await checkRes.json();
            roomUrl = existingRoom.url;
            console.log(`MindWell Daily: Room already exists on Daily — reusing: ${roomName}`);
        } else if (checkRes.status === 404) {
            // Room does not exist — create it
            const createRes = await fetch('https://api.daily.co/v1/rooms', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${DAILY_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: roomName,
                    privacy: 'private',       // only participants with token can join
                    properties: {
                        enable_chat: false,   // we have our own chat
                        enable_screenshare: false,
                        enable_recording: false,
                        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // expires in 24h
                        max_participants: 2,
                    },
                }),
            });

            if (!createRes.ok) {
                const errBody = await createRes.text();
                console.error(`MindWell Daily: Room creation failed (${createRes.status}):`, errBody);
                return res.status(502).json({ error: 'Failed to create video room. Please try again.' });
            }

            const newRoom = await createRes.json();
            roomUrl = newRoom.url;
            console.log(`MindWell Daily: Created new room: ${roomName} → ${roomUrl}`);
        } else {
            const errBody = await checkRes.text();
            console.error(`MindWell Daily: Unexpected Daily API response (${checkRes.status}):`, errBody);
            return res.status(502).json({ error: 'Video service returned an unexpected error.' });
        }

        // ── Persist room details to appointment ─────────────────────────
        appointment.dailyRoomName = roomName;
        appointment.dailyRoomUrl = roomUrl;
        await appointment.save();

        res.json({ roomUrl, roomName });
    } catch (error) {
        console.error('MindWell: daily-room endpoint error:', error);
        res.status(500).json({ error: 'Failed to provision consultation room.' });
    }
});

/**
 * GET /api/consultations/:appointmentId/messages
 */
router.get('/:appointmentId/messages', async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const requesterId = req.user._id;
        const requesterRole = req.user.role;

        if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
            return res.status(400).json({ error: 'Invalid appointment ID.' });
        }

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found.' });
        }

        if (!isParticipant(appointment, requesterId, requesterRole)) {
            return res.status(403).json({ error: 'Access denied. You are not a participant in this consultation.' });
        }

        const messages = await ConsultationMessage.find({ appointmentId })
            .sort({ createdAt: 1 })
            .populate('senderId', 'full_name role');

        res.json(messages);
    } catch (error) {
        console.error('MindWell: consultationRoutes getMessages error:', error);
        res.status(500).json({ error: 'Failed to fetch consultation messages.' });
    }
});

export default router;
