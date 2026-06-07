import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Check, Shield, Zap, Crown, CreditCard, Loader2,
    Receipt, Wallet, CheckCircle2, TestTube2
} from 'lucide-react';
import { GlassCard, GradientButton, Badge } from '@components/ui/Layout';
import {
    useGetSubscriptionQuery,
    useGetProfileQuery,
    useGetPaymentHistoryQuery,
    useCreatePaymentOrderMutation,
    useVerifyPaymentMutation,
} from '@redux/api/apiSlice';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { cn } from '@utils/cn';

// ─── Plan definitions ─────────────────────────────────────────────────────────
// Amounts in INR — backend validates and enforces these server-side.
const plans = [
    {
        name: 'Free',
        priceINR: 0,
        description: 'Perfect for getting started and exploring MindWell.',
        features: [
            'Mood tracking',
            'Journaling',
            'Limited AI therapist chats',
            'Basic community access',
        ],
        icon: Zap,
        color: 'lavender' as const,
    },
    {
        name: 'Premium',
        priceINR: 199,
        description: 'Unlock deeper insights and constant support.',
        features: [
            'Everything in Free',
            'Unlimited AI therapist chats',
            'Advanced mood insights',
            'Appointment requests',
            'Priority support',
        ],
        icon: Shield,
        color: 'accent' as const,
        popular: true,
    },
    {
        name: 'Pro Wellness',
        priceINR: 499,
        description: 'The ultimate care for your mental well-being.',
        features: [
            'Everything in Premium',
            'Priority appointment handling',
            'Monthly wellness summary',
            'Export reports',
            'Early access features',
        ],
        icon: Crown,
        color: 'primary' as const,
    },
];

