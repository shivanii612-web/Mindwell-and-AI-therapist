import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';
import { useAppSelector } from '../hooks/useRedux';
import { cn } from '../utils/cn';

export const DashboardLayout: React.FC = () => {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const { isSidebarOpen } = useAppSelector((state) => state.ui);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  if (!isAuthenticated && !isLoading) {
    return <Navigate to="/login" replace />;
  }

  const role = profile?.role || 'user';
  const path = location.pathname;

  const userOnlyPrefixes = ['/dashboard', '/chat', '/mood', '/journal', '/appointments', '/community', '/payments', '/pricing'];
  const therapistOnlyPrefixes = ['/therapist'];
  const adminOnlyPrefixes = ['/admin'];

  const matchesPrefix = (currentPath: string, prefixes: string[]) => {
    return prefixes.some(prefix => currentPath === prefix || currentPath.startsWith(prefix + '/'));
  };

  if (role === 'admin') {
    if (matchesPrefix(path, userOnlyPrefixes) || matchesPrefix(path, therapistOnlyPrefixes)) {
      return <Navigate to="/admin" replace />;
    }
  } else if (role === 'therapist') {
    if (matchesPrefix(path, userOnlyPrefixes) || matchesPrefix(path, adminOnlyPrefixes)) {
      return <Navigate to="/therapist" replace />;
    }
  } else {
    // role === 'user'
    if (matchesPrefix(path, therapistOnlyPrefixes) || matchesPrefix(path, adminOnlyPrefixes)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-lavender-50 via-white to-primary-50 dark:from-calm-950 dark:via-calm-900 dark:to-calm-950 overflow-hidden relative">
      <Navbar />
      <div className="pt-20 flex flex-1 overflow-hidden w-full relative">
        <Sidebar />
        <main
        className={cn(
       "flex-1 h-full transition-all duration-300 ease-out",
         path === "/chat"
         ? "overflow-hidden p-0"
          : "overflow-y-auto px-8 py-8"
           )}
          style={{
          marginLeft: !isMobile
          ? (isSidebarOpen ? "280px" : "88px")
          : "0px",
          }}
          >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-7xl mx-auto"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
