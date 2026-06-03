import express from 'express';
import { createAppointment, getAppointments } from '../controllers/appointmentController.js';
import { auth } from '../middleware/authMiddleware.js';

const router = express.Router();

// All appointment routes are protected
router.use(auth);

router.post('/', createAppointment);
router.get('/', getAppointments);

export default router;
