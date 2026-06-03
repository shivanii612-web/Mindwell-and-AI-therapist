import express from 'express';
import { contactSupport } from '../controllers/supportController.js';
import { auth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/contact', auth, contactSupport);

export default router;
