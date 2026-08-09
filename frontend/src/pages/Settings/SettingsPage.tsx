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
import { forceDisconnectConsultationSocket } from '@lib/consultationSocket';

const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Sun },
    { id: 'privacy', label: 'Privacy', icon: Eye },
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
        localStorage.setItem('settings_email_notifications', emailNotifications ? 'true' : 'false');
    }, [emailNotifications]);

    useEffect(() => {
        localStorage.setItem('settings_appointment_reminders', appointmentReminders ? 'true' : 'false');
    }, [appointmentReminders]);

    useEffect(() => {
        localStorage.setItem('settings_private_journal', privateJournal ? 'true' : 'false');
    }, [privateJournal]);

    const handleLogout = async () => {
        try {
            toast.loading('Logging out...', { id: 'logout' });
            forceDisconnectConsultationSocket();
            await dispatch(signOut());
            toast.success('Logged out successfully', { id: 'logout' });
            navigate('/login');
        } catch (error) {
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
                                <section className="space-y-6">
                                    <div className="border-b border-calm-200 dark:border-calm-800 pb-4">
                                        <h2 className="text-xl font-bold text-calm-800 dark:text-white">Profile</h2>
                                        <p className="text-xs text-calm-500 mt-1">Manage public profile preferences</p>
                                    </div>
                                    <div className="bg-white dark:bg-calm-900 border border-calm-200 dark:border-calm-800 rounded-2xl p-6 space-y-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-calm-500 uppercase tracking-wider mb-2">
                                                    Full Name
                                                </label>
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={profile?.full_name || ''}
                                                    className="w-full px-4 py-3 rounded-xl bg-calm-50/50 dark:bg-calm-800/40 border border-calm-200 dark:border-calm-800 text-calm-700 dark:text-calm-300 focus:outline-none cursor-not-allowed opacity-80 text-sm font-medium"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-calm-500 uppercase tracking-wider mb-2">
                                                    Email Address
                                                </label>
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={profile?.email || ''}
                                                    className="w-full px-4 py-3 rounded-xl bg-calm-50/50 dark:bg-calm-800/40 border border-calm-200 dark:border-calm-800 text-calm-700 dark:text-calm-300 focus:outline-none cursor-not-allowed opacity-80 text-sm font-medium"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-calm-500 uppercase tracking-wider mb-2">
                                                    Account Type
                                                </label>
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={profile?.role === 'admin' ? 'Administrator' : profile?.role === 'therapist' ? 'Therapist Account' : 'Patient Account'}
                                                    className="w-full px-4 py-3 rounded-xl bg-calm-50/50 dark:bg-calm-800/40 border border-calm-200 dark:border-calm-800 text-calm-700 dark:text-calm-300 focus:outline-none cursor-not-allowed opacity-80 text-sm font-medium"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Security Section */}
                            {activeTab === 'security' && (
                                <section className="space-y-6">
                                    <div className="border-b border-calm-200 dark:border-calm-800 pb-4">
                                        <h2 className="text-xl font-bold text-calm-800 dark:text-white">Security</h2>
                                        <p className="text-xs text-calm-500 mt-1">Manage credentials and authentication</p>
                                    </div>
                                    <div className="bg-white dark:bg-calm-900 border border-calm-200 dark:border-calm-800 rounded-2xl p-6 space-y-6">
                                        <div className="flex items-center justify-between pb-4 border-b border-calm-100 dark:border-calm-800/60">
                                            <div>
                                                <h4 className="text-sm font-bold text-calm-800 dark:text-white">Account Password</h4>
                                                <p className="text-xs text-calm-500">Update your password regularly for protection</p>
                                            </div>
                                            <button
                                                onClick={() => setIsPasswordModalOpen(true)}
                                                className="px-4 py-2 rounded-xl border border-calm-200 dark:border-calm-700 text-sm font-semibold text-calm-750 dark:text-calm-300 hover:bg-calm-50 dark:hover:bg-calm-800 transition-colors"
                                            >
                                                Change Password
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between pt-2">
                                            <div>
                                                <h4 className="text-sm font-bold text-calm-800 dark:text-white">Session Log out</h4>
                                                <p className="text-xs text-calm-500">Log out from your current browser session</p>
                                            </div>
                                            <button
                                                onClick={handleLogout}
                                                className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-sm font-bold text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Appearance Section */}
                            {activeTab === 'appearance' && (
                                <section className="space-y-6">
                                    <div className="border-b border-calm-200 dark:border-calm-800 pb-4">
                                        <h2 className="text-xl font-bold text-calm-800 dark:text-white">Appearance</h2>
                                        <p className="text-xs text-calm-500 mt-1">Customize screen theme and details</p>
                                    </div>
                                    <div className="bg-white dark:bg-calm-900 border border-calm-200 dark:border-calm-800 rounded-2xl p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-bold text-calm-800 dark:text-white">Dark Mode</h4>
                                                <p className="text-xs text-calm-500">Toggle dark UI theme mode</p>
                                            </div>
                                            <button
                                                onClick={handleToggleTheme}
                                                className={cn(
                                                    "relative w-12 h-6 rounded-full transition-colors flex items-center bg-calm-200 dark:bg-lavender-500",
                                                    isDarkMode ? "bg-lavender-500" : "bg-calm-200 dark:bg-calm-700"
                                                )}
                                            >
                                                <motion.div
                                                    animate={{ x: isDarkMode ? 26 : 4 }}
                                                    className="w-4 h-4 rounded-full bg-white shadow-sm flex items-center justify-center"
                                                >
                                                    {isDarkMode ? <Moon className="w-2.5 h-2.5 text-lavender-500" /> : <Sun className="w-2.5 h-2.5 text-orange-400" />}
                                                </motion.div>
                                            </button>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Privacy Section */}
                            {activeTab === 'privacy' && (
                                <section className="space-y-6">
                                    <div className="border-b border-calm-200 dark:border-calm-800 pb-4">
                                        <h2 className="text-xl font-bold text-calm-800 dark:text-white">Privacy</h2>
                                        <p className="text-xs text-calm-500 mt-1">Control visibility and default privacy settings</p>
                                    </div>
                                    <div className="bg-white dark:bg-calm-900 border border-calm-200 dark:border-calm-800 rounded-2xl p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-bold text-calm-800 dark:text-white">Private Journals</h4>
                                                <p className="text-xs text-calm-500">Set new journals to private by default</p>
                                            </div>
                                            <button
                                                onClick={() => handleToggleSetting(setPrivateJournal, 'Private journal')}
                                                className={cn(
                                                    "relative w-12 h-6 rounded-full transition-colors",
                                                    privateJournal ? "bg-lavender-500" : "bg-calm-200 dark:bg-calm-700"
                                                )}
                                            >
                                                <motion.div
                                                    animate={{ x: privateJournal ? 26 : 4 }}
                                                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                                                />
                                            </button>
                                        </div>
                                    </div>
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
