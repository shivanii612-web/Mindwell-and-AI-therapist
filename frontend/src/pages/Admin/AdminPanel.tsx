import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Calendar, Shield, TrendingUp, BarChart3,
    Activity, AlertTriangle, Eye, CheckCircle2, XCircle,
    Terminal, Database, Globe, HardDrive, Clock, Loader,
    Search, Filter, Trash2, UserX, UserCheck, ChevronLeft, ChevronRight
} from 'lucide-react';
import { GlassCard, Badge } from '@components/ui/Layout';
import { safeFormatDate } from '@utils/dateUtils';
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
    isBlocked?: boolean;
    isSuspended?: boolean;
}

interface Appointment {
    _id: string;
    userId: { _id?: string; full_name: string; email: string };
    therapistId?: { _id?: string; full_name: string; email: string };
    sessionType: string;
    preferredDate: string;
    status: string;
    reason?: string;
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

    // New states for search, filter, pagination, modals
    const [userSearch, setUserSearch] = useState('');
    const [systemStatus, setSystemStatus] = useState<{
        database: string;
        redis: string;
        server: string;
    } | null>(null);
    const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'user' | 'therapist' | 'admin'>('all');
    const [userPage, setUserPage] = useState(1);
    const userLimit = 10;

    const [therapistSearch, setTherapistSearch] = useState('');
    const [therapistStatusFilter, setTherapistStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
    const [therapistPage, setTherapistPage] = useState(1);
    const therapistLimit = 10;

    const [appointmentSearch, setAppointmentSearch] = useState('');
    const [appointmentStatusFilter, setAppointmentStatusFilter] = useState<string>('all');
    const [appointmentDateFilter, setAppointmentDateFilter] = useState<string>('');
    const [appointmentTherapistFilter, setAppointmentTherapistFilter] = useState<string>('all');
    const [appointmentPage, setAppointmentPage] = useState(1);
    const appointmentLimit = 10;

    // Modals
    const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
        isOpen: boolean;
        type: 'user' | 'therapist';
        id: string;
        name: string;
        warningMessage?: string;
    } | null>(null);

    const [profileModal, setProfileModal] = useState<{
        isOpen: boolean;
        type: 'user' | 'therapist';
        data: User;
        applicationData?: TherapistApp;
    } | null>(null);

    const [assignModal, setAssignModal] = useState<{
        isOpen: boolean;
        appointmentId: string;
        patientName: string;
    } | null>(null);
    const [selectedAssignTherapistId, setSelectedAssignTherapistId] = useState<string>('');
    const [totalUsersCount, setTotalUsersCount] = useState(0);
    const [totalAppointmentsCount, setTotalAppointmentsCount] = useState(0);
    const [therapists, setTherapists] = useState<User[]>([]);
    const [loadingTherapists, setLoadingTherapists] = useState(false);

    const [adminStats, setAdminStats] = useState<{
        totalUsers: number;
        totalTherapists: number;
        pendingRequests: number;
        assignedAppointments: number;
        completedSessions: number;
        emergencyReports: number;
    } | null>(null);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const params = new URLSearchParams();
            if (userSearch) params.append('search', userSearch);
            if (userRoleFilter && userRoleFilter !== 'all') params.append('role', userRoleFilter);
            params.append('page', String(userPage));
            params.append('limit', String(userLimit));

            const res = await fetch(joinUrl(API_URL, `/appointments/admin/users?${params.toString()}`), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            
            if (data && typeof data === 'object' && 'users' in data) {
                setUsers(Array.isArray(data.users) ? data.users : []);
                setTotalUsersCount(data.total || 0);
            } else {
                setUsers(Array.isArray(data) ? data : []);
                setTotalUsersCount(Array.isArray(data) ? data.length : 0);
            }
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
            const params = new URLSearchParams();
            if (appointmentSearch) params.append('search', appointmentSearch);
            if (appointmentStatusFilter && appointmentStatusFilter !== 'all') params.append('status', appointmentStatusFilter);
            if (appointmentDateFilter) params.append('date', appointmentDateFilter);
            if (appointmentTherapistFilter && appointmentTherapistFilter !== 'all') {
                params.append('therapistId', appointmentTherapistFilter);
            }
            params.append('page', String(appointmentPage));
            params.append('limit', String(appointmentLimit));

            const res = await fetch(joinUrl(API_URL, `/appointments/admin/all?${params.toString()}`), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            
            if (data && typeof data === 'object' && 'appointments' in data) {
                setAppointments(Array.isArray(data.appointments) ? data.appointments : []);
                setTotalAppointmentsCount(data.total || 0);
            } else {
                setAppointments(Array.isArray(data) ? data : []);
                setTotalAppointmentsCount(Array.isArray(data) ? data.length : 0);
            }
            // Clear any stale error toast on success
            toast.dismiss('admin-appts-error');
        } catch {
            toast.error('Failed to load appointments', { id: 'admin-appts-error', duration: 5000 });
        } finally {
            setLoadingAppointments(false);
        }
    };

