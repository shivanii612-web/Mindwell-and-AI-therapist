import express from 'express';
import {
    submitApplication,
    getApplications,
    getApplication,
    approveApplication,
    rejectApplication,
    checkApplicationStatus,
} from '../controllers/therapistApplicationController.js';
import { auth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// ── Public routes (no auth required) ────────────────────────────────────────
router.post('/apply', submitApplication);
router.get('/status/:email', checkApplicationStatus);

// ── Admin-only routes ────────────────────────────────────────────────────────
router.get('/', auth, requireRole(['admin']), getApplications);
router.get('/:id', auth, requireRole(['admin']), getApplication);
router.post('/:id/approve', auth, requireRole(['admin']), approveApplication);
router.post('/:id/reject', auth, requireRole(['admin']), rejectApplication);

export default router;
