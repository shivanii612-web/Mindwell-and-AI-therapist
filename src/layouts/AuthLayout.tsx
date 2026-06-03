import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const AuthLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const isResetPage = location.pathname.includes('reset-password');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-primary-50 dark:from-calm-950 dark:via-calm-900 dark:to-calm-950 flex items-center justify-center">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lavender-500 to-accent-500"
        />
      </div>
    );
  }

  if (isAuthenticated && !isResetPage) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-primary-50 dark:from-calm-950 dark:via-calm-900 dark:to-calm-950 flex auth-container">
      {/* Left Side - Branding */}
      <motion.div
        initial={{ opacity: 0, x: -50, rotate: 0, scale: 1 }}
        animate={{ opacity: 1, x: 0, rotate: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between relative overflow-hidden auth-left-section"
      >
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-lavender-500/20 via-accent-500/20 to-primary-500/20 dark:from-lavender-900/20 dark:via-accent-900/20 dark:to-primary-900/20" />

        {/* Floating Elements */}
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-20 right-20"
        >
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-lavender-400/30 to-accent-400/30 blur-2xl" />
        </motion.div>
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-40 left-20"
        >
          <div className="w-40 h-40 rounded-full bg-gradient-to-br from-primary-400/30 to-cyan-400/30 blur-2xl" />
        </motion.div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-lavender-500 to-accent-500 flex items-center justify-center shadow-glow"
            >
              <Heart className="w-7 h-7 text-white" />
            </motion.div>
            <span className="text-3xl font-bold bg-gradient-to-r from-lavender-600 to-accent-600 bg-clip-text text-transparent">
              MindWell
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-5xl font-bold text-calm-800 dark:text-white leading-tight">
              Your journey to
              <span className="block bg-gradient-to-r from-lavender-600 to-accent-600 bg-clip-text text-transparent">
                mental wellness
              </span>
              starts here
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg text-calm-600 dark:text-calm-300 max-w-md"
          >
            Connect with licensed therapists, track your mood, journal your thoughts, and
            join a supportive community - all in one place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap gap-4"
          >
            {[
              'AI Therapist',
              'Mood Tracking',
              'Video Sessions',
              'Community Support',
            ].map((feature, index) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-white/10 backdrop-blur-sm border border-white/20"
              >
                <Sparkles className="w-4 h-4 text-lavender-500" />
                <span className="text-sm font-medium text-calm-700 dark:text-calm-200">
                  {feature}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div className="relative z-10 text-sm text-calm-500 dark:text-calm-400">
          Trusted by 50,000+ users worldwide
        </div>
      </motion.div>

      {/* Right Side - Auth Form */}
      <motion.div
        initial={{ opacity: 0, x: 50, rotate: 0, scale: 1 }}
        animate={{ opacity: 1, x: 0, rotate: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-1/2 flex items-center justify-center p-8 auth-right-section"
      >
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </motion.div>
    </div>
  );
};

export default AuthLayout;