    const fetchTherapists = async () => {
        setLoadingTherapists(true);
        try {
            const params = new URLSearchParams();
            params.append('role', 'therapist');
            if (therapistSearch) params.append('search', therapistSearch);

            const res = await fetch(joinUrl(API_URL, `/appointments/admin/users?${params.toString()}`), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            
            if (data && typeof data === 'object' && 'users' in data) {
                setTherapists(Array.isArray(data.users) ? data.users : []);
            } else {
                setTherapists(Array.isArray(data) ? data : []);
            }
        } catch {
            toast.error('Failed to load therapists');
        } finally {
            setLoadingTherapists(false);
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
                fetchAdminStats();
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
                fetchAdminStats();
            } else {
                toast.error(data.error || 'Failed to reject application.');
            }
        } catch {
            toast.error('Network error.');
        } finally {
            setActioningApp(null);
        }
    };

    const fetchAdminStats = async () => {
        try {
            const res = await fetch(joinUrl(API_URL, '/appointments/admin/stats'), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setAdminStats(data);
            }
        } catch (error) {
            // Silently handle
        }
    };

    const handleBlockUser = async (userId: string) => {
        try {
            const res = await fetch(joinUrl(API_URL, `/appointments/admin/users/${userId}/block`), {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('User blocked successfully');
                fetchUsers();
                fetchTherapists();
                fetchAdminStats();
            } else {
                toast.error('Failed to block user');
            }
        } catch {
            toast.error('Network error');
        }
    };

    const handleUnblockUser = async (userId: string) => {
        try {
            const res = await fetch(joinUrl(API_URL, `/appointments/admin/users/${userId}/unblock`), {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('User unblocked successfully');
                fetchUsers();
                fetchTherapists();
                fetchAdminStats();
            } else {
                toast.error('Failed to unblock user');
            }
        } catch {
            toast.error('Network error');
        }
    };

    const handleSuspendTherapist = async (therapistId: string) => {
        try {
            const res = await fetch(joinUrl(API_URL, `/appointments/admin/therapists/${therapistId}/suspend`), {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Therapist suspended successfully');
                fetchUsers();
                fetchTherapists();
                fetchAdminStats();
            } else {
                toast.error('Failed to suspend therapist');
            }
        } catch {
            toast.error('Network error');
        }
    };

    const handleUnsuspendTherapist = async (therapistId: string) => {
        try {
            const res = await fetch(joinUrl(API_URL, `/appointments/admin/therapists/${therapistId}/unsuspend`), {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Therapist unsuspended successfully');
                fetchUsers();
                fetchTherapists();
                fetchAdminStats();
            } else {
                toast.error('Failed to unsuspend therapist');
            }
        } catch {
            toast.error('Network error');
        }
    };

    const handleConfirmDelete = async () => {
        if (!confirmDeleteModal) return;
        const { id, type } = confirmDeleteModal;
        try {
            const url = type === 'user' 
                ? joinUrl(API_URL, `/appointments/admin/users/${id}`)
                : joinUrl(API_URL, `/appointments/admin/therapists/${id}?force=true`);

            const res = await fetch(url, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success(`${type === 'user' ? 'User' : 'Therapist'} deleted successfully`);
                fetchUsers();
                fetchTherapists();
                fetchAppointments();
                fetchAdminStats();
            } else {
                const data = await res.json();
                toast.error(data.message || `Failed to delete ${type}`);
            }
        } catch {
            toast.error('Network error');
        } finally {
            setConfirmDeleteModal(null);
        }
    };

    const handleConfirmAssign = async (appointmentId: string) => {
        try {
            const res = await fetch(joinUrl(API_URL, `/appointments/admin/appointments/${appointmentId}/assign`), {
                method: 'PUT',
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ therapistId: selectedAssignTherapistId })
            });
            if (res.ok) {
                toast.success('Therapist assigned successfully');
                fetchAppointments();
                fetchAdminStats();
                setAssignModal(null);
                setSelectedAssignTherapistId('');
            } else {
                const data = await res.json();
                toast.error(data.message || 'Failed to assign therapist');
            }
        } catch {
            toast.error('Network error');
        }
    };

    const handleAutoAssign = async (appointmentId: string) => {
        try {
            const res = await fetch(joinUrl(API_URL, `/appointments/admin/appointments/${appointmentId}/auto-assign`), {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                toast.success(`Therapist ${data.therapistName || ''} auto-assigned successfully`);
                fetchAppointments();
                fetchAdminStats();
                setAssignModal(null);
                setSelectedAssignTherapistId('');
            } else {
                const data = await res.json();
                toast.error(data.message || 'Failed to auto-assign therapist');
            }
        } catch {
            toast.error('Network error');
        }
    };

    const handleViewProfile = (user: User) => {
        const appData = user.role === 'therapist' 
            ? therapistApps.find(app => app.email.toLowerCase() === user.email.toLowerCase())
            : undefined;
        setProfileModal({
            isOpen: true,
            type: user.role === 'therapist' ? 'therapist' : 'user',
            data: user,
            applicationData: appData
        });
    };

    const handleDeleteTherapistClick = (therapist: User) => {
        const futureAppts = appointments.filter(apt => 
            apt.therapistId?._id === therapist._id &&
            ['Accepted', 'Pending Review'].includes(apt.status) &&
            new Date(apt.preferredDate) >= new Date()
        );

        const warningMsg = futureAppts.length > 0 
            ? `Warning: This therapist has ${futureAppts.length} future appointment(s). Deleting this therapist will reset these appointments back to unassigned (Pending Review).`
            : undefined;

        setConfirmDeleteModal({
            isOpen: true,
            type: 'therapist',
            id: therapist._id,
            name: therapist.full_name || therapist.email,
            warningMessage: warningMsg
        });
    };

    const renderPagination = (currentPage: number, totalPages: number, onPageChange: (p: number) => void) => {
        if (totalPages <= 1) return null;
        return (
            <div className="flex items-center justify-between mt-4 px-2">
                <span className="text-xs text-calm-500">Page {currentPage} of {totalPages}</span>
                <div className="flex gap-2">
                    <button
                        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg bg-calm-100 dark:bg-calm-800 hover:bg-calm-200 dark:hover:bg-calm-700 disabled:opacity-50 text-calm-700 dark:text-calm-300 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg bg-calm-100 dark:bg-calm-800 hover:bg-calm-200 dark:hover:bg-calm-700 disabled:opacity-50 text-calm-700 dark:text-calm-300 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    };

    useEffect(() => {
        if (token) {
            fetchUsers();
            fetchPaymentStats();
            fetchCommunityData();
            fetchTherapistApps();
            fetchAdminStats();
        }
    }, [userSearch, userRoleFilter, userPage, token]);

    useEffect(() => {
        if (token) {
            fetchAppointments();
        }
    }, [appointmentSearch, appointmentStatusFilter, appointmentDateFilter, appointmentTherapistFilter, appointmentPage, token]);

    useEffect(() => {
        if (token) {
            fetchTherapists();
        }
    }, [therapistSearch, token]);

    useEffect(() => {
        const fetchHealth = async () => {
            try {
                const res = await fetch(joinUrl(API_URL, '/health'));
                if (res.ok) {
                    const data = await res.json();
                    setSystemStatus({
                        database: data.database === 'connected' ? 'Connected' : 'Disconnected',
                        redis: data.redis === 'connected' ? 'Connected' : data.redis === 'disabled' ? 'Disabled' : 'Failed',
                        server: 'Online',
                    });
                } else {
                    setSystemStatus({
                        database: 'Unknown',
                        redis: 'Failed',
                        server: 'Online',
                    });
                }
            } catch (err) {
                setSystemStatus({
                    database: 'Unknown',
                    redis: 'Unknown',
                    server: 'Offline',
                });
            }
        };
        fetchHealth();
        const interval = setInterval(fetchHealth, 15000);
        return () => clearInterval(interval);
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
                fetchUsers();
                fetchTherapists();
            } else {
                toast.error('Failed to update role');
            }
        } catch {
            toast.error('Network error');
        } finally {
            setUpdatingRole(null);
        }
    };

    // Server-side paginated arrays
    const totalUserPages = Math.ceil(totalUsersCount / userLimit) || 1;
    const paginatedUsers = users;

    // Derived filtered therapists list from fetched therapists
    const filteredTherapists = therapists.filter((t) => {
        return therapistStatusFilter === 'all' || 
               (therapistStatusFilter === 'suspended' ? t.isSuspended : !t.isSuspended);
    });
    const totalTherapistPages = Math.ceil(filteredTherapists.length / therapistLimit) || 1;
    const paginatedTherapists = filteredTherapists.slice((therapistPage - 1) * therapistLimit, therapistPage * therapistLimit);

    // Server-side paginated appointments
    const totalAppointmentPages = Math.ceil(totalAppointmentsCount / appointmentLimit) || 1;
    const paginatedAppointments = appointments;

    const stats = [
        { label: 'Total Users', value: adminStats?.totalUsers ?? totalUsersCount, icon: Users, color: 'from-blue-500 to-indigo-500' },
        { label: 'Total Therapists', value: adminStats?.totalTherapists ?? therapists.length, icon: Shield, color: 'from-emerald-500 to-teal-500' },
        { label: 'Pending Requests', value: adminStats?.pendingRequests ?? therapistApps.filter(a => a.status === 'pending').length, icon: Clock, color: 'from-violet-500 to-purple-500' },
        { label: 'Assigned Appointments', value: adminStats?.assignedAppointments ?? totalAppointmentsCount, icon: Activity, color: 'from-amber-500 to-orange-500' },
        { label: 'Completed Sessions', value: adminStats?.completedSessions ?? 0, icon: CheckCircle2, color: 'from-green-500 to-emerald-600' },
        { label: 'Emergency Reports', value: adminStats?.emergencyReports ?? 0, icon: AlertTriangle, color: 'from-red-500 to-rose-600' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-calm-800 dark:text-white flex items-center gap-3">
                        <span className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-gradient-to-br dark:from-violet-500 dark:to-purple-600 flex items-center justify-center shadow-md dark:shadow-lg">
                            <Shield className="w-5 h-5 text-violet-600 dark:text-white" />
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
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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
                                    {['Pending Review', 'Accepted', 'Completed', 'Rejected', 'Missed', 'Cancelled'].map((status) => {
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

                        {/* Search and Filter controls */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-calm-400" />
                                <input
                                    type="text"
                                    placeholder="Search users by name or email..."
                                    value={userSearch}
                                    onChange={(e) => {
                                        setUserSearch(e.target.value);
                                        setUserPage(1);
                                    }}
                                    className="w-full text-sm pl-9 pr-4 py-2 rounded-xl bg-white/50 dark:bg-calm-800 border border-calm-200 dark:border-calm-700 text-calm-700 dark:text-calm-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                                />
                            </div>
                            <div className="flex gap-2">
                                <span className="p-2 rounded-xl bg-calm-100 dark:bg-calm-800 flex items-center justify-center shrink-0 border border-calm-200 dark:border-calm-700">
                                    <Filter className="w-4 h-4 text-calm-500" />
                                </span>
                                <select
                                    value={userRoleFilter}
                                    onChange={(e) => {
                                        setUserRoleFilter(e.target.value as any);
                                        setUserPage(1);
                                    }}
                                    className="w-full text-sm px-3 py-2 rounded-xl bg-white/50 dark:bg-calm-800 border border-calm-200 dark:border-calm-700 text-calm-700 dark:text-calm-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                                >
                                    <option value="all">All Roles</option>
                                    <option value="user">User</option>
                                    <option value="therapist">Therapist</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>

                        {loadingUsers ? (
                            <GlassCard className="p-12 text-center" hover={false}>
                                <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
                            </GlassCard>
                        ) : paginatedUsers.length === 0 ? (
                            <GlassCard className="p-12 text-center" hover={false}>
                                <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-calm-400" />
                                <p className="text-sm text-calm-550 dark:text-calm-400">No users found matching filters.</p>
                            </GlassCard>
                        ) : paginatedUsers.map((user) => (
                            <GlassCard key={user._id} className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 text-white font-bold text-sm">
                                        {(user.full_name || user.email)[0]?.toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-calm-800 dark:text-white text-sm">{user.full_name || 'No Name'}</span>
                                            <Badge variant={roleColor[user.role]} size="sm">{user.role}</Badge>
                                            {user.isVerified && <Badge variant="success" size="sm">✓ Verified</Badge>}
                                            {user.isBlocked && <Badge variant="error" size="sm">Blocked</Badge>}
                                            {user.isSuspended && <Badge variant="error" size="sm">Suspended</Badge>}
                                        </div>
                                        <p className="text-xs text-calm-500">{user.email}</p>
                                        <p className="text-xs text-calm-400">Joined {safeFormatDate(user.createdAt, 'MMM d, yyyy')}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => handleViewProfile(user)}
                                            className="p-1.5 rounded-lg bg-calm-100 dark:bg-calm-800 hover:bg-calm-200 text-calm-600 dark:text-calm-400 transition-colors"
                                            title="View Profile"
                                        >
                                            <Eye className="w-4.5 h-4.5" />
                                        </button>
                                        <select
                                            value={user.role}
                                            onChange={(e) => updateRole(user._id, e.target.value)}
                                            disabled={updatingRole === user._id}
                                            className="text-sm px-3 py-1.5 rounded-lg bg-white/50 dark:bg-calm-800 border border-calm-200 dark:border-calm-700 text-calm-700 dark:text-calm-300 focus:outline-none"
                                        >
                                            <option value="user">User</option>
                                            <option value="therapist">Therapist</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                        {user.isBlocked ? (
                                            <button
                                                onClick={() => handleUnblockUser(user._id)}
                                                className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition-colors border border-emerald-500/20"
                                                title="Unblock User"
                                            >
                                                <UserCheck className="w-4.5 h-4.5" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleBlockUser(user._id)}
                                                className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 transition-colors border border-amber-500/20"
                                                title="Block User"
                                            >
                                                <UserX className="w-4.5 h-4.5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setConfirmDeleteModal({
                                                isOpen: true,
                                                type: 'user',
                                                id: user._id,
                                                name: user.full_name || user.email
                                            })}
                                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors border border-red-500/20"
                                            title="Delete User"
                                        >
                                            <Trash2 className="w-4.5 h-4.5" />
                                        </button>
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                        {renderPagination(userPage, totalUserPages, setUserPage)}
                    </motion.div>
                )}

                {activeTab === 'therapists' && (
                    <motion.div key="therapists" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold text-calm-800 dark:text-white">Active Therapists</h2>
                        </div>

                        {/* Search and Filter controls */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-calm-400" />
                                <input
                                    type="text"
                                    placeholder="Search therapists by name or email..."
                                    value={therapistSearch}
                                    onChange={(e) => {
                                        setTherapistSearch(e.target.value);
                                        setTherapistPage(1);
                                    }}
                                    className="w-full text-sm pl-9 pr-4 py-2 rounded-xl bg-white/50 dark:bg-calm-800 border border-calm-200 dark:border-calm-700 text-calm-700 dark:text-calm-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                                />
                            </div>
                            <div className="flex gap-2">
                                <span className="p-2 rounded-xl bg-calm-100 dark:bg-calm-800 flex items-center justify-center shrink-0 border border-calm-200 dark:border-calm-700">
                                    <Filter className="w-4 h-4 text-calm-500" />
                                </span>
                                <select
                                    value={therapistStatusFilter}
                                    onChange={(e) => {
                                        setTherapistStatusFilter(e.target.value as any);
                                        setTherapistPage(1);
                                    }}
                                    className="w-full text-sm px-3 py-2 rounded-xl bg-white/50 dark:bg-calm-800 border border-calm-200 dark:border-calm-700 text-calm-700 dark:text-calm-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="active">Active</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                            </div>
                        </div>

                        {loadingTherapists ? (
                            <GlassCard className="p-12 text-center" hover={false}>
                                <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
                            </GlassCard>
                        ) : therapists.length === 0 ? (
                            <GlassCard className="p-12 text-center" hover={false}>
                                <Shield className="w-16 h-16 text-calm-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-calm-800 dark:text-white mb-2">No active therapist accounts</h3>
                                <p className="text-calm-400 text-sm">Approve a therapist application to create a therapist account.</p>
                            </GlassCard>
                        ) : paginatedTherapists.length === 0 ? (
                            <GlassCard className="p-12 text-center" hover={false}>
                                <Shield className="w-12 h-12 mx-auto mb-3 opacity-30 text-calm-400" />
                                <p className="text-sm text-calm-550 dark:text-calm-400">No therapists match the filters.</p>
                            </GlassCard>
                        ) : paginatedTherapists.map((user) => (
                            <GlassCard key={user._id} className="p-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0 text-white font-bold">
                                        {(user.full_name || user.email)[0]?.toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                            <h3 className="font-bold text-calm-800 dark:text-white">{user.full_name || 'No Name'}</h3>
                                            <Badge variant="success" size="sm">Therapist</Badge>
                                            {user.isVerified && <Badge variant="success" size="sm">✓ Verified</Badge>}
                                            {user.isBlocked && <Badge variant="error" size="sm">Blocked</Badge>}
                                            {user.isSuspended && <Badge variant="error" size="sm">Suspended</Badge>}
                                        </div>
                                        <p className="text-sm text-calm-500">{user.email}</p>
                                        <p className="text-xs text-calm-400">Joined {safeFormatDate(user.createdAt, 'MMM d, yyyy')}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => handleViewProfile(user)}
                                            className="p-1.5 rounded-lg bg-calm-100 dark:bg-calm-800 hover:bg-calm-200 text-calm-600 dark:text-calm-400 transition-colors"
                                            title="View Profile"
                                        >
                                            <Eye className="w-4.5 h-4.5" />
                                        </button>
                                        {user.isSuspended ? (
                                            <button
                                                onClick={() => handleUnsuspendTherapist(user._id)}
                                                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-bold border border-emerald-500/20 transition-all"
                                                title="Unsuspend Therapist"
                                            >
                                                Unsuspend
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleSuspendTherapist(user._id)}
                                                className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-bold border border-amber-500/20 transition-all"
                                                title="Suspend Therapist"
                                            >
                                                Suspend
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDeleteTherapistClick(user)}
                                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors border border-red-500/20"
                                            title="Delete Therapist"
                                        >
                                            <Trash2 className="w-4.5 h-4.5" />
                                        </button>
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                        {renderPagination(therapistPage, totalTherapistPages, setTherapistPage)}
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
                                                    Applied {safeFormatDate(app.createdAt, 'MMM d, yyyy')}
                                                    {app.reviewed_at && ` · Reviewed ${safeFormatDate(app.reviewed_at, 'MMM d, yyyy')}`}
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

                        {/* Search and Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-calm-400" />
                                <input
                                    type="text"
                                    placeholder="Search by patient, therapist, reason..."
                                    value={appointmentSearch}
                                    onChange={(e) => {
                                        setAppointmentSearch(e.target.value);
                                        setAppointmentPage(1);
                                    }}
                                    className="w-full text-sm pl-9 pr-4 py-2 rounded-xl bg-white/50 dark:bg-calm-800 border border-calm-200 dark:border-calm-700 text-calm-700 dark:text-calm-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                                />
                            </div>

                            <select
                                value={appointmentStatusFilter}
                                onChange={(e) => {
                                    setAppointmentStatusFilter(e.target.value);
                                    setAppointmentPage(1);
                                }}
                                className="w-full text-sm px-3 py-2 rounded-xl bg-white/50 dark:bg-calm-800 border border-calm-200 dark:border-calm-700 text-calm-700 dark:text-calm-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                            >
                                <option value="all">All Statuses</option>
                                <option value="Pending Review">Pending Review</option>
                                <option value="Accepted">Accepted</option>
                                <option value="Completed">Completed</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Cancelled">Cancelled</option>
                                <option value="Missed">Missed</option>
                            </select>

                            <select
                                value={appointmentTherapistFilter}
                                onChange={(e) => {
                                    setAppointmentTherapistFilter(e.target.value);
                                    setAppointmentPage(1);
                                }}
                                className="w-full text-sm px-3 py-2 rounded-xl bg-white/50 dark:bg-calm-800 border border-calm-200 dark:border-calm-700 text-calm-700 dark:text-calm-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                            >
                                <option value="all">All Therapists</option>
                                <option value="unassigned">Unassigned</option>
                                {users.filter(u => u.role === 'therapist').map(t => (
                                    <option key={t._id} value={t._id}>{t.full_name}</option>
                                ))}
                            </select>

                            <input
                                type="date"
                                value={appointmentDateFilter}
                                onChange={(e) => {
                                    setAppointmentDateFilter(e.target.value);
                                    setAppointmentPage(1);
                                }}
                                className="w-full text-sm px-3 py-2 rounded-xl bg-white/50 dark:bg-calm-800 border border-calm-200 dark:border-calm-700 text-calm-700 dark:text-calm-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                            />
                        </div>

                        {loadingAppointments ? (
                            <GlassCard className="p-12 text-center" hover={false}>
                                <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
                            </GlassCard>
                        ) : paginatedAppointments.length === 0 ? (
                            <GlassCard className="p-12 text-center" hover={false}>
                                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30 text-calm-400" />
                                <p className="text-sm text-calm-550 dark:text-calm-400">No appointments found matching filters.</p>
                            </GlassCard>
                        ) : paginatedAppointments.map((apt) => {
                            const isPendingUnassigned = apt.status === 'Pending Review' && !apt.therapistId;
                            return (
                                <GlassCard key={apt._id} className="p-4">
                                    <div className="flex items-center justify-between gap-4 flex-wrap">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-medium text-calm-800 dark:text-white">
                                                    {apt.userId?.full_name || 'Unknown'}
                                                </span>
                                                <span className="text-calm-400">→</span>
                                                <span className="text-sm text-calm-600 dark:text-calm-400">
                                                    {apt.therapistId?.full_name || 'Unassigned'}
                                                </span>
                                                <Badge variant={apt.status === 'Accepted' ? 'success' : (apt.status === 'Rejected' || apt.status === 'Cancelled' || apt.status === 'Missed') ? 'error' : apt.status === 'Completed' ? 'success' : 'warning'} size="sm">
                                                    {apt.status}
                                                </Badge>
                                            </div>
                                            <div className="flex gap-3 text-xs text-calm-500 mt-1">
                                                <span>{safeFormatDate(apt.preferredDate, 'MMM d, yyyy')}</span>
                                                <span>•</span>
                                                <span>{apt.sessionType} Session</span>
                                                {apt.reason && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="truncate max-w-[200px]" title={apt.reason}>Reason: {apt.reason}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {isPendingUnassigned && (
                                            <button
                                                onClick={() => setAssignModal({
                                                    isOpen: true,
                                                    appointmentId: apt._id,
                                                    patientName: apt.userId?.full_name || 'Unknown'
                                                })}
                                                className="px-3 py-1.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-bold text-xs transition-all shadow-md shadow-violet-500/10 shrink-0"
                                            >
                                                Assign Therapist
                                            </button>
                                        )}
                                    </div>
                                </GlassCard>
                            );
                        })}
                        {renderPagination(appointmentPage, totalAppointmentPages, setAppointmentPage)}
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
                                { 
                                    label: 'MongoDB', 
                                    value: systemStatus?.database || 'Connecting...', 
                                    icon: Database, 
                                    color: systemStatus?.database === 'Connected' ? 'text-emerald-500' : 'text-red-500' 
                                },
                                { 
                                    label: 'Server', 
                                    value: systemStatus?.server || 'Checking...', 
                                    icon: Globe, 
                                    color: systemStatus?.server === 'Online' ? 'text-blue-500' : 'text-red-500' 
                                },
                                { 
                                    label: 'Redis', 
                                    value: systemStatus?.redis || 'Checking...', 
                                    icon: HardDrive, 
                                    color: systemStatus?.redis === 'Connected' ? 'text-emerald-500' : systemStatus?.redis === 'Disabled' ? 'text-violet-500' : 'text-red-500' 
                                },
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

            {/* Modals */}
            {confirmDeleteModal && confirmDeleteModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <GlassCard className="max-w-md w-full p-6 border-red-500/20" hover={false}>
                        <div className="flex items-center gap-3 text-red-500 mb-4">
                            <AlertTriangle className="w-8 h-8" />
                            <h3 className="text-xl font-bold dark:text-white">Confirm Deletion</h3>
                        </div>
                        <p className="text-sm text-calm-600 dark:text-calm-300 mb-4">
                            Are you sure you want to delete the {confirmDeleteModal.type} <strong>{confirmDeleteModal.name}</strong>? This action cannot be undone.
                        </p>
                        {confirmDeleteModal.warningMessage && (
                            <div className="p-3 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs">
                                {confirmDeleteModal.warningMessage}
                            </div>
                        )}
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setConfirmDeleteModal(null)}
                                className="px-4 py-2 rounded-xl bg-calm-100 dark:bg-calm-800 hover:bg-calm-200 dark:hover:bg-calm-700 text-calm-700 dark:text-calm-300 text-sm font-semibold transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 rounded-xl bg-red-650 hover:bg-red-700 text-white text-sm font-semibold transition-all shadow-lg shadow-red-500/10"
                            >
                                Delete
                            </button>
                        </div>
                    </GlassCard>
                </div>
            )}

            {profileModal && profileModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <GlassCard className="max-w-lg w-full p-6 border-white/10" hover={false}>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-calm-800 dark:text-white">User Profile</h3>
                                <p className="text-xs text-calm-500 mt-0.5">Account ID: {profileModal.data._id}</p>
                            </div>
                            <button
                                onClick={() => setProfileModal(null)}
                                className="p-1 rounded-lg hover:bg-calm-100 dark:hover:bg-calm-800 text-calm-500 transition-all"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-calm-50/50 dark:bg-calm-800/20 border border-calm-150 dark:border-white/5">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                    {(profileModal.data.full_name || profileModal.data.email)[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-calm-800 dark:text-white">{profileModal.data.full_name || 'No Name'}</h4>
                                    <div className="flex gap-2 mt-1">
                                        <Badge variant={roleColor[profileModal.data.role]} size="sm">{profileModal.data.role}</Badge>
                                        {profileModal.data.isVerified && <Badge variant="success" size="sm">✓ Verified</Badge>}
                                        {profileModal.data.isBlocked && <Badge variant="error" size="sm">Blocked</Badge>}
                                        {profileModal.data.isSuspended && <Badge variant="error" size="sm">Suspended</Badge>}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-3 rounded-xl bg-calm-50/50 dark:bg-white/5 border border-calm-100 dark:border-white/5">
                                    <p className="text-[10px] font-bold text-calm-400 uppercase tracking-wider mb-1">Email Address</p>
                                    <p className="text-sm font-semibold text-calm-800 dark:text-calm-300">{profileModal.data.email}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-calm-50/50 dark:bg-white/5 border border-calm-100 dark:border-white/5">
                                    <p className="text-[10px] font-bold text-calm-400 uppercase tracking-wider mb-1">Join Date</p>
                                    <p className="text-sm font-semibold text-calm-800 dark:text-calm-300">{safeFormatDate(profileModal.data.createdAt, 'MMMM d, yyyy')}</p>
                                </div>
                            </div>

                            {profileModal.applicationData && (
                                <>
                                    <h4 className="text-sm font-bold text-calm-500 uppercase tracking-wider mt-4">Professional Details</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 rounded-xl bg-calm-50/50 dark:bg-white/5 border border-calm-100 dark:border-white/5">
                                            <p className="text-[10px] font-bold text-calm-400 uppercase tracking-wider mb-1">Qualification</p>
                                            <p className="text-xs font-semibold text-calm-700 dark:text-calm-300 truncate">{profileModal.applicationData.qualification}</p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-calm-50/50 dark:bg-white/5 border border-calm-100 dark:border-white/5">
                                            <p className="text-[10px] font-bold text-calm-400 uppercase tracking-wider mb-1">Specialization</p>
                                            <p className="text-xs font-semibold text-calm-700 dark:text-calm-300 truncate">{profileModal.applicationData.specialization}</p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-calm-50/50 dark:bg-white/5 border border-calm-100 dark:border-white/5">
                                            <p className="text-[10px] font-bold text-calm-400 uppercase tracking-wider mb-1">Experience</p>
                                            <p className="text-xs font-semibold text-calm-700 dark:text-calm-300">{profileModal.applicationData.experience_years} years</p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-calm-50/50 dark:bg-white/5 border border-calm-100 dark:border-white/5">
                                            <p className="text-[10px] font-bold text-calm-400 uppercase tracking-wider mb-1">License Number</p>
                                            <p className="text-xs font-semibold text-calm-700 dark:text-calm-300 truncate">{profileModal.applicationData.license_number}</p>
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-calm-50/50 dark:bg-white/5 border border-calm-100 dark:border-white/5">
                                        <p className="text-[10px] font-bold text-calm-400 uppercase tracking-wider mb-1">Bio</p>
                                        <p className="text-xs text-calm-600 dark:text-calm-400 leading-relaxed">{profileModal.applicationData.bio}</p>
                                    </div>
                                </>
                            )}
                        </div>
                        
                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => setProfileModal(null)}
                                className="px-4 py-2 rounded-xl bg-violet-550 hover:bg-violet-600 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-500/10"
                            >
                                Close Profile
                            </button>
                        </div>
                    </GlassCard>
                </div>
            )}

            {assignModal && assignModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <GlassCard className="max-w-md w-full p-6 border-white/10" hover={false}>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-calm-800 dark:text-white">Assign Therapist</h3>
                                <p className="text-xs text-calm-500 mt-0.5">Appointment for: {assignModal.patientName}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setAssignModal(null);
                                    setSelectedAssignTherapistId('');
                                }}
                                className="p-1 rounded-lg hover:bg-calm-100 dark:hover:bg-calm-800 text-calm-500 transition-all"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-calm-400 uppercase tracking-wider mb-2">Select Approved Therapist</label>
                                <select
                                    value={selectedAssignTherapistId}
                                    onChange={(e) => setSelectedAssignTherapistId(e.target.value)}
                                    className="w-full text-sm p-2.5 rounded-xl bg-white/50 dark:bg-calm-800 border border-calm-200 dark:border-calm-700 text-calm-700 dark:text-calm-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                                >
                                    <option value="">-- Choose Therapist --</option>
                                    {users.filter(u => u.role === 'therapist' && !u.isBlocked && !u.isSuspended).map(t => (
                                        <option key={t._id} value={t._id}>{t.full_name} ({t.email})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2 my-2">
                                <span className="h-px bg-calm-200 dark:bg-calm-700 flex-1" />
                                <span className="text-[10px] font-bold text-calm-400 uppercase">Or</span>
                                <span className="h-px bg-calm-200 dark:bg-calm-700 flex-1" />
                            </div>

                            <button
                                onClick={() => handleAutoAssign(assignModal.appointmentId)}
                                className="w-full py-2.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-550 font-semibold text-sm border border-violet-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                <Activity className="w-4 h-4 animate-pulse" /> Auto Assign (Least Loaded Therapist)
                            </button>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setAssignModal(null);
                                    setSelectedAssignTherapistId('');
                                }}
                                className="px-4 py-2 rounded-xl bg-calm-100 dark:bg-calm-800 hover:bg-calm-200 dark:hover:bg-calm-700 text-calm-700 dark:text-calm-300 text-sm font-semibold transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleConfirmAssign(assignModal.appointmentId)}
                                disabled={!selectedAssignTherapistId}
                                className="px-4 py-2 rounded-xl bg-violet-550 hover:bg-violet-600 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/10"
                            >
                                Assign
                            </button>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
