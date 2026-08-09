import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageCircle,
  Heart,
  BookOpen,
  Calendar,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Shield,
  CreditCard,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@hooks/useRedux';
import { toggleSidebar, setSidebarOpen, openModal, closeModal } from '@redux/slices/uiSlice';
import { cn } from '@utils/cn';

const userMenuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'AI Therapist', path: '/chat', icon: MessageCircle },
  { name: 'Mood Tracker', path: '/mood', icon: Heart },
  { name: 'Journal', path: '/journal', icon: BookOpen },
  { name: 'Appointments', path: '/appointments', icon: Calendar },
  { name: 'Community', path: '/community', icon: Users },
  { name: 'Payments', path: '/payments', icon: CreditCard },
];

const therapistMenuItems = [
  { name: 'Dashboard', path: '/therapist?tab=dashboard', icon: LayoutDashboard },
  { name: 'Consultation Room', path: '/consultation', icon: MessageCircle },
  { name: 'Appointments', path: '/therapist?tab=appointments', icon: Calendar },
  { name: 'Availability', path: '/therapist?tab=availability', icon: Sparkles },
  { name: 'Session Notes', path: '/therapist?tab=notes', icon: BookOpen },
];

const adminMenuItems = [
  { name: 'Admin Overview', path: '/admin?tab=overview', icon: LayoutDashboard },
  { name: 'User Management', path: '/admin?tab=users', icon: Users },
  { name: 'Therapist Accounts', path: '/admin?tab=therapists', icon: Shield },
  { name: 'Applications', path: '/admin?tab=applications', icon: Activity },
  { name: 'Appointments', path: '/admin?tab=appointments', icon: Calendar },
  { name: 'Payments', path: '/admin?tab=payments', icon: CreditCard },
  { name: 'Moderation', path: '/admin?tab=moderation', icon: ShieldAlert },
];

const affirmations = [
  "You are doing better than you think.",
  "One small step is still progress.",
  "You do not have to finish everything at once.",
  "Breathe gently. You are safe in this moment.",
  "Your feelings are valid.",
  "You are worthy of care and compassion.",
  "It is okay to rest when you are tired.",
  "You are stronger than the challenges you face.",
  "Today is a new opportunity for growth.",
  "Be kind to yourself today.",
  "You are a work in progress, and that is beautiful.",
  "Your potential is limitless.",
  "Trust the timing of your life.",
  "You are enough, exactly as you are.",
  "Give yourself permission to take a break.",
  "Quiet your mind and listen to your heart.",
  "Success is not final, failure is not fatal.",
  "You possess the strength to overcome.",
  "Your pace is perfectly fine.",
  "Inhale peace, exhale worry.",
  "Small victories are still victories.",
  "You have the power to create change.",
  "Focus on what you can control.",
  "Your mental health is a priority.",
  "You are not alone in your journey.",
  "Allow yourself to feel and heal.",
  "Every day is a chance to start again.",
  "You deserve to be happy.",
  "Your best is enough.",
  "Believe in the power of yet."
];

