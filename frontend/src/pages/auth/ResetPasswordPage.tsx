import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_URL, joinUrl } from '@utils/apiUtils';
import { BrandLogoIcon } from '../../layouts/AuthLayout';

const passwordRequirements = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'Contains a number', test: (p: string) => /\d/.test(p) },
  { label: 'Contains uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Contains lowercase letter', test: (p: string) => /[a-z]/.test(p) },
];

export const ResetPasswordPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Invalid reset link');
      navigate('/login');
      return;
    }

    localStorage.removeItem('mindwell-session');
    localStorage.removeItem('mindwell-user');
    localStorage.removeItem('mindwell-profile');
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Check requirements
    const failedReq = passwordRequirements.find(req => !req.test(password));
    if (failedReq) {
      toast.error(`Password must meet all requirements: ${failedReq.label}`);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(joinUrl(API_URL, '/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Reset failed');
      }

      setIsSuccess(true);
      toast.success('Password updated successfully!');

      // Clear passwords from state for security
      setPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      toast.error((error as Error).message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const isPasswordValid = passwordRequirements.every(req => req.test(password)) && password === confirmPassword && password.length > 0;

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
                  All Set!
                </h2>
                <p className="text-xs text-gray-655 dark:text-gray-400 max-w-[280px] mx-auto leading-relaxed">
                  Password reset successful. Redirecting you to login...
                </p>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  Reset Password
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
                  Create a new secure password for your account.
                </p>
              </>
            )}
          </div>

          {!isSuccess && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider pl-1">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white dark:bg-[#0a0712] border border-gray-300 dark:border-white/[0.06] hover:border-gray-400 dark:hover:border-white/[0.12] focus:border-[#a855f7]/50 focus:ring-1 focus:ring-[#a855f7]/10 rounded-2xl py-3.5 pl-12 pr-12 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-600 transition-all outline-none"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#a855f7] dark:text-gray-500 dark:hover:text-violet-400 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password strength requirements indicators */}
              {password && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="grid grid-cols-2 gap-1.5 pt-0.5"
                >
                  {passwordRequirements.map((req, index) => {
                    const passed = req.test(password);
                    return (
                      <motion.div
                        key={req.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className="flex items-center gap-1.5"
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border transition-colors ${passed
                            ? 'bg-emerald-500/20 border-emerald-500/35 text-emerald-400'
                            : 'bg-black/5 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-450 dark:text-gray-600'
                            }`}
                        >
                          {passed && <Check className="w-2.5 h-2.5" />}
                        </div>
                        <span
                          className={`text-[9px] ${passed
                            ? 'text-emerald-400 font-medium'
                            : 'text-gray-550 dark:text-gray-500'
                            }`}
                        >
                          {req.label}
                        </span>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider pl-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white dark:bg-[#0a0712] border border-gray-300 dark:border-white/[0.06] hover:border-gray-400 dark:hover:border-white/[0.12] focus:border-[#a855f7]/50 focus:ring-1 focus:ring-[#a855f7]/10 rounded-2xl py-3.5 pl-12 pr-12 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-600 transition-all outline-none"
                    disabled={isLoading}
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <span className="text-xs text-red-400 pl-1">Passwords do not match</span>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !isPasswordValid}
                className="w-full h-12 rounded-full bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-550 hover:to-indigo-600 text-white font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(139,92,246,0.25)] hover:shadow-[0_0_25px_rgba(139,92,246,0.4)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <>
                    Update Password <span className="text-white/80">→</span>
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

export default ResetPasswordPage;
