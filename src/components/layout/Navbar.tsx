import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  Menu,
  X,
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
import { useGetSubscriptionQuery } from '@redux/api/apiSlice';

// Removed duplicate navLinks to consolidate navigation in Sidebar

export const Navbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, profile } = useAppSelector((state) => state.auth);
  const { isDarkMode, isMobileMenuOpen } = useAppSelector((state) => state.ui);
  const { data: subscriptionData } = useGetSubscriptionQuery();
  const notifications = useAppSelector((state) => state.notifications);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      console.log('MindWell: Initiating Sign Out...');
      await dispatch(signOut()).unwrap();
      console.log('MindWell: Sign Out Successful, Redirecting...');
      navigate('/login');
    } catch (error) {
      console.error('MindWell: Sign Out Error:', error);
      // Force navigation to login even if logout thunk has issues
      navigate('/login');
    }
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="mx-4 mt-4">
        <div
          className={cn(
            'rounded-2xl px-6 py-3',
            'bg-white/80 dark:bg-calm-900/80',
            'backdrop-blur-xl backdrop-saturate-150',
            'border border-white/20 dark:border-white/10',
            'shadow-glass dark:shadow-glassDark'
          )}
        >
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-lavender-500 to-accent-500 flex items-center justify-center"
              >
                <Heart className="w-6 h-6 text-white" />
              </motion.div>
              <span className="text-xl font-bold bg-gradient-to-r from-lavender-600 to-accent-600 bg-clip-text text-transparent">
                MindWell
              </span>
            </Link>

            {/* Page Indicator / Breadcrumb */}
            <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-calm-50/50 dark:bg-white/5 border border-white/20 dark:border-white/5 backdrop-blur-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-calm-400 dark:text-calm-500">MindWell</span>
              <span className="text-calm-300 dark:text-calm-600">/</span>
              <span className="text-sm font-medium text-calm-800 dark:text-white capitalize">
                {location.pathname.split('/')[1] || 'Dashboard'}
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
                  <div ref={notificationRef} className="relative">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="relative p-2 rounded-xl hover:bg-calm-100 dark:hover:bg-calm-800 transition-colors"
                    >
                      <Bell className="w-5 h-5 text-calm-600 dark:text-calm-300" />
                      {notifications.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-coral-500 text-white text-xs rounded-full flex items-center justify-center">
                          {notifications.unreadCount}
                        </span>
                      )}
                    </motion.button>
                  </div>

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
                      {subscriptionData?.subscription?.planName && subscriptionData.subscription.planName !== 'Free' && (
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
          </div>
        </div>

        {/* Removed duplicate mobile menu links as they are in Sidebar */}
      </div>
    </motion.nav>
  );
};

export default Navbar;
