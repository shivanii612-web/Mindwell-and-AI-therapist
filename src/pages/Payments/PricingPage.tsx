import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Shield, Zap, Crown, CreditCard, Loader2, X, Info } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { GlassCard, GradientButton } from '@components/ui/Layout';
import { useGetSubscriptionQuery, useGetProfileQuery } from '@redux/api/apiSlice';
import toast from 'react-hot-toast';
import { cn } from '@utils/cn';

const plans = [
    {
        name: 'Free',
        price: '0',
        description: 'Perfect for getting started and exploring MindWell.',
        features: [
            'Mood tracking',
            'Journaling',
            'Limited AI therapist chats',
            'Basic community access'
        ],
        icon: Zap,
        color: 'lavender'
    },
    {
        name: 'Premium',
        price: '199',
        description: 'Unlock deeper insights and constant support.',
        features: [
            'Everything in Free',
            'Unlimited AI therapist chats',
            'Advanced mood insights',
            'Appointment requests',
            'Priority support'
        ],
        icon: Shield,
        color: 'accent',
        popular: true
    },
    {
        name: 'Pro Wellness',
        price: '499',
        description: 'The ultimate care for your mental well-being.',
        features: [
            'Everything in Premium',
            'Priority appointment handling',
            'Monthly wellness summary',
            'Export reports',
            'Early access features'
        ],
        icon: Crown,
        color: 'primary'
    }
];

const PricingPage: React.FC = () => {
    const { data: profile } = useGetProfileQuery();
    const { data: subscription, isLoading: isSubLoading } = useGetSubscriptionQuery();
    const [processingPlan, setProcessingPlan] = useState<string | null>(null);
    const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);


    const handleSubscription = (plan: typeof plans[0]) => {
        if (plan.name === 'Free' || subscription?.subscription?.planName === plan.name) {
            return;
        }
        setSelectedPlan(plan);
        setIsDemoModalOpen(true);
    };

    const currentPlan = subscription?.subscription?.planName || 'Free';

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center space-y-4 mb-16">
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
                    Invest in your peace of mind with tailored plans designed to support your mental health at every stage.
                </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                {plans.map((plan, index) => (
                    <motion.div
                        key={plan.name}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex flex-col h-full"
                    >
                        <GlassCard
                            className={cn(
                                "flex-1 p-8 flex flex-col relative",
                                plan.popular && "border-lavender-500 dark:border-lavender-500 ring-2 ring-lavender-500/20"
                            )}
                            hover={false}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <span className="bg-lavender-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                                        MOST POPULAR
                                    </span>
                                </div>
                            )}

                            <div className="mb-8">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center mb-4",
                                    plan.color === 'lavender' ? "bg-lavender-100 text-lavender-500 dark:bg-lavender-500/10" :
                                        plan.color === 'accent' ? "bg-accent-100 text-accent-500 dark:bg-accent-500/10" :
                                            "bg-primary-100 text-primary-500 dark:bg-primary-500/10"
                                )}>
                                    <plan.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-calm-800 dark:text-white mb-2">{plan.name}</h3>
                                <p className="text-sm text-calm-500 dark:text-calm-400">{plan.description}</p>
                            </div>

                            <div className="mb-8">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-calm-800 dark:text-white">₹{plan.price}</span>
                                    <span className="text-calm-500 dark:text-calm-400">/month</span>
                                </div>
                            </div>

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

                            <GradientButton
                                variant={plan.name === currentPlan ? 'ghost' : (plan.popular ? 'primary' : 'secondary')}
                                className="w-full mt-auto"
                                disabled={currentPlan === plan.name || processingPlan === plan.name}
                                onClick={() => handleSubscription(plan)}
                            >
                                {processingPlan === plan.name ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : currentPlan === plan.name ? (
                                    'Current Plan'
                                ) : (
                                    `Upgrade to ${plan.name}`
                                )}
                            </GradientButton>
                        </GlassCard>
                    </motion.div>
                ))}
            </div>

            <div className="mt-16 text-center">
                <GlassCard className="max-w-2xl mx-auto p-6 bg-mint-500/5 border-mint-500/20" hover={false}>
                    <p className="text-sm text-calm-600 dark:text-calm-400 flex items-center justify-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Secure payments processed via Razorpay. Cancel anytime.
                    </p>
                </GlassCard>
            </div>

            <AnimatePresence>
                {isDemoModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDemoModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md"
                        >
                            <GlassCard className="p-8 text-center" hover={false}>
                                <button
                                    onClick={() => setIsDemoModalOpen(false)}
                                    className="absolute top-4 right-4 p-2 rounded-xl hover:bg-calm-100 dark:hover:bg-calm-800 text-calm-400 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                <div className="w-16 h-16 rounded-2xl bg-lavender-100 dark:bg-lavender-500/10 flex items-center justify-center mx-auto mb-6 text-lavender-500">
                                    <Info className="w-8 h-8" />
                                </div>

                                <h3 className="text-2xl font-bold text-calm-800 dark:text-white mb-4">
                                    Plan: {selectedPlan?.name}
                                </h3>

                                <p className="text-calm-600 dark:text-calm-400 mb-8 leading-relaxed">
                                    Demo mode: Payment gateway is not connected. Your plan selection has been recorded for preview purposes.
                                </p>

                                <GradientButton
                                    variant="primary"
                                    className="w-full"
                                    onClick={() => setIsDemoModalOpen(false)}
                                >
                                    OK, I Understand
                                </GradientButton>
                            </GlassCard>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PricingPage;
