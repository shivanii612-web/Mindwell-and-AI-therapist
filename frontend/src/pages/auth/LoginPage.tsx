import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Heart } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@hooks/useRedux';
import { signIn, clearError } from '@redux/slices/authSlice';
import toast from 'react-hot-toast';
import { useHealthCheck } from '@hooks/useHealthCheck';

export const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useHealthCheck();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) { toast.error('Please fill in all fields'); return; }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) { toast.error('Please enter a valid email address.'); return; }
    if (normalizedEmail.endsWith('.comi') || normalizedEmail.endsWith('.con')) {
      toast.error('Please check your email for typos'); return;
    }

    const result = await dispatch(signIn({ email: normalizedEmail, password, rememberMe }));

    if (signIn.fulfilled.match(result)) {
      if (result.payload.token) {
        toast.success('Welcome back!');
        const role = result.payload.user?.role;
        if (role === 'therapist') navigate('/therapist');
        else if (role === 'admin') navigate('/admin');
        else navigate('/dashboard');
      } else {
        toast.error('Invalid server response');
      }
    } else if (signIn.rejected.match(result)) {
      toast.error(result.payload as string || 'Incorrect email or password');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full relative z-10"
    >
      {/* Card */}
      <div className="w-full rounded-[32px] border border-violet-500/15 bg-white/90 dark:bg-[#0a0712]/80 backdrop-blur-xl shadow-[0_24px_60px_rgba(0,0,0,0.06),0_0_40px_rgba(139,92,246,0.02)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(139,92,246,0.05)] px-10 py-12 relative overflow-hidden">

        {/* Card glows */}
        <div className="absolute -top-32 -right-24 w-80 h-80 rounded-full bg-violet-700/10 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-24 w-80 h-80 rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />

        <div className="relative z-10 space-y-6">

          {/* Logo & Branding */}
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full border border-violet-500/25 bg-violet-950/20 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.15)]">
              <Heart className="w-5 h-5 text-violet-400" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              Mind<span className="text-[#a855f7]">Well</span>
            </span>
          </div>

          {/* Heading */}
          <div className="text-center space-y-2">
            <h2 className="text-[28px] font-extrabold leading-tight text-gray-900 dark:text-white tracking-tight">
              Sign in to your <br />
              <span className="text-[#a855f7]">MindWell</span> account
            </h2>
            {/* decorative line */}
            <div className="flex items-center justify-center gap-2 pt-1 text-violet-500/60">
              <div className="h-[1px] w-12 bg-violet-500/40" />
              <svg className="w-3.5 h-3.5 text-violet-400/80 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.25a.75.75 0 0 1 .75.75v3.19a5.25 5.25 0 0 1 3.52 3.52h3.19a.75.75 0 0 1 0 1.5h-3.19a5.25 5.25 0 0 1-3.52 3.52v3.19a.75.75 0 0 1-1.5 0v-3.19a5.25 5.25 0 0 1-3.52-3.52H5.06a.75.75 0 0 1 0-1.5h3.19a5.25 5.25 0 0 1 3.52-3.52V3a.75.75 0 0 1 .75-.75Z" />
              </svg>
              <div className="h-[1px] w-6 bg-violet-500/40" />
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-red-500/20 bg-red-500/8 px-4 py-3 flex items-center gap-3">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span className="text-xs text-red-300">{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 tracking-wider uppercase pl-0.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-[52px] bg-white dark:bg-[#0a0712] border border-gray-300 dark:border-white/[0.06] hover:border-gray-400 dark:hover:border-white/[0.12] focus:border-[#a855f7]/50 focus:ring-1 focus:ring-[#a855f7]/10 rounded-2xl pl-11 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 transition-all outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 tracking-wider uppercase pl-0.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-[52px] bg-white dark:bg-[#0a0712] border border-gray-300 dark:border-white/[0.06] hover:border-gray-400 dark:hover:border-white/[0.12] focus:border-[#a855f7]/50 focus:ring-1 focus:ring-[#a855f7]/10 rounded-2xl pl-11 pr-12 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 transition-all outline-none"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#a855f7] dark:text-gray-500 dark:hover:text-violet-400 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-white/10 bg-white dark:bg-[#0a0712] text-violet-500 focus:ring-violet-500/25 accent-violet-500 cursor-pointer" />
                <span className="text-gray-550 dark:text-gray-400 font-medium">Remember me</span>
              </label>
              <Link to="/forgot-password" className="font-semibold text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300 transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button type="submit" disabled={isLoading}
              className="w-full h-[52px] rounded-full bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] hover:from-[#8b5cf6] hover:to-[#6366f1] text-white font-semibold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 mt-4 hover:shadow-[0_0_20px_rgba(124,58,237,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>Sign In <span className="text-white/80">→</span></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <div className="h-px w-20 bg-gray-200 dark:bg-white/[0.04]" />
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-widest">or</span>
            <div className="h-px w-20 bg-gray-200 dark:bg-white/[0.04]" />
          </div>

          {/* Already have account */}
          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300 transition-colors">
              Create Account →
            </Link>
          </p>

          {/* Therapist apply CTA */}
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 pt-1">
            Are you a therapist?{' '}
            <Link to="/therapist-apply" className="font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors">
              Apply to Join →
            </Link>
          </p>

        </div>
      </div>
    </motion.div>
  );
};

export default LoginPage;
