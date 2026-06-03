import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from '../models/Payment.js';
import Subscription from '../models/Subscription.js';
import dotenv from 'dotenv';
import { queuePaymentConfirmation, queueNotification } from '../services/notificationService.js';

dotenv.config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret'
});

export const createOrder = async (req, res) => {
    try {
        const { planName, amount } = req.body;
        const options = {
            amount: amount * 100, // amount in the smallest currency unit (paise)
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);

        // Save payment attempt to DB
        const newPayment = new Payment({
            user: req.user._id,
            planName,
            amount,
            razorpayOrderId: order.id,
            status: 'pending'
        });
        await newPayment.save();

        res.status(201).json({
            success: true,
            order
        });
    } catch (error) {
        console.error('MindWell: Razorpay Order Creation Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create payment order.' });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planName } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret')
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            // Update payment record
            const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
            if (payment) {
                payment.razorpayPaymentId = razorpay_payment_id;
                payment.razorpaySignature = razorpay_signature;
                payment.status = 'completed';
                await payment.save();
            }

            // Update or Create Subscription
            let subscription = await Subscription.findOne({ user: req.user._id });

            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

            if (subscription) {
                subscription.planName = planName;
                subscription.status = 'active';
                subscription.startDate = new Date();
                subscription.endDate = endDate;
                await subscription.save();
            } else {
                subscription = new Subscription({
                    user: req.user._id,
                    planName,
                    status: 'active',
                    startDate: new Date(),
                    endDate: endDate
                });
                await subscription.save();
            }

            // Queue payment confirmation and subscription expiry reminder
            await queuePaymentConfirmation({
                userId: req.user._id,
                userEmail: req.user.email,
                planName,
                amount: payment?.amount,
                endDate
            });

            // If it's a paid plan, queue an expiry reminder 3 days before
            if (planName !== 'Free') {
                const expiryReminderDate = new Date(endDate.getTime() - (3 * 24 * 60 * 60 * 1000));
                const now = new Date();
                const delay = Math.max(0, expiryReminderDate.getTime() - now.getTime());

                await queueNotification('EMAIL_SUBSCRIPTION_EXPIRY', {
                    userId: req.user._id,
                    userEmail: req.user.email,
                    planName,
                    endDate
                }, { delay });
            }

            return res.status(200).json({
                success: true,
                message: "Payment verified successfully",
                subscription
            });
        } else {
            return res.status(400).json({ success: false, message: "Invalid payment signature" });
        }
    } catch (error) {
        console.error('MindWell: Payment Verification Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error during verification.' });
    }
};

export const getSubscription = async (req, res) => {
    try {
        let subscription = await Subscription.findOne({ user: req.user._id });

        if (!subscription) {
            // Return default Free plan if no subscription found
            return res.status(200).json({
                success: true,
                subscription: {
                    planName: 'Free',
                    status: 'active'
                }
            });
        }

        res.status(200).json({ success: true, subscription });
    } catch (error) {
        console.error('MindWell: Fetch Subscription Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch subscription status.' });
    }
};
