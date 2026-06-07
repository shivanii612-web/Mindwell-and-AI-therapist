import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from '../models/Payment.js';
import Subscription from '../models/Subscription.js';
import dotenv from 'dotenv';
import { withCache, invalidateAdminStatsCache, CACHE_KEYS } from '../utils/dashboardCache.js';

dotenv.config();

// Initialise Razorpay with test keys from environment
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Approved plan definitions — amount in INR (paise conversion happens at order creation)
const PLAN_CONFIG = {
    'Premium': { amountINR: 199, durationDays: 30 },
    'Pro Wellness': { amountINR: 499, durationDays: 30 },
};

/**
 * POST /api/payments/create-order
 * Creates a Razorpay order for the requested plan.
 * Amount is validated server-side — frontend cannot send a fake low amount.
 */
export const createOrder = async (req, res) => {
    try {
        const { planName } = req.body;

        // Validate plan — reject unknown plans
        const planConfig = PLAN_CONFIG[planName];
        if (!planConfig) {
            return res.status(400).json({ success: false, message: `Unknown plan: ${planName}` });
        }

        const amountPaise = planConfig.amountINR * 100; // convert to paise

        // Razorpay receipt must be ≤ 40 characters
        const receiptId = `rcpt_${req.user._id.toString().slice(-8)}_${Date.now() % 1000000}`;

        const options = {
            amount: amountPaise,
            currency: 'INR',
            receipt: receiptId,
            notes: {
                userId: req.user._id.toString(),
                planName,
            },
        };

        const order = await razorpay.orders.create(options);

        // Save pending payment record — linked to this user only
        const newPayment = new Payment({
            user: req.user._id,
            planName,
            amount: planConfig.amountINR,
            currency: 'INR',
            razorpayOrderId: order.id,
            status: 'pending',
        });
        await newPayment.save();

        res.status(201).json({ success: true, order });
    } catch (error) {
        console.error('MindWell: Razorpay Order Creation Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to create payment order.' });
    }
};

/**
 * POST /api/payments/verify
 * Verifies Razorpay HMAC signature and activates the subscription.
 * RAZORPAY_KEY_SECRET never leaves the backend.
 */
export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planName } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planName) {
            return res.status(400).json({ success: false, message: 'Missing payment verification fields.' });
        }

        // ── HMAC signature verification ──────────────────────────────────
        const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSign = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(sign)
            .digest('hex');

        if (expectedSign !== razorpay_signature) {
            console.warn('MindWell: Payment signature mismatch for order:', razorpay_order_id);
            return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
        }

        // ── Signature valid — activate subscription ───────────────────────
        const planConfig = PLAN_CONFIG[planName];
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + (planConfig?.durationDays || 30));

        // Update payment record to completed
        const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
        if (payment) {
            payment.razorpayPaymentId = razorpay_payment_id;
            payment.razorpaySignature = razorpay_signature;
            payment.status = 'completed';
            payment.paidAt = new Date();
            payment.subscriptionEndDate = endDate;
            await payment.save();
        } else {
            // Fallback: create the record if it was somehow not created at order time
            await Payment.create({
                user: req.user._id,
                planName,
                amount: planConfig?.amountINR || 0,
                currency: 'INR',
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                status: 'completed',
                paidAt: new Date(),
                subscriptionEndDate: endDate,
            });
        }

        // Update or create subscription record
        let subscription = await Subscription.findOne({ user: req.user._id });
        if (subscription) {
            subscription.planName = planName;
            subscription.status = 'active';
            subscription.startDate = new Date();
            subscription.endDate = endDate;
            await subscription.save();
        } else {
            subscription = await Subscription.create({
                user: req.user._id,
                planName,
                status: 'active',
                startDate: new Date(),
                endDate,
            });
        }

        // ── Queue notifications (non-fatal — do NOT let email failure block response) ──
        try {
            const { queuePaymentConfirmation, queueNotification } = await import('../services/notificationService.js');
            await queuePaymentConfirmation({
                userId: req.user._id,
                userEmail: req.user.email,
                planName,
                amount: planConfig?.amountINR,
                endDate,
            });
            if (planName !== 'Free') {
                const expiryReminderDate = new Date(endDate.getTime() - (3 * 24 * 60 * 60 * 1000));
                const delay = Math.max(0, expiryReminderDate.getTime() - Date.now());
                await queueNotification('EMAIL_SUBSCRIPTION_EXPIRY', {
                    userId: req.user._id,
                    userEmail: req.user.email,
                    planName,
                    endDate,
                }, { delay });
            }
        } catch (notifErr) {
            // Notification failure must never block payment success
            console.warn('MindWell: Payment notification queuing skipped (non-fatal):', notifErr.message);
        }

        return res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            subscription: {
                planName: subscription.planName,
                status: subscription.status,
                endDate: subscription.endDate,
            },
        });
    } catch (error) {
        console.error('MindWell: Payment Verification Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error during verification.' });
    }
};

/**
 * GET /api/payments/subscription
 * Returns current subscription for the authenticated user.
 */
export const getSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.findOne({ user: req.user._id });

        if (!subscription) {
            return res.status(200).json({
                success: true,
                subscription: { planName: 'Free', status: 'active' },
            });
        }

        res.status(200).json({ success: true, subscription });
    } catch (error) {
        console.error('MindWell: Fetch Subscription Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch subscription status.' });
    }
};

/**
 * GET /api/payments/history
 * Returns the authenticated user's own payment history only.
 * Ordered newest first, limited to 50.
 */
export const getPaymentHistory = async (req, res) => {
    try {
        const payments = await Payment.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50)
            .select('-razorpaySignature'); // never expose signature to frontend

        res.json({ success: true, payments });
    } catch (error) {
        console.error('MindWell: Payment History Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch payment history.' });
    }
};

/**
 * GET /api/payments/admin/stats
 * Admin-only: platform-wide payment statistics.
 */
export const getAdminPaymentStats = async (req, res) => {
    try {
        // Cache admin payment stats for 60 seconds to reduce MongoDB aggregation load.
        // Falls back silently to live query when Redis is unavailable.
        const stats = await withCache(CACHE_KEYS.ADMIN_STATS, 60, async () => {
            const [total] = await Payment.aggregate([
                { $match: { status: 'completed' } },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$amount' },
                        totalTransactions: { $sum: 1 },
                    },
                },
            ]);

            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const [monthly] = await Payment.aggregate([
                { $match: { status: 'completed', createdAt: { $gte: startOfMonth } } },
                { $group: { _id: null, thisMonthRevenue: { $sum: '$amount' } } },
            ]);

            const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });

            const recentPayments = await Payment.find({ status: 'completed' })
                .populate('user', 'full_name email')
                .sort({ createdAt: -1 })
                .limit(10)
                .select('-razorpaySignature');

            return {
                totalRevenue: total?.totalRevenue || 0,
                totalTransactions: total?.totalTransactions || 0,
                thisMonthRevenue: monthly?.thisMonthRevenue || 0,
                activeSubscriptions,
                recentPayments,
            };
        });

        res.json(stats);
    } catch (error) {
        console.error('Admin payment stats error:', error.message);
        res.status(500).json({ message: 'Failed to fetch payment statistics.' });
    }
};
