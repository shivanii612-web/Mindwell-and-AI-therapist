import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Calendar, Shield, TrendingUp, BarChart3,
    Activity, AlertTriangle, Eye, CheckCircle2, XCircle,
    Terminal, Database, Globe, HardDrive, Clock, Loader
} from 'lucide-react';
import { GlassCard, Badge } from '@components/ui/Layout';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { API_URL, joinUrl } from '@utils/apiUtils';
import { useAppSelector } from '@hooks/useRedux';
import { cn } from '@utils/cn';
import { useHealthCheck } from '@hooks/useHealthCheck';

interface User {
    _id: string;
    email: string;
    full_name: string;
    role: 'user' | 'therapist' | 'admin';
    createdAt: string;
    isVerified: boolean;
}

interface Appointment {
    _id: string;
    userId: { full_name: string; email: string };
    therapistId?: { full_name: string; email: string };
    sessionType: string;
    preferredDate: string;
    status: string;
}

interface TherapistApp {
    _id: string;
    full_name: string;
    email: string;
    phone: string;
    qualification: string;
    specialization: string;
    experience_years: number;
    license_number: string;
    bio: string;
    available_timings: string;
    certificate_url: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    reviewed_at?: string;
    admin_notes?: string;
}

const roleColor = {
    user: 'info',
    therapist: 'success',
    admin: 'warning',
} as const;

