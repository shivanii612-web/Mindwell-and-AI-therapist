import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  Moon,
  Sun,
  Heart,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@hooks/useRedux';
import { toggleDarkMode, setMobileMenuOpen } from '@redux/slices/uiSlice';
import { signOut } from '@redux/slices/authSlice';
import { cn } from '@utils/cn';
import { Avatar, Badge } from '@components/ui/Layout';
import {
  apiSlice,
  useGetSubscriptionQuery,
} from '@redux/api/apiSlice';
import { getConsultationSocket, forceDisconnectConsultationSocket } from '@lib/consultationSocket';

// Removed duplicate navLinks to consolidate navigation in Sidebar

export const Navbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, profile } = useAppSelector((state) => state.auth);
  const { isDarkMode, isMobileMenuOpen } = useAppSelector((state) => state.ui);
  const { data: subscriptionData } = useGetSubscriptionQuery();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);


  const getPageName = (path: string) => {
    switch (path) {
      case '/dashboard':
        return 'Dashboard';
      case '/chat':
        return 'AI Therapist';
      case '/mood':
        return 'Mood Tracker';
      case '/journal':
        return 'Journal';
      case '/appointments':
        return 'Appointments';
      case '/community':
        return 'Community';
      case '/settings':
        return 'Settings';
      default:
        const segment = path.split('/')[1] || '';
        return segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : 'Dashboard';
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const socket = getConsultationSocket();
    if (!socket.connected) {
      socket.connect();
    }

    const handleAppointmentTaken = () => {
      dispatch(apiSlice.util.invalidateTags(['Appointment']));
    };

    const handleAppointmentAccepted = () => {
      dispatch(apiSlice.util.invalidateTags(['Appointment']));
    };
    
    socket.on('appointment_taken', handleAppointmentTaken);
    socket.on('appointment_accepted', handleAppointmentAccepted);
    
    return () => {
      socket.off('appointment_taken', handleAppointmentTaken);
      socket.off('appointment_accepted', handleAppointmentAccepted);
    };
  }, [isAuthenticated, dispatch]);

  const handleSignOut = async () => {
    try {
      forceDisconnectConsultationSocket();
      await dispatch(signOut()).unwrap();
      navigate('/login');
    } catch (error) {
      // Force navigation to login even if logout thunk has issues
      navigate('/login');
    }
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={cn(
        "fixed top-0 left-0 right-0 h-20 w-full z-50 px-6 py-4 flex items-center justify-between",
        "bg-white/80 dark:bg-calm-900/80",
        "backdrop-blur-xl backdrop-saturate-150",
        "border-b border-white/20 dark:border-white/10",
        "shadow-sm"
      )}
    >
      {/* Logo - visible on all layouts */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
            className="w-8 h-8 rounded-xl bg-gradient-to-br from-lavender-500 to-accent-500 flex items-center justify-center"
          >
            <Heart className="w-5 h-5 text-white" />
          </motion.div>
          <span className="text-lg font-bold text-calm-800 dark:text-white">
            MindWell
          </span>
        </Link>
      </div>

      {/* Page Indicator / Breadcrumb */}
      <div className="hidden md:flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-calm-50/50 dark:bg-white/5 border border-white/20 dark:border-white/5 backdrop-blur-sm">
        <span className="text-sm font-light text-calm-500 dark:text-calm-400 capitalize">Portal</span>
        <span className="text-calm-300 dark:text-calm-600">/</span>
        <span className="text-sm font-bold text-calm-800 dark:text-white capitalize">
          {getPageName(location.pathname)}
        </span>
      </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => dispatch(toggleDarkMode())}
                className="p-2 rounded-xl hover:bg-calm-100 dark:hover:bg-calm-800 transition-colors"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-amber-500" />
                ) : (
                  <Moon className="w-5 h-5 text-lavender-500" />
                )}
              </motion.button>

              {isAuthenticated ? (
                <>
                  {/* Notifications */}
                  {/* Profile Menu */}
                  <div ref={profileMenuRef} className="relative">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                      className="flex items-center gap-2 p-1 pl-3 pr-2 rounded-xl hover:bg-calm-100 dark:hover:bg-calm-800 transition-colors"
                    >
                      <span className="hidden sm:block text-sm font-medium text-calm-700 dark:text-calm-200">
                        {profile?.full_name || 'User'}
                      </span>
                      {profile?.role !== 'therapist' && profile?.role !== 'admin' && subscriptionData?.subscription?.planName && subscriptionData.subscription.planName !== 'Free' && (
                        <Badge variant={subscriptionData.subscription.planName === 'Pro Wellness' ? 'primary' : 'secondary'} size="sm">
                          {subscriptionData.subscription.planName}
                        </Badge>
                      )}
                      <Avatar
                        src={profile?.avatar_url}
                        size="sm"
                        alt={profile?.full_name || profile?.email || 'User'}
                      />
                      <ChevronDown className="w-4 h-4 text-calm-400" />
                    </motion.button>

                    <AnimatePresence>
                      {showProfileMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className={cn(
                            'absolute right-0 mt-2 w-56 rounded-2xl p-2',
                            'bg-white/95 dark:bg-calm-900/95 backdrop-blur-xl',
                            'border border-white/20 dark:border-white/10',
                            'shadow-xl'
                          )}
                        >
                          <button
                            onClick={() => {
                              setShowProfileMenu(false);
                              navigate('/settings');
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-calm-100 dark:hover:bg-calm-800 transition-colors text-left"
                          >
                            <User className="w-4 h-4 text-calm-500" />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-calm-700 dark:text-calm-200">
                                My Profile
                              </span>
                              <span className="text-[10px] text-calm-400 truncate max-w-[140px]">
                                {profile?.email}
                              </span>
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              setShowProfileMenu(false);
                              navigate('/settings');
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-calm-100 dark:hover:bg-calm-800 transition-colors text-left"
                          >
                            <Settings className="w-4 h-4 text-calm-500" />
                            <span className="text-sm font-medium text-calm-700 dark:text-calm-200">
                              Settings
                            </span>
                          </button>
                          <div className="my-2 h-px bg-calm-200 dark:bg-calm-700 opacity-50" />
                          <button
                            onClick={() => {
                              setShowProfileMenu(false);
                              handleSignOut();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-coral-50 dark:hover:bg-coral-900/20 transition-colors group"
                          >
                            <LogOut className="w-4 h-4 text-coral-500 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-semibold text-coral-500">
                              Sign Out
                            </span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-xl text-sm font-medium text-calm-600 dark:text-calm-300 hover:bg-calm-100 dark:hover:bg-calm-800 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-lavender-500 to-accent-500 hover:from-lavender-600 hover:to-accent-600 transition-all shadow-glow"
                  >
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => dispatch(setMobileMenuOpen(!isMobileMenuOpen))}
                className="lg:hidden p-2 rounded-xl hover:bg-calm-100 dark:hover:bg-calm-800 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-calm-600 dark:text-calm-300" />
                ) : (
                  <Menu className="w-5 h-5 text-calm-600 dark:text-calm-300" />
                )}
              </motion.button>
            </div>
    </motion.nav>
  );
};

export default Navbar;
