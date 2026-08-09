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
    blockUser,
    unblockUser,
    deleteUser,
    suspendTherapist,
    unsuspendTherapist,
    deleteTherapist,
    assignTherapist,
    autoAssignTherapist,
    getAdminStats,
} from '../Controller/appointmentController.js';
import { auth, requireRole } from '../Middleware/authMiddleware.js';

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
router.put('/:id/start-session', requireRole(['therapist', 'admin']), startSession);
router.post('/:id/end-session', endSession);
router.put('/:id/end-session', endSession);
router.post('/:id/reset-session', requireRole(['therapist', 'admin']), resetSession);
router.put('/:id/reset-session', requireRole(['therapist', 'admin']), resetSession);
router.get('/:id/notes', requireRole(['therapist', 'admin']), getSessionNotes);
router.put('/:id/notes', requireRole(['therapist', 'admin']), addSessionNotes);

// Admin routes (MUST come before /:id)
router.get('/admin/all', requireRole(['admin']), getAllAppointments);
router.get('/admin/users', requireRole(['admin']), getAllUsers);
router.put('/admin/users/:id/role', requireRole(['admin']), updateUserRole);
router.get('/admin/stats', requireRole(['admin']), getAdminStats);
router.put('/admin/users/:id/block', requireRole(['admin']), blockUser);
router.put('/admin/users/:id/unblock', requireRole(['admin']), unblockUser);
router.delete('/admin/users/:id', requireRole(['admin']), deleteUser);
router.put('/admin/therapists/:id/suspend', requireRole(['admin']), suspendTherapist);
router.put('/admin/therapists/:id/unsuspend', requireRole(['admin']), unsuspendTherapist);
router.delete('/admin/therapists/:id', requireRole(['admin']), deleteTherapist);
router.put('/admin/appointments/:id/assign', requireRole(['admin']), assignTherapist);
router.put('/admin/appointments/:id/auto-assign', requireRole(['admin']), autoAssignTherapist);

// Single appointment by ID and status update — placed LAST to avoid shadowing named routes
router.get('/:id', getAppointmentById);
router.patch('/:id', updateAppointmentStatus);

export default router;
