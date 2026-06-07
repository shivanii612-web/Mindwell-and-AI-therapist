import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Heart, CheckCircle } from 'lucide-react';
import { useAppDispatch } from '@hooks/useRedux';
import { resetPassword } from '@redux/slices/authSlice';
import { GlassCard, GradientButton, GlassInput } from '@components/ui/Layout';
import toast from 'react-hot-toast';

export const ForgotPasswordPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      toast.error('Please enter your email address');
      return;
    }

    // Strict email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    const result = await dispatch(resetPassword(normalizedEmail));
    setIsLoading(false);

    if (resetPassword.fulfilled.match(result)) {
      setIsSuccess(true);
      toast.success('Password reset email sent!');
    } else {
      toast.error('Failed to send reset email');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <GlassCard className="p-8" hover={false}>
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-lavender-500 to-accent-500 mb-4"
          >
            <Heart className="w-8 h-8 text-white" />
          </motion.div>

          {isSuccess ? (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 mx-auto rounded-full bg-mint-100 dark:bg-mint-900/30 flex items-center justify-center mb-4"
              >
                <CheckCircle className="w-8 h-8 text-mint-600 dark:text-mint-400" />
              </motion.div>
              <h2 className="text-3xl font-bold text-calm-800 dark:text-white mb-2">
                Check Your Email
              </h2>
              <p className="text-calm-500 dark:text-calm-400 mb-6">
                We've sent a password reset link to{' '}
                <span className="font-medium text-calm-700 dark:text-calm-300">
                  {email}
                </span>
              </p>
              <p className="text-sm text-calm-500 dark:text-calm-400 mb-6">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <GradientButton onClick={() => setIsSuccess(false)} variant="ghost">
                Try another email
              </GradientButton>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-calm-800 dark:text-white mb-2">
                Forgot Password?
              </h2>
              <p className="text-calm-500 dark:text-calm-400">
                No worries, we'll send you reset instructions
              </p>
            </>
          )}
        </div>

        {!isSuccess && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <GlassInput
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-5 h-5" />}
            />

            <GradientButton
              type="submit"
              loading={isLoading}
              className="w-full"
              size="lg"
            >
              Send Reset Link
            </GradientButton>
          </form>
        )}

        <Link
          to="/login"
          className="mt-6 flex items-center justify-center gap-2 text-sm text-calm-600 dark:text-calm-400 hover:text-lavender-600 dark:hover:text-lavender-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>
      </GlassCard>
    </motion.div>
  );
};

export default ForgotPasswordPage;
