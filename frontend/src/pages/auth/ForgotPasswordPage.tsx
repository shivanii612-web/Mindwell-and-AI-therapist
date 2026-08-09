import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useAppDispatch } from '@hooks/useRedux';
import { resetPassword } from '@redux/slices/authSlice';
import toast from 'react-hot-toast';
import { BrandLogoIcon } from '../../layouts/AuthLayout';

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
      className="w-full relative z-10"
    >
      <div className="w-full rounded-[32px] border border-violet-500/15 bg-white/90 dark:bg-[#0a0712]/80 backdrop-blur-xl shadow-[0_24px_60px_rgba(0,0,0,0.06),0_0_40px_rgba(139,92,246,0.02)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(139,92,246,0.05)] px-10 py-10 relative overflow-hidden">
        
        {/* Subtle Background Glow inside the card */}
        <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-violet-600/10 blur-[100px]" />
        <div className="absolute -bottom-24 -left-20 w-72 h-72 rounded-full bg-purple-650/5 blur-[100px]" />

        {/* Content */}
        <div className="relative z-10 space-y-7">
          
          {/* Logo Header */}
          <div className="flex justify-center mt-2">
            <div className="w-14 h-14 rounded-full border border-violet-500/25 bg-violet-950/20 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.25)]">
              <BrandLogoIcon className="w-6 h-6 text-violet-400" />
            </div>
          </div>

          {/* Heading, Divider, and Subtitle */}
          <div className="text-center space-y-2">
            {isSuccess ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mb-3 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                >
                  <CheckCircle className="w-6 h-6" />
                </motion.div>
                <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  Check Your Email
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-[320px] mx-auto leading-relaxed mt-2">
                  We've sent a password reset link to{' '}
                  <span className="font-semibold text-violet-600 dark:text-violet-400">
                    {email}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
                
                <div className="pt-4">
                  <button 
                    onClick={() => setIsSuccess(false)} 
                    className="w-full h-11 border border-gray-300 dark:border-white/10 hover:border-violet-500/50 hover:bg-black/5 dark:hover:bg-white/5 text-gray-800 dark:text-white font-semibold rounded-full text-sm transition-all"
                  >
                    Try another email
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  Forgot Password?
                </h2>
                
                {/* Small divider */}
                <div className="flex items-center justify-center gap-2 py-1 opacity-40">
                  <div className="h-px w-8 bg-gradient-to-r from-transparent to-violet-400" />
                  <svg className="w-2.5 h-2.5 text-violet-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.25a.75.75 0 0 1 .75.75v3.19a5.25 5.25 0 0 1 3.52 3.52h3.19a.75.75 0 0 1 0 1.5h-3.19a5.25 5.25 0 0 1-3.52 3.52v3.19a.75.75 0 0 1-1.5 0v-3.19a5.25 5.25 0 0 1-3.52-3.52H5.06a.75.75 0 0 1 0-1.5h3.19a5.25 5.25 0 0 1 3.52-3.52V3a.75.75 0 0 1 .75-.75Z" />
                  </svg>
                  <div className="h-px w-8 bg-gradient-to-l from-transparent to-violet-400" />
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-400 max-w-[280px] mx-auto leading-relaxed">
                  No worries, enter your email and we'll send reset instructions.
                </p>
              </>
            )}
          </div>

          {!isSuccess && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider pl-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white dark:bg-[#0a0712] border border-gray-300 dark:border-white/[0.06] hover:border-gray-400 dark:hover:border-white/[0.12] focus:border-[#a855f7]/50 focus:ring-1 focus:ring-[#a855f7]/10 rounded-2xl py-3.5 pl-12 pr-4 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-600 transition-all outline-none"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-full bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-550 hover:to-indigo-600 text-white font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(139,92,246,0.25)] hover:shadow-[0_0_25px_rgba(139,92,246,0.4)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <>
                    Send Reset Link <span className="text-white/80">→</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Divider and back to Sign In */}
          <div className="pt-2 text-center text-xs text-gray-500 dark:text-gray-400">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 font-semibold text-violet-650 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>

        </div>
      </div>
    </motion.div>
  );
};

export default ForgotPasswordPage;
