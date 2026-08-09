import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, Check, Heart } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@hooks/useRedux';
import { signUp, clearError } from '@redux/slices/authSlice';
import toast from 'react-hot-toast';

const passwordRequirements = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'Contains a number', test: (p: string) => /\d/.test(p) },
  { label: 'Contains uppercase', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Contains lowercase', test: (p: string) => /[a-z]/.test(p) },
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());

    const normalizedEmail = email.trim().toLowerCase();
    if (!fullName || !normalizedEmail || !password || !confirmPassword) { toast.error('Please fill in all fields'); return; }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) { toast.error('Please enter a valid email address.'); return; }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }

    const result = await dispatch(signUp({ email: normalizedEmail, password, fullName, username }));

    if (signUp.fulfilled.match(result)) {
      if (result.payload.token) {
        toast.success('Account created successfully!');
        navigate('/dashboard');
      } else {
        toast.error('Account created, please log in.');
        navigate('/login');
      }
    } else if (signUp.rejected.match(result)) {
      toast.error(result.payload as string || 'Signup failed');
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
      <div className="w-full rounded-[32px] border border-violet-500/15 bg-white/90 dark:bg-[#0a0712]/80 backdrop-blur-xl shadow-[0_24px_60px_rgba(0,0,0,0.06),0_0_40px_rgba(139,92,246,0.02)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(139,92,246,0.05)] px-10 py-10 relative overflow-hidden">

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
              Create your <br />
              <span className="text-[#a855f7]">MindWell</span> account
            </h2>
            <div className="flex items-center justify-center gap-2 pt-2 text-violet-500/60">
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
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 tracking-wider uppercase pl-0.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-[52px] bg-white dark:bg-[#0a0712] border border-gray-300 dark:border-white/[0.06] hover:border-gray-400 dark:hover:border-white/[0.12] focus:border-[#a855f7]/50 focus:ring-1 focus:ring-[#a855f7]/10 rounded-2xl pl-11 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 transition-all outline-none"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 tracking-wider uppercase pl-0.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setConfirmPassword(e.target.value);
                  }}
                  disabled={isLoading}
                  className="w-full h-[52px] bg-white dark:bg-[#0a0712] border border-gray-300 dark:border-white/[0.06] hover:border-gray-400 dark:hover:border-white/[0.12] focus:border-[#a855f7]/50 focus:ring-1 focus:ring-[#a855f7]/10 rounded-2xl pl-11 pr-12 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 transition-all outline-none"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#a855f7] dark:text-gray-500 dark:hover:text-violet-400 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength */}
              {password && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  className="grid grid-cols-2 gap-1.5 pt-1">
                  {passwordRequirements.map((req, i) => {
                    const ok = req.test(password);
                    return (
                      <motion.div key={req.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }} className="flex items-center gap-1.5">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border transition-colors ${ok ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-white/10'}`}>
                          {ok && <Check className="w-2.5 h-2.5" />}
                        </div>
                        <span className={`text-[9px] transition-colors ${ok ? 'text-emerald-400 font-medium' : 'text-gray-600'}`}>
                          {req.label}
                        </span>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
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
                <>Create Account <span className="text-white/80">→</span></>
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
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300 transition-colors">
              Sign in →
            </Link>
          </p>

          {/* Therapist apply CTA */}
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 pt-1">
            Interested in becoming a therapist?{' '}
            <Link to="/therapist-apply" className="font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors">
              Apply Here →
            </Link>
          </p>

        </div>
      </div>
    </motion.div>
  );
};

export default SignupPage;
