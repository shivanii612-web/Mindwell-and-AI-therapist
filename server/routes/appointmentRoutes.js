import express from 'express';
import {
    createAppointment,
    getAppointments,
    getAppointmentById,
    updateAppointmentStatus,
    getPendingAppointments,
    getTherapistAppointments,
    acceptAppointment,
    rejectAppointment,
    addSessionNotes,
    getSessionNotes,
    getAllAppointments,
    getAllUsers,
    updateUserRole,
    startSession,
    endSession,
    resetSession,
} from '../controllers/appointmentController.js';
import { auth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// All appointment routes are protected
router.use(auth);

// User routes
router.post('/', createAppointment);
router.get('/', getAppointments);

// Therapist routes (MUST come before /:id to avoid param interception)
router.get('/therapist/pending', requireRole(['therapist', 'admin']), getPendingAppointments);
router.get('/therapist/mine', requireRole(['therapist']), getTherapistAppointments);
router.put('/:id/accept', requireRole(['therapist', 'admin']), acceptAppointment);
router.put('/:id/reject', requireRole(['therapist', 'admin']), rejectAppointment);
router.post('/:id/start-session', requireRole(['therapist', 'admin']), startSession);
router.post('/:id/end-session', requireRole(['therapist', 'admin']), endSession);
router.post('/:id/reset-session', requireRole(['therapist', 'admin']), resetSession);
router.get('/:id/notes', requireRole(['therapist', 'admin']), getSessionNotes);
router.put('/:id/notes', requireRole(['therapist', 'admin']), addSessionNotes);

// Admin routes (MUST come before /:id)
router.get('/admin/all', requireRole(['admin']), getAllAppointments);
router.get('/admin/users', requireRole(['admin']), getAllUsers);
router.put('/admin/users/:id/role', requireRole(['admin']), updateUserRole);

// Single appointment by ID and status update — placed LAST to avoid shadowing named routes
router.get('/:id', getAppointmentById);
router.patch('/:id', updateAppointmentStatus);

export default router;
