import express from 'express';
import { createOrder, verifyPayment, getSubscription } from '../controllers/paymentController.js';
import { auth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create-order', auth, createOrder);
router.post('/verify', auth, verifyPayment);
router.get('/subscription', auth, getSubscription);

export default router;