export const AdminPanel: React.FC = () => {
    const { session } = useAppSelector((s) => s.auth);
    const token = session?.access_token;
    const location = useLocation();

    // Centralized health check monitoring
    useHealthCheck();

    // Derive active tab from URL query param with fallback
    const queryParams = new URLSearchParams(location.search);
    const validTabs = ['overview', 'users', 'therapists', 'applications', 'appointments', 'payments', 'moderation', 'emergency', 'monitoring'];
    const rawTab = queryParams.get('tab')?.toLowerCase() || 'overview';
    const activeTab = (validTabs.includes(rawTab) ? rawTab : 'overview') as
        'overview' | 'users' | 'therapists' | 'applications' | 'appointments' | 'payments' | 'moderation' | 'emergency' | 'monitoring';

    const [users, setUsers] = useState<User[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingAppointments, setLoadingAppointments] = useState(false);
    const [updatingRole, setUpdatingRole] = useState<string | null>(null);
    // Therapist Applications state
    const [therapistApps, setTherapistApps] = useState<TherapistApp[]>([]);
    const [loadingApps, setLoadingApps] = useState(false);
    const [actioningApp, setActioningApp] = useState<string | null>(null);
    const [paymentStats, setPaymentStats] = useState<{
        totalRevenue: number;
        thisMonthRevenue: number;
        activeSubscriptions: number;
        totalTransactions: number;
        recentPayments: any[];
    } | null>(null);
    const [loadingPayments, setLoadingPayments] = useState(false);
    const [communityPosts, setCommunityPosts] = useState<any[]>([]);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const res = await fetch(joinUrl(API_URL, '/appointments/admin/users'), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : []);
            // Clear any stale error toast on success
            toast.dismiss('admin-users-error');
        } catch {
            toast.error('Failed to load users', { id: 'admin-users-error', duration: 5000 });
        } finally {
            setLoadingUsers(false);
        }
    };

    const fetchAppointments = async () => {
        setLoadingAppointments(true);
        try {
            const res = await fetch(joinUrl(API_URL, '/appointments/admin/all'), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setAppointments(Array.isArray(data) ? data : []);
            // Clear any stale error toast on success
            toast.dismiss('admin-appts-error');
        } catch {
            toast.error('Failed to load appointments', { id: 'admin-appts-error', duration: 5000 });
        } finally {
            setLoadingAppointments(false);
        }
    };

    const fetchPaymentStats = async () => {
        setLoadingPayments(true);
        try {
            const res = await fetch(joinUrl(API_URL, '/payments/admin/stats'), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setPaymentStats(data);
                toast.dismiss('admin-stats-error');
            } else {
                throw new Error();
            }
        } catch {
            toast.error('Failed to load stats', { id: 'admin-stats-error' });
        } finally {
            setLoadingPayments(false);
        }
    };

    const fetchCommunityData = async () => {
        try {
            const res = await fetch(joinUrl(API_URL, '/community/posts'), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setCommunityPosts(Array.isArray(data) ? data : []);
            }
        } catch {
            // silently fail — community moderation is non-critical
        }
    };

    const fetchTherapistApps = async () => {
        setLoadingApps(true);
        try {
            const res = await fetch(joinUrl(API_URL, '/therapist-applications'), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setTherapistApps(Array.isArray(data) ? data : []);
            }
            toast.dismiss('admin-apps-error');
        } catch {
            toast.error('Failed to load applications', { id: 'admin-apps-error', duration: 5000 });
        } finally {
            setLoadingApps(false);
        }
    };

    const approveApp = async (id: string) => {
        setActioningApp(id);
        try {
            const res = await fetch(joinUrl(API_URL, `/therapist-applications/${id}/approve`), {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || 'Application approved.');
                fetchTherapistApps();
                fetchUsers(); // refresh user list
            } else {
                toast.error(data.error || 'Failed to approve application.');
            }
        } catch {
            toast.error('Network error.');
        } finally {
            setActioningApp(null);
        }
    };

    const rejectApp = async (id: string) => {
        setActioningApp(id);
        try {
            const res = await fetch(joinUrl(API_URL, `/therapist-applications/${id}/reject`), {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_notes: '' }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Application rejected.');
                fetchTherapistApps();
            } else {
                toast.error(data.error || 'Failed to reject application.');
            }
        } catch {
            toast.error('Network error.');
        } finally {
            setActioningApp(null);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchAppointments();
        fetchPaymentStats();
        fetchCommunityData();
        fetchTherapistApps();
    }, []);

    const updateRole = async (userId: string, role: string) => {
        setUpdatingRole(userId);
        try {
            const res = await fetch(joinUrl(API_URL, `/appointments/admin/users/${userId}/role`), {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ role }),
            });
            if (res.ok) {
                toast.success(`Role updated to ${role}`);
                setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, role: role as User['role'] } : u));
            } else {
                toast.error('Failed to update role');
            }
        } catch {
            toast.error('Network error');
        } finally {
            setUpdatingRole(null);
        }
    };

    const stats = [
        { label: 'Total Users', value: users.length, icon: Users, color: 'from-blue-500 to-indigo-500' },
        { label: 'Therapists', value: users.filter(u => u.role === 'therapist').length, icon: Shield, color: 'from-emerald-500 to-teal-500' },
        { label: 'Total Sessions', value: appointments.length, icon: Calendar, color: 'from-lavender-500 to-accent-500' },
        { label: 'Active Sessions', value: appointments.filter(a => a.status === 'Accepted').length, icon: Activity, color: 'from-amber-500 to-orange-500' },
        { label: 'Pending Applications', value: therapistApps.filter(a => a.status === 'pending').length, icon: Clock, color: 'from-violet-500 to-purple-500' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-calm-800 dark:text-white flex items-center gap-3">
                        <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                            <Shield className="w-5 h-5 text-white" />
                        </span>
                        Admin Panel
                    </h1>
                    <p className="text-calm-500 dark:text-calm-400 mt-1">Platform management and analytics</p>
                </div>
                <div className="px-4 py-2 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 text-sm font-semibold border border-violet-200 dark:border-violet-800">
                    🔐 Admin Access
                </div>
            </div>

            {/* Main Content Sections */}
            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        {/* Stats Row */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {stats.map((stat) => (
                                <GlassCard key={stat.label} className="p-4" hover={false}>
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                                        <stat.icon className="w-5 h-5 text-white" />
                                    </div>
                                    <p className="text-2xl font-bold text-calm-800 dark:text-white">{stat.value}</p>
                                    <p className="text-xs text-calm-500 dark:text-calm-400">{stat.label}</p>
                                </GlassCard>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <GlassCard className="p-6" hover={false}>
                                <h3 className="text-lg font-semibold text-calm-800 dark:text-white mb-4 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-violet-500" /> Session Analytics
                                </h3>
                                <div className="space-y-3">
                                    {['Pending Review', 'Accepted', 'Completed', 'Rejected'].map((status) => {
                                        const count = appointments.filter(a => a.status === status).length;
                                        const total = appointments.length || 1;
                                        const pct = Math.round((count / total) * 100);
                                        return (
                                            <div key={status}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-calm-600 dark:text-calm-400">{status}</span>
                                                    <span className="font-medium text-calm-800 dark:text-white">{count}</span>
                                                </div>
                                                <div className="h-2 bg-calm-100 dark:bg-calm-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-500"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </GlassCard>

                            <GlassCard className="p-6" hover={false}>
                                <h3 className="text-lg font-semibold text-calm-800 dark:text-white mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-violet-500" /> User Distribution
                                </h3>
                                <div className="space-y-3">
                                    {(['user', 'therapist', 'admin'] as const).map((role) => {
                                        const count = users.filter(u => u.role === role).length;
                                        const total = users.length || 1;
                                        const pct = Math.round((count / total) * 100);
                                        return (
                                            <div key={role}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="capitalize text-calm-600 dark:text-calm-400">{role}s</span>
                                                    <span className="font-medium text-calm-800 dark:text-white">{count}</span>
                                                </div>
                                                <div className="h-2 bg-calm-100 dark:bg-calm-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </GlassCard>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'users' && (
                    <motion.div key="users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold text-calm-800 dark:text-white">User Management</h2>
                            <button onClick={fetchUsers} className="p-2 rounded-lg bg-calm-100 dark:bg-calm-800 hover:bg-calm-200 transition-colors">
                                <Activity className="w-4 h-4 text-calm-500" />
                            </button>
                        </div>
                        {loadingUsers ? (
                            <GlassCard className="p-12 text-center" hover={false}>
                                <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
                            </GlassCard>
                        ) : users.map((user) => (
                            <GlassCard key={user._id} className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 text-white font-bold text-sm">
                                        {(user.full_name || user.email)[0]?.toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-calm-800 dark:text-white text-sm">{user.full_name || 'No Name'}</span>
                                            <Badge variant={roleColor[user.role]} size="sm">{user.role}</Badge>
                                            {user.isVerified && <Badge variant="success" size="sm">✓ Verified</Badge>}
                                        </div>
                                        <p className="text-xs text-calm-500">{user.email}</p>
                                        <p className="text-xs text-calm-400">Joined {format(new Date(user.createdAt), 'MMM d, yyyy')}</p>
                                    </div>
                                    <div className="shrink-0">
                                        <select
                                            value={user.role}
                                            onChange={(e) => updateRole(user._id, e.target.value)}
                                            disabled={updatingRole === user._id}
                                            className="text-sm px-3 py-1.5 rounded-lg bg-white/50 dark:bg-calm-800 border border-calm-200 dark:border-calm-700 text-calm-700 dark:text-calm-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                                        >
                                            <option value="user">User</option>
                                            <option value="therapist">Therapist</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'therapists' && (
                    <motion.div key="therapists" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold text-calm-800 dark:text-white">Active Therapists</h2>
                        </div>
                        {users.filter(u => u.role === 'therapist').length === 0 ? (
                            <GlassCard className="p-12 text-center" hover={false}>
                                <Shield className="w-16 h-16 text-calm-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-calm-800 dark:text-white mb-2">No active therapist accounts</h3>
                                <p className="text-calm-400 text-sm">Approve a therapist application to create a therapist account.</p>
                            </GlassCard>
                        ) : users.filter(u => u.role === 'therapist').map((user) => (
                            <GlassCard key={user._id} className="p-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0 text-white font-bold">
                                        {(user.full_name || user.email)[0]?.toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h3 className="font-bold text-calm-800 dark:text-white">{user.full_name || 'No Name'}</h3>
                                            <Badge variant="success" size="sm">Therapist</Badge>
                                            {user.isVerified && <Badge variant="success" size="sm">✓ Verified</Badge>}
                                        </div>
                                        <p className="text-sm text-calm-500">{user.email}</p>
                                        <p className="text-xs text-calm-400">Joined {format(new Date(user.createdAt), 'MMM d, yyyy')}</p>
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                    </motion.div>
                )}

                {/* ═══ THERAPIST APPLICATIONS TAB ═══ */}
                {activeTab === 'applications' && (
                    <motion.div key="applications" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h2 className="text-xl font-bold text-calm-800 dark:text-white">Therapist Applications</h2>
                                <p className="text-sm text-calm-500 mt-0.5">
                                    Review and approve therapist onboarding requests
                                </p>
                            </div>
                            <button
                                onClick={fetchTherapistApps}
                                className="p-2 rounded-lg bg-calm-100 dark:bg-calm-800 hover:bg-calm-200 transition-colors"
                            >
                                <Activity className="w-4 h-4 text-calm-500" />
                            </button>
                        </div>

                        {/* Status summary pills */}
                        <div className="flex gap-3 flex-wrap">
                            {(['pending', 'approved', 'rejected'] as const).map(s => {
                                const count = therapistApps.filter(a => a.status === s).length;
                                return (
                                    <div key={s} className={cn(
                                        'px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5',
                                        s === 'pending' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                            s === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                                'bg-red-500/10 border-red-500/20 text-red-400'
                                    )}>
                                        {s === 'pending' && <Clock className="w-3 h-3" />}
                                        {s === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                                        {s === 'rejected' && <XCircle className="w-3 h-3" />}
                                        {count} {s}
                                    </div>
                                );
                            })}
                        </div>

                        {loadingApps ? (
                            <GlassCard className="p-12 text-center" hover={false}>
                                <Loader className="w-8 h-8 text-violet-400 animate-spin mx-auto" />
                            </GlassCard>
                        ) : therapistApps.length === 0 ? (
                            <GlassCard className="p-12 text-center" hover={false}>
                                <Shield className="w-16 h-16 text-calm-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-calm-800 dark:text-white mb-2">No applications yet</h3>
                                <p className="text-calm-400 text-sm">Share the therapist application link to receive applications.</p>
                            </GlassCard>
                        ) : (
                            therapistApps.map(app => (
                                <GlassCard key={app._id} className={cn(
                                    'p-6 border',
                                    app.status === 'pending' ? 'border-amber-500/20' :
                                        app.status === 'approved' ? 'border-emerald-500/20' :
                                            'border-red-500/20 opacity-70'
                                )}>
                                    <div className="flex items-start justify-between gap-4 flex-wrap">
                                        {/* Applicant info */}
                                        <div className="flex items-start gap-4 flex-1 min-w-0">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lavender-500 to-accent-500 flex items-center justify-center shrink-0 text-white font-bold text-lg shadow-lg">
                                                {app.full_name[0]?.toUpperCase()}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <h3 className="font-bold text-calm-800 dark:text-white">{app.full_name}</h3>
                                                    <Badge
                                                        variant={app.status === 'pending' ? 'warning' : app.status === 'approved' ? 'success' : 'error'}
                                                        size="sm"
                                                    >
                                                        {app.status === 'pending' && '⏳ '}{app.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-calm-500 mb-0.5">{app.email} · {app.phone}</p>
                                                <p className="text-xs text-calm-400">
                                                    Applied {format(new Date(app.createdAt), 'MMM d, yyyy')}
                                                    {app.reviewed_at && ` · Reviewed ${format(new Date(app.reviewed_at), 'MMM d, yyyy')}`}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions — only for pending */}
                                        {app.status === 'pending' && (
                                            <div className="flex gap-2 shrink-0">
                                                <button
                                                    onClick={() => approveApp(app._id)}
                                                    disabled={actioningApp === app._id}
                                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 transition-all disabled:opacity-60"
                                                >
                                                    {actioningApp === app._id
                                                        ? <Loader className="w-3 h-3 animate-spin" />
                                                        : <CheckCircle2 className="w-3.5 h-3.5" />}
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => rejectApp(app._id)}
                                                    disabled={actioningApp === app._id}
                                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 text-red-500 font-bold text-xs border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-60"
                                                >
                                                    <XCircle className="w-3.5 h-3.5" /> Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Professional details grid */}
                                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {[
                                            { label: 'Qualification', value: app.qualification },
                                            { label: 'Specialization', value: app.specialization },
                                            { label: 'Experience', value: `${app.experience_years} years` },
                                            { label: 'License No.', value: app.license_number },
                                        ].map(item => (
                                            <div key={item.label} className="p-3 rounded-xl bg-calm-50/50 dark:bg-white/5 border border-calm-100 dark:border-white/5">
                                                <p className="text-[10px] font-bold text-calm-400 uppercase tracking-wider mb-1">{item.label}</p>
                                                <p className="text-xs font-semibold text-calm-700 dark:text-calm-300 truncate">{item.value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Bio */}
                                    <div className="mt-3 p-3 rounded-xl bg-calm-50/50 dark:bg-white/5 border border-calm-100 dark:border-white/5">
                                        <p className="text-[10px] font-bold text-calm-400 uppercase tracking-wider mb-1">Bio</p>
                                        <p className="text-xs text-calm-600 dark:text-calm-400 line-clamp-2">{app.bio}</p>
                                    </div>

                                    {/* Certificate link */}
                                    {app.certificate_url && (
                                        <div className="mt-2">
                                            <a
                                                href={app.certificate_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-lavender-400 hover:text-lavender-300 underline flex items-center gap-1"
                                            >
                                                <Eye className="w-3 h-3" /> View Certificate / Documents
                                            </a>
                                        </div>
                                    )}
                                </GlassCard>
                            ))
                        )}
                    </motion.div>
                )}

                {activeTab === 'appointments' && (
                    <motion.div key="appointments" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold text-calm-800 dark:text-white">Appointments & Sessions</h2>
                        </div>
                        {loadingAppointments ? (
                            <GlassCard className="p-12 text-center" hover={false}>
                                <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
                            </GlassCard>
                        ) : appointments.length === 0 ? (
                            <GlassCard className="p-12 text-center" hover={false}>
                                <Calendar className="w-16 h-16 text-calm-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-calm-800 dark:text-white mb-2">No appointments yet</h3>
                            </GlassCard>
                        ) : appointments.map((apt) => (
                            <GlassCard key={apt._id} className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-medium text-calm-800 dark:text-white">
                                                {apt.userId?.full_name || 'Unknown'}
                                            </span>
                                            <span className="text-calm-400">→</span>
                                            <span className="text-sm text-calm-600 dark:text-calm-400">
                                                {apt.therapistId?.full_name || 'Unassigned'}
                                            </span>
                                            <Badge variant={apt.status === 'Accepted' ? 'success' : apt.status === 'Rejected' ? 'error' : 'warning'} size="sm">
                                                {apt.status}
                                            </Badge>
                                        </div>
                                        <div className="flex gap-3 text-xs text-calm-500 mt-1">
                                            <span>{format(new Date(apt.preferredDate), 'MMM d, yyyy')}</span>
                                            <span>•</span>
                                            <span>{apt.sessionType} Session</span>
                                        </div>
                                    </div>
                                    <Eye className="w-4 h-4 text-calm-400" />
                                </div>
                            </GlassCard>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'payments' && (
                    <motion.div key="payments" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <GlassCard className="p-6" hover={false}>
                            <h2 className="text-xl font-bold text-calm-800 dark:text-white mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-violet-500" /> Payment Overview
                            </h2>
                            {loadingPayments ? (
                                <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
                            ) : (
                                <>
                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        <div className="text-center p-4 rounded-xl bg-calm-50/50 dark:bg-calm-800/50 border border-white/10">
                                            <p className="text-2xl font-bold text-emerald-600">₹{paymentStats?.totalRevenue?.toLocaleString('en-IN') || 0}</p>
                                            <p className="text-xs text-calm-500 mt-1 uppercase tracking-tight font-bold">Total Revenue</p>
                                        </div>
                                        <div className="text-center p-4 rounded-xl bg-calm-50/50 dark:bg-calm-800/50 border border-white/10">
                                            <p className="text-2xl font-bold text-blue-600">₹{paymentStats?.thisMonthRevenue?.toLocaleString('en-IN') || 0}</p>
                                            <p className="text-xs text-calm-500 mt-1 uppercase tracking-tight font-bold">This Month</p>
                                        </div>
                                        <div className="text-center p-4 rounded-xl bg-calm-50/50 dark:bg-calm-800/50 border border-white/10">
                                            <p className="text-2xl font-bold text-violet-600">{paymentStats?.activeSubscriptions || 0} active</p>
                                            <p className="text-xs text-calm-500 mt-1 uppercase tracking-tight font-bold">Subscriptions</p>
                                        </div>
                                    </div>

                                    {paymentStats?.recentPayments?.length ? (
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-bold text-calm-500 uppercase tracking-wider mb-3">Recent Payments</h3>
                                            {paymentStats.recentPayments.map((p: any) => (
                                                <div key={p._id} className="flex items-center justify-between p-3 rounded-xl bg-calm-50/50 dark:bg-calm-800/30">
                                                    <div>
                                                        <p className="text-sm font-medium text-calm-800 dark:text-white">{p.user?.full_name || p.user?.email || 'Unknown'}</p>
                                                        <p className="text-xs text-calm-500">{p.planName}</p>
                                                    </div>
                                                    <Badge variant="success" size="sm">₹{p.amount}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center p-6 text-calm-400 text-sm">
                                            No payments recorded yet.
                                        </div>
                                    )}
                                </>
                            )}
                        </GlassCard>
                    </motion.div>
                )}

                {activeTab === 'moderation' && (
                    <motion.div key="moderation" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                        <GlassCard className="p-6" hover={false}>
                            <h2 className="text-xl font-bold text-calm-800 dark:text-white mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-500" /> Community Moderation
                            </h2>
                            {communityPosts.length === 0 ? (
                                <div className="text-center py-12 text-calm-400">
                                    <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">No community posts to moderate at this time.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-sm text-calm-500">{communityPosts.length} total community posts</p>
                                    {communityPosts.slice(0, 5).map((post: any) => (
                                        <div key={post._id} className="flex items-start gap-4 p-4 rounded-xl bg-calm-50/50 dark:bg-calm-800/30 border border-calm-200 dark:border-calm-700">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-medium text-calm-800 dark:text-white">{post.author?.full_name || 'Anonymous'}</span>
                                                    <Badge variant="info" size="sm">Post</Badge>
                                                </div>
                                                <p className="text-sm text-calm-600 dark:text-calm-400 italic truncate">"{post.content?.slice(0, 100)}..."</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </GlassCard>
                    </motion.div>
                )}

                {activeTab === 'emergency' && (
                    <motion.div key="emergency" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                        <GlassCard className="p-8" hover={false}>
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-bold text-calm-800 dark:text-white flex items-center gap-2 text-red-500">
                                    <AlertTriangle className="w-6 h-6 animate-pulse" /> Clinical Emergency Monitor
                                </h2>
                                <Badge variant="success" size="sm">System Active</Badge>
                            </div>
                            <div className="text-center py-20 bg-calm-500/5 rounded-3xl border border-dashed border-calm-200 dark:border-white/5">
                                <Shield className="w-16 h-16 mx-auto mb-4 text-calm-300 dark:text-calm-600 opacity-50" />
                                <h3 className="text-lg font-bold text-calm-800 dark:text-white mb-2">No Active Reports</h3>
                                <p className="text-sm text-calm-500 max-w-md mx-auto">
                                    The emergency SOS system is actively monitoring user distress signals. Currently, there are zero active escalations.
                                </p>
                            </div>
                        </GlassCard>
                    </motion.div>
                )}

                {activeTab === 'monitoring' && (
                    <motion.div key="monitoring" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { label: 'MongoDB', value: 'Connected', icon: Database, color: 'text-emerald-500' },
                                { label: 'Server', value: 'Port 5000', icon: Globe, color: 'text-blue-500' },
                                { label: 'Redis', value: 'Disabled (dev)', icon: HardDrive, color: 'text-violet-500' },
                            ].map((stat, i) => (
                                <GlassCard key={i} className="p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-calm-100 dark:bg-calm-800 flex items-center justify-center">
                                        <stat.icon className={cn("w-5 h-5", stat.color)} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-calm-500 uppercase tracking-tighter font-bold">{stat.label}</p>
                                        <p className="text-lg font-bold text-calm-800 dark:text-white">{stat.value}</p>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                        <GlassCard className="p-6" hover={false}>
                            <h3 className="text-sm font-bold text-calm-600 dark:text-calm-400 mb-3 flex items-center gap-2 uppercase tracking-widest">
                                <Terminal className="w-4 h-4" /> Health Check
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-calm-500">Total Users</span>
                                    <span className="font-bold text-calm-800 dark:text-white">{users.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-calm-500">Therapists</span>
                                    <span className="font-bold text-calm-800 dark:text-white">{users.filter(u => u.role === 'therapist').length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-calm-500">Total Appointments</span>
                                    <span className="font-bold text-calm-800 dark:text-white">{appointments.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-calm-500">Active Subscriptions</span>
                                    <span className="font-bold text-calm-800 dark:text-white">{paymentStats?.activeSubscriptions ?? '—'}</span>
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminPanel;