const bottomMenuItems = [
  { name: 'Need urgent help?', icon: ShieldAlert, emergency: true },
];

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white dark:bg-calm-900 rounded-3xl shadow-2xl overflow-hidden border border-coral-200 dark:border-coral-900/30"
          >
            <div className="p-8 space-y-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-coral-100 dark:bg-coral-500/10 flex items-center justify-center text-coral-500 shadow-lg shadow-coral-500/10">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-calm-800 dark:text-white">Need urgent help?</h3>
                  <p className="mt-2 text-sm text-calm-600 dark:text-calm-400 leading-relaxed font-medium">
                    If you feel unsafe or are in immediate danger, please contact local emergency services or reach out to someone you trust right now.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-calm-50 dark:bg-white/5 border border-calm-100 dark:border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-calm-400 font-bold">Emergency Services</p>
                    <p className="text-lg font-bold text-calm-800 dark:text-white">Dial 112</p>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">24/7 Available</div>
                </div>

                <div className="p-4 rounded-2xl bg-calm-50 dark:bg-white/5 border border-calm-100 dark:border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-calm-400 font-bold">Helpdesk (India)</p>
                    <p className="text-base font-bold text-lavender-600 dark:text-lavender-400">KIRAN 1800-599-0019</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-calm-50 dark:bg-white/5 border border-calm-100 dark:border-white/5">
                  <p className="text-[10px] uppercase tracking-wider text-calm-400 font-bold mb-1">Trusted Person Reminder</p>
                  <p className="text-sm font-medium text-calm-600 dark:text-calm-300">Call a friend, family member, or someone nearby.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-4 rounded-2xl bg-coral-500 text-white font-bold hover:bg-coral-600 transition-all shadow-lg shadow-coral-500/20"
                >
                  I understand
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/chat');
                    }}
                    className="flex-1 py-3 rounded-2xl bg-lavender-100 dark:bg-lavender-500/10 text-lavender-600 dark:text-lavender-400 text-sm font-bold hover:bg-lavender-200 dark:hover:bg-lavender-500/20 transition-all"
                  >
                    AI Therapist
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 rounded-2xl border border-calm-200 dark:border-calm-700 text-calm-600 dark:text-calm-400 text-sm font-bold hover:bg-calm-50 dark:hover:bg-calm-800 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const Sidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { isSidebarOpen } = useAppSelector((state) => state.ui);
  const { profile } = useAppSelector((state) => state.auth);
  const { activeModal } = useAppSelector((state) => state.ui);

  const [searchParams] = useSearchParams();

  const getDailyAffirmation = () => {
    const today = new Date();
    const index = (today.getDate() + today.getMonth() * 31 + today.getFullYear()) % affirmations.length;
    return affirmations[index];
  };

  React.useEffect(() => {
    if (window.innerWidth >= 768) {
      dispatch(setSidebarOpen(true));
    }
  }, [dispatch]);

  const renderMenuItem = (item: any, _isBottom = false) => {
    const isEmergency = item.emergency;

    const isActive = (() => {
      if (isEmergency) return false;

      const normPath = location.pathname.replace(/\/$/, '');
      const [itemPathname, itemSearch] = item.path.split('?');
      const normItemPath = itemPathname.replace(/\/$/, '');

      if (normPath === '/consultation') {
        return item.name === 'Consultation Room';
      }

      if (normPath === '/therapist') {
        if (normItemPath !== '/therapist') return false;

        const currentTab = searchParams.get('tab')?.toLowerCase() || 'dashboard';
        const itemParams = new URLSearchParams(itemSearch || '');
        const itemTab = itemParams.get('tab')?.toLowerCase() || 'dashboard';

        return currentTab === itemTab;
      }

      if (normPath === '/admin') {
        if (normItemPath !== '/admin') return false;

        const currentTab = searchParams.get('tab')?.toLowerCase() || 'overview';
        const itemParams = new URLSearchParams(itemSearch || '');
        const itemTab = itemParams.get('tab')?.toLowerCase() || 'overview';

        return currentTab === itemTab;
      }

      if (normItemPath === '/dashboard') {
        return normPath === '/dashboard';
      }
      return normPath.startsWith(normItemPath);
    })();

    const content = (
      <>
        <div
          className={cn(
            'w-9 h-9 flex items-center justify-center transition-all duration-300 shrink-0',
            isEmergency
              ? 'bg-red-500/10 text-red-500 rounded-xl shadow-sm shadow-red-500/10'
              : isActive
                ? 'text-white'
                : 'text-calm-400 group-hover:text-lavender-500'
          )}
        >
          <item.icon className="w-5 h-5" />
        </div>
        <AnimatePresence mode="wait">
          {isSidebarOpen && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className={cn(
                "text-sm font-semibold transition-colors duration-300",
                isActive ? "text-white" : "text-calm-500 dark:text-calm-400 group-hover:text-calm-700 dark:group-hover:text-calm-200"
              )}
            >
              {item.name}
            </motion.span>
          )}
        </AnimatePresence>
      </>
    );

    const baseClass = cn(
      'flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 relative group border border-transparent',
      isEmergency
        ? 'bg-red-500/5 text-red-600 dark:text-red-400 hover:bg-red-500/10 mb-2'
        : isActive
          ? 'bg-gradient-to-r from-lavender-500 to-accent-500 text-white shadow-glow border-lavender-400/20 active'
          : 'hover:bg-white/10 dark:hover:bg-white/5'
    );

    if (isEmergency) {
      return (
        <button
          key={item.name}
          onClick={() => dispatch(openModal('emergency'))}
          className={baseClass}
        >
          {content}
        </button>
      );
    }

    return (
      <Link
        key={item.name + item.path}
        to={item.path}
        className={baseClass}
      >
        {content}
      </Link>
    );
  };

  return (
    <>
      <EmergencyModal
        isOpen={activeModal === 'emergency'}
        onClose={() => dispatch(closeModal())}
      />

      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className={cn(
          'fixed left-0 top-20 bottom-0 z-40',
          'rounded-none overflow-hidden',
          'bg-white/80 dark:bg-calm-900/80',
          'backdrop-blur-xl backdrop-saturate-150',
          'border-r border-white/20 dark:border-white/10',
          'shadow-sm',
          'transition-all duration-300 ease-out hidden md:block'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Removed top branding section to avoid duplication with Navbar */}

          {/* Removed top reminder card - moved to bottom */}

          {/* Toggle Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => dispatch(toggleSidebar())}
            className={cn(
              'absolute -right-3 top-20 w-6 h-6 rounded-full',
              'bg-white dark:bg-calm-800',
              'border border-calm-200 dark:border-calm-700',
              'shadow-md flex items-center justify-center',
              'text-calm-500 hover:text-lavender-500 transition-colors'
            )}
          >
            {isSidebarOpen ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </motion.button>

          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
            {(profile?.role === 'admin' ? adminMenuItems :
              profile?.role === 'therapist' ? therapistMenuItems :
                userMenuItems).map((item) => renderMenuItem(item))}
          </nav>

          {/* Today's Reminder Card (Moved to bottom section) */}
          <AnimatePresence>
            {isSidebarOpen && profile?.role === 'user' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 mx-4 my-4 rounded-xl bg-gradient-to-br from-lavender-500/5 to-accent-500/5 border border-lavender-500/10 dark:border-white/5"
              >
                <div className="flex items-center gap-2 mb-1.5 text-lavender-600 dark:text-lavender-400">
                  <Sparkles className="w-3 h-3" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Today's Reminder</span>
                </div>
                <p className="text-[11px] text-calm-600 dark:text-calm-300 font-medium leading-relaxed italic">
                  "{getDailyAffirmation()}"
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Menu & Emergency */}
          <div className="p-4 border-t border-calm-200/50 dark:border-calm-700/50 space-y-1">
            {bottomMenuItems
              .filter(item => {
                if (item.emergency) return profile?.role === 'user';
                return true;
              })
              .map((item) => renderMenuItem(item, true))}
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
