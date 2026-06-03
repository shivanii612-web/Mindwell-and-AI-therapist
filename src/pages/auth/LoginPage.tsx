import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Heart, AlertCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@hooks/useRedux';
import { signIn, clearError } from '@redux/slices/authSlice';
import { GlassCard, GradientButton, GlassInput } from '@components/ui/Layout';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    console.log('MindWell: Attempting login for:', email, { rememberMe });
    const result = await dispatch(signIn({ email, password, rememberMe }));

    if (signIn.fulfilled.match(result)) {
      if (result.payload.token) {
        console.log('MindWell: Login Successful', {
          userId: result.payload.user?.id,
          hasSession: !!result.payload.token
        });
        toast.success('Welcome back!');
        console.log('MindWell: Triggering navigation to /dashboard');
        navigate('/dashboard');
      } else {
        toast.error('Invalid server response');
      }
    } else if (signIn.rejected.match(result)) {
      console.error('MindWell: Login Failed:', result.payload);
      toast.error(result.payload as string || 'Incorrect email or password');
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
          <h2 className="text-3xl font-bold text-calm-800 dark:text-white mb-2">
            Welcome Back
          </h2>
          <p className="text-calm-500 dark:text-calm-400">
            Sign in to continue your wellness journey
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-coral-50 dark:bg-coral-900/20 border border-coral-200 dark:border-coral-800"
          >
            <div className="flex items-center gap-2 text-coral-600 dark:text-coral-400">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <GlassInput
            label="Email Address"
            type="email"
            placeholder="hello@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-5 h-5" />}
          />

          <div className="relative">
            <GlassInput
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-5 h-5" />}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-[38px] text-calm-400 hover:text-calm-600 dark:hover:text-calm-300 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-calm-300 text-lavender-500 focus:ring-lavender-500"
              />
              <span className="text-sm text-calm-600 dark:text-calm-400">
                Remember me
              </span>
            </label>
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-lavender-600 hover:text-lavender-500 dark:text-lavender-400 dark:hover:text-lavender-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <GradientButton
            type="submit"
            loading={isLoading}
            className="w-full"
            size="lg"
          >
            Sign In
          </GradientButton>
        </form>


        <p className="mt-8 text-center text-sm text-calm-600 dark:text-calm-400">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="font-semibold text-lavender-600 hover:text-lavender-500 dark:text-lavender-400 dark:hover:text-lavender-300 transition-colors"
          >
            Sign up for free
          </Link>
        </p>
      </GlassCard>
    </motion.div>
  );
};

export default LoginPage;
