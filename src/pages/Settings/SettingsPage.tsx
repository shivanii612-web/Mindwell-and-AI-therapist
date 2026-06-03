import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User as UserIcon,
    Shield,
    Sun,
    Moon,
    Bell,
    Lock,
    Mail,
    LifeBuoy,
    LogOut,
    ChevronRight,
    ShieldCheck,
    Eye,
    Settings as SettingsIcon,
    X,
    EyeOff,
    MessageSquare,
    AlertCircle,
    Send
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@hooks/useRedux';
import { toggleDarkMode } from '@redux/slices/uiSlice';
import { signOut } from '@redux/slices/authSlice';
import { useChangePasswordMutation, useContactSupportMutation } from '@redux/api/apiSlice';
import { GlassCard, Badge, Avatar } from '@components/ui/Layout';
import { cn } from '@utils/cn';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Sun },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'support', label: 'Support', icon: LifeBuoy },
];

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [changePassword, { isLoading }] = useChangePasswordMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error('All fields are required');
            return;
        }

        if (newPassword.length < 8) {
            toast.error('New password must be at least 8 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        try {
            const response = await changePassword({ currentPassword, newPassword }).unwrap();
            toast.success(response.message || 'Password updated successfully');
            onClose();
            // Clear fields
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            toast.error(err.data?.error || 'Failed to update password');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                        className="relative w-full max-w-md bg-white dark:bg-calm-900 rounded-3xl shadow-2xl overflow-hidden border border-calm-200 dark:border-calm-800"
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-calm-800 dark:text-white flex items-center gap-2">
                                    <Lock className="w-5 h-5 text-lavender-500" />
                                    Change Password
                                </h3>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-calm-100 dark:hover:bg-calm-800 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-calm-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-calm-600 dark:text-calm-400 mb-1.5">
                                        Current Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showCurrent ? "text" : "password"}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-calm-50 dark:bg-calm-800 border border-calm-200 dark:border-calm-700 text-calm-800 dark:text-white focus:ring-2 focus:ring-lavender-500/20"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrent(!showCurrent)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-calm-400 hover:text-calm-600"
                                        >
                                            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-calm-600 dark:text-calm-400 mb-1.5">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showNew ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-calm-50 dark:bg-calm-800 border border-calm-200 dark:border-calm-700 text-calm-800 dark:text-white focus:ring-2 focus:ring-lavender-500/20"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNew(!showNew)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-calm-400 hover:text-calm-600"
                                        >
                                            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="mt-1 text-[10px] text-calm-400">Minimum 8 characters</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-calm-600 dark:text-calm-400 mb-1.5">
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirm ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-calm-50 dark:bg-calm-800 border border-calm-200 dark:border-calm-700 text-calm-800 dark:text-white focus:ring-2 focus:ring-lavender-500/20"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(!showConfirm)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-calm-400 hover:text-calm-600"
                                        >
                                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-4 rounded-2xl bg-lavender-500 text-white font-bold hover:bg-lavender-600 transition-all shadow-lg shadow-lavender-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Updating...' : 'Update Password'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

interface SupportModalProps {
    isOpen: boolean;
    onClose: () => void;
    userProfile: any;
}

const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose, userProfile }) => {
    const [subject, setSubject] = useState('');
    const [category, setCategory] = useState('Account Issue');
    const [message, setMessage] = useState('');
    const [contactSupport, { isLoading }] = useContactSupportMutation();

    const categories = [
        'Account Issue',
        'Appointment Help',
        'Technical Problem',
        'Feedback',
        'Other'
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!subject || !message || !category) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            await contactSupport({ subject, category, message }).unwrap();
            toast.success('Your message has been sent to MindWell support.');
            onClose();
            // Reset form
            setSubject('');
            setMessage('');
            setCategory('Account Issue');
        } catch (err: any) {
            toast.error(err.data?.error || 'Unable to send message right now. Please try again.');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                        className="relative w-full max-w-lg bg-white dark:bg-calm-900 rounded-3xl shadow-2xl overflow-hidden border border-calm-200 dark:border-calm-800"
                    >
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-bold text-calm-800 dark:text-white flex items-center gap-3">
                                    <MessageSquare className="w-6 h-6 text-lavender-500" />
                                    Contact Support
                                </h3>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-calm-100 dark:hover:bg-calm-800 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6 text-calm-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5 text-xs">
                                        <p className="text-calm-400">From:</p>
                                        <p className="font-semibold text-calm-800 dark:text-white">{userProfile?.full_name || 'User'}</p>
                                    </div>
                                    <div className="space-y-1.5 text-xs">
                                        <p className="text-calm-400">Email:</p>
                                        <p className="font-semibold text-lavender-500">{userProfile?.email}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-calm-700 dark:text-calm-300 mb-2">Category</label>
                                    <div className="flex flex-wrap gap-2">
                                        {categories.map((cat) => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => setCategory(cat)}
                                                className={cn(
                                                    "px-4 py-2 rounded-full text-xs font-semibold border transition-all",
                                                    category === cat
                                                        ? "bg-lavender-500 border-lavender-500 text-white shadow-md shadow-lavender-500/20"
                                                        : "border-calm-200 dark:border-calm-700 text-calm-500 hover:border-lavender-500/50"
                                                )}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-calm-700 dark:text-calm-300 mb-2">Subject</label>
                                    <input
                                        type="text"
                                        placeholder="Brief summary of your issue"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-calm-50 dark:bg-calm-800 border border-calm-200 dark:border-calm-700 text-calm-800 dark:text-white focus:ring-2 focus:ring-lavender-500/20 transition-all font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-calm-700 dark:text-calm-300 mb-2">Message</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Describe how we can help you today..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-calm-50 dark:bg-calm-800 border border-calm-200 dark:border-calm-700 text-calm-800 dark:text-white focus:ring-2 focus:ring-lavender-500/20 transition-all font-medium resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4 rounded-2xl bg-lavender-600 hover:bg-lavender-700 text-white font-bold transition-all shadow-xl shadow-lavender-500/20 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        "Sending Message..."
                                    ) : (
                                        <>
                                            Send Support Message
                                            <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export const SettingsPage: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { profile } = useAppSelector((state) => state.auth);
    const { isDarkMode } = useAppSelector((state) => state.ui);

    const [activeTab, setActiveTab] = useState('profile');
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

    // Load persistent settings from localStorage
    const [emailNotifications, setEmailNotifications] = useState(() => {
        return localStorage.getItem('settings_email_notifications') !== 'false';
    });
    const [appointmentReminders, setAppointmentReminders] = useState(() => {
        return localStorage.getItem('settings_appointment_reminders') !== 'false';
    });
    const [privateJournal, setPrivateJournal] = useState(() => {
        return localStorage.getItem('settings_private_journal') !== 'false';
    });

    // Save to localStorage when changed
    useEffect(() => {
        localStorage.setItem('settings_email_notifications', String(emailNotifications));
    }, [emailNotifications]);

    useEffect(() => {
        localStorage.setItem('settings_appointment_reminders', String(appointmentReminders));
    }, [appointmentReminders]);

    useEffect(() => {
        localStorage.setItem('settings_private_journal', String(privateJournal));
    }, [privateJournal]);

    const handleLogout = async () => {
        try {
            toast.loading('Logging out...', { id: 'logout' });
            await dispatch(signOut());
            toast.success('Logged out successfully', { id: 'logout' });
            navigate('/login');
        } catch (error) {
            console.error('MindWell: Logout Error:', error);
            toast.error('Failed to logout', { id: 'logout' });
            // Force navigation anyway to ensure user isn't stuck
            navigate('/login');
        }
    };

    const handleToggleSetting = (setter: React.Dispatch<React.SetStateAction<boolean>>, label: string) => {
        setter(prev => {
            const next = !prev;
            toast.success(`${label} ${next ? 'enabled' : 'disabled'}`);
            return next;
        });
    };

    const handleToggleTheme = () => {
        dispatch(toggleDarkMode());
        toast.success(`${!isDarkMode ? 'Dark' : 'Light'} mode activated`);
    };

    const handleGetHelpNow = () => {
        toast((t) => (
            <div className="flex flex-col gap-2">
                <p className="font-bold text-coral-600 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Emergency Support
                </p>
                <p className="text-sm">If this is an emergency, please contact local emergency services (911/112) or a trusted person immediately.</p>
                <button
                    onClick={() => toast.dismiss(t.id)}
                    className="self-end px-3 py-1 bg-coral-500 text-white rounded-lg text-xs font-bold"
                >
                    Dismiss
                </button>
            </div>
        ), { duration: 6000, position: 'top-center', style: { maxWidth: '400px' } });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            {/* Modals */}
            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
            />
            <SupportModal
                isOpen={isSupportModalOpen}
                onClose={() => setIsSupportModalOpen(false)}
                userProfile={profile}
            />

            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
            >
                <h1 className="text-3xl font-bold text-calm-800 dark:text-white flex items-center gap-3">
                    <SettingsIcon className="w-8 h-8 text-lavender-500" />
                    Settings
                </h1>
                <p className="text-calm-500 dark:text-calm-400 mt-2">
                    Manage your account, preferences, and security
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Navigation Tabs */}
                <div className="space-y-2">
                    {tabs.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left",
                                activeTab === item.id
                                    ? "bg-lavender-500/10 text-lavender-600 dark:text-lavender-400 shadow-sm ring-1 ring-lavender-500/20"
                                    : "text-calm-600 dark:text-calm-400 hover:bg-calm-100 dark:hover:bg-calm-800/50"
                            )}
                        >
                            <item.icon className={cn("w-4 h-4 transition-transform", activeTab === item.id && "scale-110")} />
                            {item.label}
                            {activeTab === item.id && (
                                <motion.div layoutId="activeTabUnderline" className="ml-auto w-1.5 h-1.5 rounded-full bg-lavender-500" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Main Content Areas */}
                <div className="md:col-span-2">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6"
                        >
                            {/* Profile Section */}
                            {activeTab === 'profile' && (
                                <section className="space-y-4">
                                    <h2 className="text-lg font-semibold text-calm-800 dark:text-white px-2">Profile Settings</h2>
                                    <GlassCard className="p-6">
                                        <div className="flex items-center gap-6 mb-8">
                                            <Avatar
                                                src={profile?.avatar_url}
                                                size="xl"
                                                alt={profile?.full_name || profile?.email || 'User'}
                                                className="ring-4 ring-lavender-500/20"
                                            />
                                            <div>
                                                <h3 className="text-xl font-bold text-calm-800 dark:text-white">
                                                    {profile?.full_name || 'Guest User'}
                                                </h3>
                                                <p className="text-calm-500 dark:text-calm-400 text-sm">
                                                    {profile?.email || 'no-email@mindwell.ai'}
                                                </p>
                                                <Badge variant="info" className="mt-2">View Only</Badge>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-calm-600 dark:text-calm-400 mb-1.5">
                                                    Full Name
                                                </label>
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={profile?.full_name || ''}
                                                    className="w-full px-4 py-3 rounded-xl bg-calm-100/50 dark:bg-calm-800/50 border border-calm-200 dark:border-calm-700 text-calm-800 dark:text-white focus:outline-none cursor-not-allowed opacity-80"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-calm-600 dark:text-calm-400 mb-1.5">
                                                    Email Address
                                                </label>
                                                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-calm-100/50 dark:bg-calm-800/50 border border-calm-200 dark:border-calm-700 text-calm-500 italic">
                                                    <Mail className="w-4 h-4" />
                                                    <span>{profile?.email || ''}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </GlassCard>
                                </section>
                            )}

                            {/* Security Section */}
                            {activeTab === 'security' && (
                                <section className="space-y-4">
                                    <h2 className="text-lg font-semibold text-calm-800 dark:text-white px-2">Account Security</h2>
                                    <GlassCard className="p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                    <ShieldCheck className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-calm-800 dark:text-white">Security Status</h4>
                                                    <p className="text-xs text-calm-500">Your account is well protected</p>
                                                </div>
                                            </div>
                                            <Badge variant="success">Secure</Badge>
                                        </div>

                                        <div className="p-4 rounded-xl bg-lavender-500/5 border border-lavender-500/10 mb-6">
                                            <p className="text-xs text-calm-600 dark:text-calm-400 leading-relaxed">
                                                <Lock className="w-3 h-3 inline-block mr-2 text-lavender-500" />
                                                We recommend changing your password every 3-6 months to maintain optimal security. Always use a combination of symbols and numbers.
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            <button
                                                onClick={() => setIsPasswordModalOpen(true)}
                                                className="w-full flex items-center justify-between p-4 rounded-xl border border-calm-200 dark:border-calm-700 hover:bg-calm-50 dark:hover:bg-calm-800 transition-colors group"
                                            >
                                                <span className="text-sm font-medium text-calm-700 dark:text-calm-300">Change Password</span>
                                                <ChevronRight className="w-4 h-4 text-calm-400 group-hover:translate-x-1 transition-transform" />
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center justify-between p-4 rounded-xl border border-coral-200/50 dark:border-coral-900/50 text-coral-500 hover:bg-coral-50 dark:hover:bg-coral-500/5 transition-colors"
                                            >
                                                <span className="text-sm font-semibold flex items-center gap-2">
                                                    <LogOut className="w-4 h-4" />
                                                    Logout from Session
                                                </span>
                                            </button>
                                        </div>
                                    </GlassCard>
                                </section>
                            )}

                            {/* Appearance Section */}
                            {activeTab === 'appearance' && (
                                <section className="space-y-4">
                                    <h2 className="text-lg font-semibold text-calm-800 dark:text-white px-2">Appearance</h2>
                                    <GlassCard className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-bold text-calm-800 dark:text-white">Dark Mode</h4>
                                                <p className="text-xs text-calm-500">Toggle between dark and light themes</p>
                                            </div>
                                            <button
                                                onClick={handleToggleTheme}
                                                className={cn(
                                                    "relative w-14 h-7 rounded-full transition-colors flex items-center",
                                                    isDarkMode ? "bg-lavender-500" : "bg-calm-300 dark:bg-calm-600"
                                                )}
                                            >
                                                <motion.div
                                                    animate={{ x: isDarkMode ? 28 : 4 }}
                                                    className="absolute w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center text-[10px]"
                                                >
                                                    {isDarkMode ? <Moon className="w-3 h-3 text-lavender-500" /> : <Sun className="w-3 h-3 text-orange-400" />}
                                                </motion.div>
                                            </button>
                                        </div>
                                    </GlassCard>
                                </section>
                            )}

                            {/* Notifications Section */}
                            {activeTab === 'notifications' && (
                                <section className="space-y-4">
                                    <h2 className="text-lg font-semibold text-calm-800 dark:text-white px-2">Notifications</h2>
                                    <GlassCard className="p-6 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-bold text-calm-800 dark:text-white">Email Reminders</h4>
                                                <p className="text-xs text-calm-500">Receive daily wellness reminders</p>
                                            </div>
                                            <button
                                                onClick={() => handleToggleSetting(setEmailNotifications, 'Email reminders')}
                                                className={cn(
                                                    "relative w-12 h-6 rounded-full transition-colors",
                                                    emailNotifications ? "bg-lavender-500" : "bg-calm-300 dark:bg-calm-600"
                                                )}
                                            >
                                                <motion.div
                                                    animate={{ x: emailNotifications ? 24 : 4 }}
                                                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                                                />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-bold text-calm-800 dark:text-white">Appointment Updates</h4>
                                                <p className="text-xs text-calm-500">Status changes and team messages</p>
                                            </div>
                                            <button
                                                onClick={() => handleToggleSetting(setAppointmentReminders, 'Appointment updates')}
                                                className={cn(
                                                    "relative w-12 h-6 rounded-full transition-colors",
                                                    appointmentReminders ? "bg-lavender-500" : "bg-calm-300 dark:bg-calm-600"
                                                )}
                                            >
                                                <motion.div
                                                    animate={{ x: appointmentReminders ? 24 : 4 }}
                                                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                                                />
                                            </button>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-calm-200 dark:border-calm-800">
                                            <p className="text-[10px] text-calm-500 italic text-center">
                                                Note: These are preference settings only. Automated reminder services are coming soon.
                                            </p>
                                        </div>
                                    </GlassCard>
                                </section>
                            )}

                            {/* Privacy Section */}
                            {activeTab === 'privacy' && (
                                <section className="space-y-4">
                                    <h2 className="text-lg font-semibold text-calm-800 dark:text-white px-2">Privacy</h2>
                                    <GlassCard className="p-6">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-500/10">
                                                <Eye className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="text-base font-bold text-calm-800 dark:text-white">Data Confidentiality</h4>
                                                <p className="text-xs text-calm-500">Your information is secure and private.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 text-sm text-calm-600 dark:text-calm-400">
                                            <div className="flex gap-3">
                                                <Shield className="w-5 h-5 text-lavender-500 shrink-0" />
                                                <p>Your journals and mood logs are strictly private and encrypted.</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <ShieldCheck className="w-5 h-5 text-lavender-500 shrink-0" />
                                                <p>Only your verified account can access personal wellness data.</p>
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-calm-200/50 dark:border-calm-700/50 flex items-center justify-between">
                                            <span className="text-sm font-medium text-calm-700 dark:text-calm-300">Set Journals to Private by Default</span>
                                            <button
                                                onClick={() => handleToggleSetting(setPrivateJournal, 'Private journal')}
                                                className={cn(
                                                    "relative w-12 h-6 rounded-full transition-colors",
                                                    privateJournal ? "bg-lavender-500" : "bg-calm-300 dark:bg-calm-600"
                                                )}
                                            >
                                                <motion.div
                                                    animate={{ x: privateJournal ? 24 : 4 }}
                                                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                                                />
                                            </button>
                                        </div>
                                    </GlassCard>
                                </section>
                            )}

                            {/* Support Section */}
                            {activeTab === 'support' && (
                                <section className="space-y-4">
                                    <h2 className="text-lg font-semibold text-calm-800 dark:text-white px-2">Support & Help</h2>
                                    <GlassCard className="p-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="p-4 rounded-2xl bg-calm-100/50 dark:bg-calm-800/50 border border-calm-200 dark:border-calm-700">
                                                <p className="text-xs text-calm-500 mb-1">Email Support</p>
                                                <p className="text-sm font-bold text-calm-800 dark:text-white mb-3">mindwell.healthai@gmail.com</p>
                                                <button
                                                    onClick={() => setIsSupportModalOpen(true)}
                                                    className="text-lavender-500 text-xs font-semibold hover:underline flex items-center gap-1"
                                                >
                                                    Send Message <ChevronRight className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-coral-500/5 border border-coral-500/20">
                                                <p className="text-xs text-coral-500 mb-1 font-bold">Emergency Support</p>
                                                <p className="text-sm font-bold text-calm-800 dark:text-white mb-3">Immediate Assistance</p>
                                                <button
                                                    onClick={handleGetHelpNow}
                                                    className="w-full py-2 px-4 rounded-xl bg-coral-500 text-white text-xs font-bold hover:bg-coral-600 transition-colors shadow-lg shadow-coral-500/20"
                                                >
                                                    Get Help Now
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-6 p-4 rounded-xl bg-calm-100/30 dark:bg-calm-800/30 border border-dashed border-calm-200 dark:border-calm-700 text-center">
                                            <p className="text-xs text-calm-500">
                                                Need more help? Visit our <span className="text-lavender-500 font-medium cursor-pointer hover:underline">Help Center</span> or check out our <span className="text-lavender-500 font-medium cursor-pointer hover:underline">FAQ</span>.
                                            </p>
                                        </div>
                                    </GlassCard>
                                </section>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
