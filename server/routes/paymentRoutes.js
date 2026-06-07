import express from 'express';
import {
    createOrder,
    verifyPayment,
    getSubscription,
    getPaymentHistory,
    getAdminPaymentStats,
} from '../controllers/paymentController.js';
import { auth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// All payment routes require authentication
router.use(auth);

router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.get('/subscription', getSubscription);
router.get('/history', getPaymentHistory);            // user's own history
router.get('/admin/stats', requireRole(['admin']), getAdminPaymentStats);

export default router;