// ─── Component ────────────────────────────────────────────────────────────────
const PricingPage: React.FC = () => {
    const { data: profileData } = useGetProfileQuery();
    const {
        data: subscriptionData,
        refetch: refetchSubscription,
    } = useGetSubscriptionQuery();
    const {
        data: paymentHistory = [],
        refetch: refetchHistory,
    } = useGetPaymentHistoryQuery();

    const [createOrder] = useCreatePaymentOrderMutation();
    const [verifyPayment] = useVerifyPaymentMutation();

    // Track which plan's button is in a loading/processing state
    const [processingPlan, setProcessingPlan] = useState<string | null>(null);

    const currentPlan: string = subscriptionData?.subscription?.planName || 'Free';
    const subscriptionEndDate: string | undefined = subscriptionData?.subscription?.endDate;
    const isActivePaid = currentPlan !== 'Free' && subscriptionData?.subscription?.status === 'active';

    const handlePayment = async (plan: typeof plans[0]) => {
        if (plan.priceINR === 0 || currentPlan === plan.name) return;

        // Guard: Razorpay script must be loaded
        if (typeof (window as any).Razorpay === 'undefined') {
            toast.error('Payment system is loading. Please wait a moment and try again.');
            return;
        }

        setProcessingPlan(plan.name);

        try {
            // Step 1 — Create Razorpay order on backend
            const orderResponse = await createOrder({
                planName: plan.name,
                amount: plan.priceINR,
            } as any).unwrap();

            if (!orderResponse?.success || !orderResponse?.order) {
                toast.error('Failed to initialise payment. Please try again.');
                setProcessingPlan(null);
                return;
            }

            const { order } = orderResponse;

            // Step 2 — Open Razorpay checkout popup
            await new Promise<void>((resolve) => {
                const options = {
                    key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                    amount: order.amount,       // in paise — set by backend
                    currency: order.currency,
                    name: 'MindWell',
                    description: `${plan.name} Plan — ₹${plan.priceINR}/month`,
                    order_id: order.id,

                    // Step 3 — Verify payment on backend after Razorpay success callback
                    handler: async (response: {
                        razorpay_order_id: string;
                        razorpay_payment_id: string;
                        razorpay_signature: string;
                    }) => {
                        try {
                            const verifyResponse = await verifyPayment({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                planName: plan.name,
                            } as any).unwrap();

                            if (verifyResponse?.success) {
                                toast.success(`🎉 ${plan.name} activated! Welcome to MindWell ${plan.name}.`);
                                // Cleanup centering override
                                const style = document.getElementById('rzp-center-fix');
                                if (style) style.remove();
                                document.body.style.overflow = '';
                                // Refresh subscription and payment history immediately
                                refetchSubscription();
                                refetchHistory();
                            } else {
                                toast.error('Payment verification failed. Please contact support.');
                            }
                        } catch (verifyErr) {
                            console.error('MindWell: Verification error:', verifyErr);
                            toast.error('Verification failed. If amount was deducted, contact support.');
                        } finally {
                            setProcessingPlan(null);
                            resolve();
                        }
                    },

                    prefill: {
                        name: profileData?.user?.full_name || profileData?.user?.name || '',
                        email: profileData?.user?.email || '',
                    },
                    theme: { color: '#8b5cf6' },

                    modal: {
                        ondismiss: () => {
                            // User closed the popup without paying
                            // Remove centering override when modal closes
                            const style = document.getElementById('rzp-center-fix');
                            if (style) style.remove();
                            document.body.style.overflow = '';
                            toast('Payment cancelled.', { icon: '↩️' });
                            setProcessingPlan(null);
                            resolve();
                        },
                        // Ensure modal renders as a centered popup
                        escape: true,
                        animation: true,
                        backdropclose: false,
                    },
                };

                // Inject CSS to force Razorpay modal to center on all screen sizes.
                // Razorpay renders its iframe inside .razorpay-container — we override
                // its positioning here since we cannot pass CSS directly to the SDK.
                const existingStyle = document.getElementById('rzp-center-fix');
                if (existingStyle) existingStyle.remove();
                const centerStyle = document.createElement('style');
                centerStyle.id = 'rzp-center-fix';
                centerStyle.textContent = `
                    .razorpay-container {
                        position: fixed !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100vw !important;
                        height: 100vh !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        z-index: 99999 !important;
                        background: rgba(0,0,0,0.65) !important;
                        backdrop-filter: blur(4px) !important;
                        -webkit-backdrop-filter: blur(4px) !important;
                        margin: 0 !important;
                        padding: 16px !important;
                        box-sizing: border-box !important;
                    }
                    .razorpay-container iframe {
                        position: relative !important;
                        top: auto !important;
                        left: auto !important;
                        transform: none !important;
                        max-width: 480px !important;
                        width: 100% !important;
                        max-height: 90vh !important;
                        border-radius: 16px !important;
                        box-shadow: 0 25px 60px rgba(0,0,0,0.5) !important;
                    }
                    .razorpay-backdrop {
                        display: none !important;
                    }
                `;
                document.head.appendChild(centerStyle);

                const rzp = new (window as any).Razorpay(options);
                rzp.on('payment.failed', (response: any) => {
                    // Cleanup on payment failure too
                    const style = document.getElementById('rzp-center-fix');
                    if (style) style.remove();
                    document.body.style.overflow = '';
                    toast.error(response.error?.description || 'Payment failed. Please try again.');
                    setProcessingPlan(null);
                    resolve();
                });
                rzp.open();
            });

        } catch (error: any) {
            console.error('MindWell: Payment flow error:', error);
            toast.error(error?.data?.message || 'Failed to start payment. Please try again.');
            setProcessingPlan(null);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

            {/* ─── Header ─── */}
            <div className="text-center space-y-4">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-5xl font-extrabold text-calm-800 dark:text-white"
                >
                    Choose Your <span className="text-lavender-500">Wellness Journey</span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-lg text-calm-600 dark:text-calm-400 max-w-2xl mx-auto"
                >
                    Invest in your peace of mind with tailored plans designed to support your mental health.
                </motion.p>

                {/* Razorpay Test Mode indicator */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-200 dark:border-amber-800">
                    <TestTube2 className="w-3.5 h-3.5" />
                    Razorpay Test Mode — No real money is charged
                </div>
            </div>

            {/* ─── Active plan banner ─── */}
            {isActivePaid && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-4 p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                >
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
                    <div className="flex-1">
                        <p className="font-bold text-emerald-800 dark:text-emerald-300 text-lg">
                            {currentPlan} Active
                        </p>
                        {subscriptionEndDate && (
                            <p className="text-sm text-emerald-600 dark:text-emerald-400">
                                Renews on {format(new Date(subscriptionEndDate), 'MMMM d, yyyy')}
                            </p>
                        )}
                    </div>
                    <Badge variant="success">Active</Badge>
                </motion.div>
            )}

            {/* ─── Plan cards ─── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                {plans.map((plan, index) => {
                    const isCurrent = currentPlan === plan.name;
                    const isProcessing = processingPlan === plan.name;

                    return (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex flex-col h-full"
                        >
                            <GlassCard
                                className={cn(
                                    'flex-1 p-8 flex flex-col relative',
                                    plan.popular && 'border-lavender-500 dark:border-lavender-500 ring-2 ring-lavender-500/20',
                                    isCurrent && 'ring-2 ring-emerald-500/40'
                                )}
                                hover={false}
                            >
                                {plan.popular && !isCurrent && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <span className="bg-lavender-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                                            MOST POPULAR
                                        </span>
                                    </div>
                                )}
                                {isCurrent && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <span className="bg-emerald-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> Current Plan
                                        </span>
                                    </div>
                                )}

                                {/* Icon + title */}
                                <div className="mb-8">
                                    <div className={cn(
                                        'w-12 h-12 rounded-2xl flex items-center justify-center mb-4',
                                        plan.color === 'lavender' ? 'bg-lavender-100 text-lavender-500 dark:bg-lavender-500/10' :
                                            plan.color === 'accent' ? 'bg-accent-100 text-accent-500 dark:bg-accent-500/10' :
                                                'bg-primary-100 text-primary-500 dark:bg-primary-500/10'
                                    )}>
                                        <plan.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-calm-800 dark:text-white mb-2">{plan.name}</h3>
                                    <p className="text-sm text-calm-500 dark:text-calm-400">{plan.description}</p>
                                </div>

                                {/* Price */}
                                <div className="mb-8">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold text-calm-800 dark:text-white">
                                            {plan.priceINR === 0 ? 'Free' : `₹${plan.priceINR}`}
                                        </span>
                                        {plan.priceINR > 0 && (
                                            <span className="text-calm-500 dark:text-calm-400">/month</span>
                                        )}
                                    </div>
                                </div>

                                {/* Features */}
                                <div className="space-y-4 mb-10 flex-1">
                                    {plan.features.map((feature) => (
                                        <div key={feature} className="flex items-start gap-3">
                                            <div className="mt-1 w-5 h-5 rounded-full bg-mint-500/10 flex items-center justify-center text-mint-500 shrink-0">
                                                <Check className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-sm text-calm-600 dark:text-calm-300">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* CTA button */}
                                <GradientButton
                                    variant={isCurrent ? 'ghost' : plan.popular ? 'primary' : 'secondary'}
                                    className="w-full mt-auto"
                                    disabled={isCurrent || isProcessing || !!processingPlan}
                                    onClick={() => handlePayment(plan)}
                                >
                                    {isProcessing ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Processing…
                                        </span>
                                    ) : isCurrent ? (
                                        <span className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4" /> Current Plan
                                        </span>
                                    ) : plan.priceINR === 0 ? (
                                        'Get Started Free'
                                    ) : (
                                        `Upgrade to ${plan.name}`
                                    )}
                                </GradientButton>
                            </GlassCard>
                        </motion.div>
                    );
                })}
            </div>

            {/* ─── Payment History ─── */}
            <GlassCard className="p-6" hover={false}>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center">
                        <Receipt className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-calm-800 dark:text-white">Payment History</h2>
                        <p className="text-sm text-calm-500">Your past transactions</p>
                    </div>
                </div>

                {paymentHistory.length === 0 ? (
                    <div className="text-center py-10">
                        <Wallet className="w-12 h-12 text-calm-300 dark:text-calm-600 mx-auto mb-3" />
                        <p className="text-calm-500 font-medium">No payments yet</p>
                        <p className="text-xs text-calm-400 mt-1">Your transactions will appear here after upgrading.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {paymentHistory.map((payment: any) => (
                            <div
                                key={payment.id || payment._id}
                                className="flex items-center justify-between p-4 rounded-xl bg-calm-50 dark:bg-calm-800/50 border border-calm-100 dark:border-calm-700/50"
                            >
                                <div className="flex items-center gap-3">
                                    <CreditCard className="w-5 h-5 text-lavender-500 shrink-0" />
                                    <div>
                                        <p className="font-semibold text-calm-800 dark:text-white text-sm">
                                            {payment.planName || 'Subscription'} Plan
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-xs text-calm-400">
                                                {payment.paidAt
                                                    ? format(new Date(payment.paidAt), 'MMM d, yyyy • h:mm a')
                                                    : payment.createdAt
                                                        ? format(new Date(payment.createdAt), 'MMM d, yyyy • h:mm a')
                                                        : '—'}
                                            </p>
                                            {payment.razorpayPaymentId && (
                                                <span className="text-[10px] text-calm-400 font-mono">
                                                    ID: {payment.razorpayPaymentId}
                                                </span>
                                            )}
                                        </div>
                                        {payment.subscriptionEndDate && (
                                            <p className="text-[10px] text-emerald-500 mt-0.5">
                                                Valid until {format(new Date(payment.subscriptionEndDate), 'MMM d, yyyy')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <Badge
                                        variant={payment.status === 'completed' ? 'success' : payment.status === 'pending' ? 'warning' : 'error'}
                                        size="sm"
                                    >
                                        {payment.status}
                                    </Badge>
                                    <span className="font-bold text-calm-800 dark:text-white text-sm">
                                        ₹{payment.amount}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </GlassCard>

            {/* ─── Footer note ─── */}
            <div className="text-center">
                <GlassCard className="max-w-2xl mx-auto p-5 bg-mint-500/5 border-mint-500/20" hover={false}>
                    <p className="text-sm text-calm-600 dark:text-calm-400 flex items-center justify-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Secure payments processed via Razorpay. Cancel anytime. 30-day money-back guarantee.
                    </p>
                </GlassCard>
            </div>
        </div>
    );
};

export default PricingPage;
