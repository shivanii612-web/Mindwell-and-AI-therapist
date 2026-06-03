import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Heart, AlertCircle, Check } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@hooks/useRedux';
import { signUp, clearError } from '@redux/slices/authSlice';
import { GlassCard, GradientButton, GlassInput } from '@components/ui/Layout';
import toast from 'react-hot-toast';

const passwordRequirements = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'Contains a number', test: (p: string) => /\d/.test(p) },
  { label: 'Contains uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Contains lowercase letter', test: (p: string) => /[a-z]/.test(p) },
];

export const SignupPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());

    if (!fullName || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!agreedToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    console.log('MindWell: Attempting signup for:', email);
    const result = await dispatch(signUp({ email, password, fullName, username }));

    if (signUp.fulfilled.match(result)) {
      if (result.payload.token) {
        console.log('MindWell: Signup Successful', {
          userId: result.payload.user?.id,
          hasSession: !!result.payload.token
        });
        toast.success('Account created successfully!');
        console.log('MindWell: Triggering navigation to /dashboard');
        navigate('/dashboard');
      } else {
        toast.error('Account created, please log in.');
        navigate('/login');
      }
    } else if (signUp.rejected.match(result)) {
      console.error('MindWell: Signup Failed:', result.payload);
      toast.error(result.payload as string || 'Signup failed');
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
            Create Account
          </h2>
          <p className="text-calm-500 dark:text-calm-400">
            Start your journey to better mental health
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <GlassInput
            label="Full Name"
            type="text"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            icon={<User className="w-5 h-5" />}
          />

          <GlassInput
            label="Username"
            type="text"
            placeholder="johndoe"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            icon={<User className="w-5 h-5" />}
          />

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
              placeholder="Create a strong password"
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

          {password && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              {passwordRequirements.map((req, index) => (
                <motion.div
                  key={req.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-2"
                >
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${req.test(password)
                      ? 'bg-mint-500 text-white'
                      : 'bg-calm-200 dark:bg-calm-700'
                      }`}
                  >
                    {req.test(password) && <Check className="w-3 h-3" />}
                  </div>
                  <span
                    className={`text-xs ${req.test(password)
                      ? 'text-mint-600 dark:text-mint-400'
                      : 'text-calm-500'
                      }`}
                  >
                    {req.label}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}

          <GlassInput
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={<Lock className="w-5 h-5" />}
            error={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : ''}
          />

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-calm-300 text-lavender-500 focus:ring-lavender-500"
            />
            <span className="text-sm text-calm-600 dark:text-calm-400">
              I agree to the{' '}
              <Link
                to="/terms"
                className="text-lavender-600 hover:text-lavender-500 dark:text-lavender-400"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                to="/privacy"
                className="text-lavender-600 hover:text-lavender-500 dark:text-lavender-400"
              >
                Privacy Policy
              </Link>
            </span>
          </label>

          <GradientButton
            type="submit"
            loading={isLoading}
            className="w-full"
            size="lg"
          >
            Create Account
          </GradientButton>
        </form>

        <p className="mt-6 text-center text-sm text-calm-600 dark:text-calm-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-lavender-600 hover:text-lavender-500 dark:text-lavender-400 dark:hover:text-lavender-300 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </GlassCard>
    </motion.div>
  );
};

export default SignupPage;
