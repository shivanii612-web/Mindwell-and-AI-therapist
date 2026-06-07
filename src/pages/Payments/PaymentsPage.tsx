import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Crown,
  Check,
  Star,
  Zap,
  Shield,
  Heart,
  Calendar,
  Wallet,
  ArrowRight,
  Receipt,
} from 'lucide-react';
import { useGetPaymentsQuery, useCreatePaymentMutation } from '@redux/api/apiSlice';
import { GlassCard, GradientButton, Badge } from '@components/ui/Layout';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { cn } from '@utils/cn';
import { useAppSelector } from '@hooks/useRedux';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Get started with basic features',
    features: [
      'AI Chat (5 messages/day)',
      'Mood Tracking',
      'Journal (3 entries)',
      'Community Access',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 19,
    description: 'Perfect for regular self-care',
    features: [
      'Unlimited AI Chat',
      'Advanced Mood Analytics',
      'Unlimited Journal',
      'Video Consultations (2/month)',
      'Priority Support',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 49,
    description: 'Best for complete mental wellness',
    features: [
      'Everything in Basic',
      'Unlimited Video Sessions',
      'Personalized AI Therapy',
      'Progress Reports',
      'Exclusive Resources',
      'Family Member Access',
    ],
    cta: 'Go Premium',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    description: 'For organizations and teams',
    features: [
      'Everything in Premium',
      'Team Dashboard',
      'Admin Controls',
      'Custom Integrations',
      'Dedicated Account Manager',
      'HIPAA Compliance',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export const PaymentsPage: React.FC = () => {
  const { profile } = useAppSelector((state) => state.auth);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { data: payments = [] } = useGetPaymentsQuery();
  const [createPayment] = useCreatePaymentMutation();

  const handleSelectPlan = (planId: string) => {
    if (planId === 'free') {
      toast.success('You are on the Free plan');
      return;
    }
    setSelectedPlan(planId);
  };

  const handlePayment = async () => {
    if (!selectedPlan) return;

    const plan = plans.find((p) => p.id === selectedPlan);
    const price = billingCycle === 'yearly' ? (plan?.price || 0) * 10 : plan?.price || 0;

    try {
      await createPayment({
        user_id: profile?.id,
        amount: price,
        currency: 'USD',
        status: 'completed',
        payment_method: 'razorpay',
        metadata: { plan: selectedPlan, billing_cycle: billingCycle },
      }).unwrap();

      toast.success('Payment successful!');
      setSelectedPlan(null);
    } catch {
      toast.error('Payment failed. Please try again.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-calm-800 dark:text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-calm-500 dark:text-calm-400 max-w-2xl mx-auto">
            Invest in your mental wellness. All plans include a 7-day free trial.
          </p>
        </motion.div>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center p-1 rounded-xl bg-calm-100/50 dark:bg-calm-800/50 backdrop-blur-sm">
          {['monthly', 'yearly'].map((cycle) => (
            <button
              key={cycle}
              onClick={() => setBillingCycle(cycle as typeof billingCycle)}
              className={cn(
                'px-6 py-2 rounded-lg font-medium transition-all capitalize',
                billingCycle === cycle
                  ? 'bg-gradient-to-r from-lavender-500 to-accent-500 text-white shadow-md'
                  : 'text-calm-600 dark:text-calm-400'
              )}
            >
              {cycle}
              {cycle === 'yearly' && (
                <Badge variant="success" size="sm" className="ml-2">
                  Save 17%
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard
              className={cn(
                'p-6 relative',
                plan.popular && 'ring-2 ring-lavender-500 shadow-glow'
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="primary" className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <div className="text-center mb-6">
                <div
                  className={cn(
                    'w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center',
                    plan.popular
                      ? 'bg-gradient-to-br from-lavender-500 to-accent-500'
                      : 'bg-calm-100 dark:bg-calm-800'
                  )}
                >
                  {plan.price === 0 ? (
                    <Heart className={cn('w-8 h-8', plan.popular ? 'text-white' : 'text-lavender-500')} />
                  ) : (
                    <Crown className={cn('w-8 h-8', plan.popular ? 'text-white' : 'text-lavender-500')} />
                  )}
                </div>
                <h3 className="text-xl font-bold text-calm-800 dark:text-white">
                  {plan.name}
                </h3>
                <p className="text-sm text-calm-500 mt-1">{plan.description}</p>
              </div>

              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-calm-800 dark:text-white">
                    ${billingCycle === 'yearly' ? (plan.price * 10) : plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-calm-500">
                      /{billingCycle === 'yearly' ? 'year' : 'month'}
                    </span>
                  )}
                </div>
                {billingCycle === 'yearly' && plan.price > 0 && (
                  <p className="text-xs text-mint-600 dark:text-mint-400 mt-1">
                    Save ${plan.price * 12 - plan.price * 10}/year
                  </p>
                )}
              </div>

              <div className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-mint-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-calm-600 dark:text-calm-300">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <GradientButton
                variant={plan.popular ? 'primary' : 'ghost'}
                className="w-full"
                onClick={() => handleSelectPlan(plan.id)}
              >
                {plan.cta}
              </GradientButton>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Payment History */}
      <GlassCard className="p-6" hover={false}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center">
            <Receipt className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-calm-800 dark:text-white">
              Payment History
            </h2>
            <p className="text-sm text-calm-500">View your past transactions</p>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-8">
            <Wallet className="w-12 h-12 text-calm-300 dark:text-calm-600 mx-auto mb-3" />
            <p className="text-calm-500">No payments yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.slice(0, 5).map((payment: any) => (
              <div
                key={payment.id || payment._id}
                className="flex items-center justify-between p-4 rounded-xl bg-calm-50 dark:bg-calm-800/50"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-lavender-500" />
                  <div>
                    <p className="font-medium text-calm-800 dark:text-white capitalize">
                      {payment.planName || 'Subscription'} Plan
                    </p>
                    <p className="text-xs text-calm-500">
                      {payment.paidAt
                        ? format(new Date(payment.paidAt), 'MMM d, yyyy')
                        : payment.createdAt
                          ? format(new Date(payment.createdAt), 'MMM d, yyyy')
                          : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={payment.status === 'completed' ? 'success' : 'warning'} size="sm">
                    {payment.status}
                  </Badge>
                  <span className="font-bold text-calm-800 dark:text-white">
                    ₹{payment.amount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Guarantee */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-mint-100 dark:bg-mint-900/30 text-mint-700 dark:text-mint-300">
          <Shield className="w-5 h-5" />
          <span className="font-medium">30-day money-back guarantee</span>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentsPage;
