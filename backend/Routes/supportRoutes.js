import express from 'express';
import { contactSupport } from '../Controller/supportController.js';
import { auth } from '../Middleware/authMiddleware.js';

const router = express.Router();

router.post('/contact', auth, contactSupport);

export default router;
