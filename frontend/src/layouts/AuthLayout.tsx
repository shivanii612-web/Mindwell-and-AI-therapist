import React from 'react';
import { Outlet, Navigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import backgroundImage from '../assets/background.png';

// Custom Organic Leaf Logo SVG
export const BrandLogoIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6 text-violet-400" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22C12 22 20 18 20 12C20 6.5 15.5 4 12 2C8.5 4 4 6.5 4 12C4 18 12 22 12 22Z" />
    <path d="M12 2V22" />
    <path d="M12 8C14 9.5 17 10 17 10" />
    <path d="M12 12C14 13.5 18 14 18 14" />
    <path d="M12 16C14 17.5 16 18 16 18" />
    <path d="M12 8C10 9.5 7 10 7 10" />
    <path d="M12 12C10 13.5 6 14 6 14" />
    <path d="M12 16C10 17.5 8 18 8 18" />
  </svg>
);

export const AuthLayout: React.FC = () => {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const location = useLocation();
  const isResetPage = location.pathname.includes('reset-password');
  const isLoginPage = location.pathname.includes('/login') || location.pathname.includes('/signin');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07050d] flex items-center justify-center">
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
          className="w-16 h-16 rounded-full bg-violet-600/30 border border-violet-500/30 flex items-center justify-center"
        >
          <Heart className="w-8 h-8 text-violet-400" />
        </motion.div>
      </div>
    );
  }

  if (isAuthenticated && !isResetPage) {
    const role = profile?.role || 'user';
    if (role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (role === 'therapist') {
      return <Navigate to="/therapist" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  const headline = (
    <>
      A new <br />
      <span className="text-[#a855f7]">beginning</span> <br />
      for your <br />
      <span className="text-[#a855f7]">mind.</span>
    </>
  );

  const description = isLoginPage
    ? "Connect with licensed therapists, track your mood, journal your thoughts, and build healthy habits in one peaceful place."
    : "MindWell is your safe space to reflect, heal and grow becoming the best version of you.";

  return (
    <div className="min-h-screen w-full relative flex flex-col lg:flex-row items-start justify-between p-6 lg:p-20 lg:pt-24 lg:pb-16 overflow-x-hidden font-sans select-none bg-[#f8f6fc] dark:bg-[#09070f]">
      {/* Background Image Container */}
      <div 
        className="absolute inset-0 z-0 opacity-85"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      {/* Premium dark gradient overlay to make text pop while keeping the background visible */}
      <div className="absolute inset-0 bg-[#f8f6fc]/30 dark:bg-[#09070f]/35 z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#f8f6fc]/90 via-transparent to-[#f8f6fc]/85 dark:from-[#09070f]/90 dark:via-transparent dark:to-[#09070f]/85 z-0 pointer-events-none" />
      
      {/* Ambient Lighting / Glows */}
      <div className="absolute top-1/3 left-1/4 w-[35rem] h-[35rem] bg-purple-900/20 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-10 right-10 w-[25rem] h-[25rem] bg-indigo-950/25 rounded-full blur-[130px] pointer-events-none z-0" />

      {/* ================= LEFT SIDE (BRAND & HERO) ================= */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 flex-col relative z-10 space-y-16 pl-4"
      >
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3.5 w-fit cursor-pointer pt-6">
          <Heart className="w-9 h-9 text-[#a855f7] fill-[#a855f7]/10 shrink-0" />
          <span className="text-[36px] font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">
            Mind<span className="text-[#a855f7]">Well</span>
          </span>
        </Link>

        {/* Hero Text and Botanical Divider */}
        <div className="space-y-6 max-w-md pt-6">
          <h1 className="text-[52px] leading-[1.12] font-extrabold text-gray-900 dark:text-white tracking-tight">
            {headline}
          </h1>
          
          {/* Botanical Divider */}
          <div className="flex items-center gap-2 w-32 py-1 text-violet-500/60">
            <div className="h-[1px] w-12 bg-violet-500/40" />
            <svg className="w-3.5 h-3.5 text-violet-400/80 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.25a.75.75 0 0 1 .75.75v3.19a5.25 5.25 0 0 1 3.52 3.52h3.19a.75.75 0 0 1 0 1.5h-3.19a5.25 5.25 0 0 1-3.52 3.52v3.19a.75.75 0 0 1-1.5 0v-3.19a5.25 5.25 0 0 1-3.52-3.52H5.06a.75.75 0 0 1 0-1.5h3.19a5.25 5.25 0 0 1 3.52-3.52V3a.75.75 0 0 1 .75-.75Z" />
            </svg>
            <div className="h-[1px] w-6 bg-violet-500/40" />
          </div>

          <p className="text-gray-600 dark:text-gray-300 text-[15px] leading-[1.6] font-light max-w-[320px]">
            {description}
          </p>
        </div>
      </motion.div>

      {/* ================= RIGHT SIDE (FORM CONTAINER) ================= */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-1/2 flex items-start justify-center lg:justify-end relative z-10"
      >
        <div className="w-full max-w-[480px]">
          <Outlet />
        </div>
      </motion.div>
    </div>
  );
};

export default AuthLayout;