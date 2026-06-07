import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, Clock, CheckCircle, User, FileText,
    Video, MessageSquare, TrendingUp, Search, Filter,
    Plus, MoreHorizontal, Settings, Shield, Clock3
} from 'lucide-react';
import { GlassCard, Badge } from '@components/ui/Layout';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { API_URL, joinUrl } from '@utils/apiUtils';
import { useAppSelector } from '@hooks/useRedux';
import { cn } from '@utils/cn';
import { useHealthCheck } from '@hooks/useHealthCheck';
import { connectConsultationSocket, disconnectConsultationSocket } from '@lib/consultationSocket';

interface Appointment {
    _id: string;
    userId: { full_name: string; email: string } | string;
    sessionType: 'Video' | 'Audio' | 'Chat';
    preferredDate: string;
    preferredTime: string;
    reason: string;
    notes?: string;
    status: string;
    sessionStatus?: string; // 'pending_session' | 'live' | 'ended'
    sessionNotes?: string;
}

export const TherapistDashboard: React.FC = () => {
    const { session, profile } = useAppSelector((s) => s.auth);
    const token = session?.access_token;
    const navigate = useNavigate();
    const location = useLocation();

    // Derive active tab from URL query param
    const queryParams = new URLSearchParams(location.search);
    const validTabs = ['dashboard', 'appointments', 'availability', 'notes'];
    const rawTab = queryParams.get('tab')?.toLowerCase() || 'dashboard';
    const activeTab = (validTabs.includes(rawTab) ? rawTab : 'dashboard') as
        'dashboard' | 'appointments' | 'availability' | 'notes';

    const [pending, setPending] = useState<Appointment[]>([]);
    const [mine, setMine] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(false);
    const [notesInput, setNotesInput] = useState<Record<string, string>>({});

    // Centralized health monitoring
    useHealthCheck();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pRes, mRes] = await Promise.all([
                fetch(joinUrl(API_URL, '/appointments/therapist/pending'), { headers: { Authorization: `Bearer ${token}` } }),
                fetch(joinUrl(API_URL, '/appointments/therapist/mine'), { headers: { Authorization: `Bearer ${token}` } })
            ]);
            const pData = pRes.ok && pRes.headers.get('content-type')?.includes('application/json') ? await pRes.json() : [];
            const mData = mRes.ok && mRes.headers.get('content-type')?.includes('application/json') ? await mRes.json() : [];
            setPending(Array.isArray(pData) ? pData : []);
            setMine(Array.isArray(mData) ? mData : []);
            // Dismiss any stale error toast on successful fetch
            toast.dismiss('therapist-sync-error');
        } catch {
            toast.error('Failed to sync dashboard data', { id: 'therapist-sync-error', duration: 5000 });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchData();
    }, [token]);

    // ── Socket.io: real-time pending list update ─────────────────────────────
    // When any therapist accepts an appointment, the server emits 'appointment_taken'
    // to all connected sockets. We remove that appointment from our pending list
    // immediately — no page refresh needed.
    useEffect(() => {
        if (!token) return;

        const socket = connectConsultationSocket();

        const onAppointmentTaken = ({ appointmentId }: { appointmentId: string }) => {
            setPending(prev => prev.filter(a => a._id !== appointmentId));
        };

        socket.on('appointment_taken', onAppointmentTaken);

        return () => {
            socket.off('appointment_taken', onAppointmentTaken);
            disconnectConsultationSocket();
        };
    }, [token]);

    const handleAction = async (id: string, action: 'accept' | 'reject' | 'complete') => {
        try {
            const endpoint = action === 'complete' ? `/appointments/${id}/notes` : `/appointments/${id}/${action}`;
            const res = await fetch(joinUrl(API_URL, endpoint), {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: action === 'complete' ? JSON.stringify({ sessionNotes: notesInput[id] || 'Session completed.' }) : undefined
            });

            if (res.status === 409) {
                // Another therapist accepted first — refresh and show message
                toast.error('This appointment was already accepted by another therapist.', { duration: 5000 });
                fetchData(); // refresh to remove from pending list
                return;
            }

            if (res.ok) {
                toast.success(action === 'accept' ? 'Appointment accepted!' : `Session ${action}ed`);
                fetchData();
            } else {
                const d = await res.json().catch(() => ({}));
                toast.error(d.message || 'Action failed');
            }
        } catch {
            toast.error('Action failed');
        }
    };

    // Start a live session — sets sessionStatus = 'live' on the appointment
    // and notifies the patient via Socket.io
    const handleStartSession = async (apt: Appointment) => {
        try {
            const res = await fetch(joinUrl(API_URL, `/appointments/${apt._id}/start-session`), {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            });
            if (res.ok) {
                toast.success('Session started — patient has been notified.');
                fetchData();
                navigate(`/consultation?type=${apt.sessionType.toLowerCase()}&appointmentId=${apt._id}`);
            } else {
                const d = await res.json();
                toast.error(d.message || 'Failed to start session.');
            }
        } catch {
            toast.error('Failed to start session.');
        }
    };

    // Reset an accidentally-started session back to pending_session
    const handleResetSession = async (aptId: string) => {
        try {
            const res = await fetch(joinUrl(API_URL, `/appointments/${aptId}/reset-session`), {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            });
            if (res.ok) {
                toast.success('Session reset to pending.');
                fetchData();
            } else {
                const d = await res.json();
                toast.error(d.message || 'Failed to reset session.');
            }
        } catch {
            toast.error('Failed to reset session.');
        }
    };

    const stats = useMemo(() => [
        { label: 'Pending Requests', value: pending.length, icon: Clock, color: 'bg-amber-500/10 text-amber-500' },
        { label: 'Confirmed Sessions', value: mine.filter(a => a.status === 'Accepted').length, icon: CheckCircle, color: 'bg-emerald-500/10 text-emerald-500' },
        { label: 'Today\'s Schedule', value: mine.filter(a => a.status === 'Accepted').length, icon: Calendar, color: 'bg-blue-500/10 text-blue-500' },
        { label: 'Unique Patients', value: new Set(mine.map(a => typeof a.userId === 'object' ? a.userId.email : a.userId)).size, icon: User, color: 'bg-violet-500/10 text-violet-500' },
    ], [pending, mine]);

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-calm-800 dark:text-white flex items-center gap-3">
                        {profile?.full_name?.split(' ')[0] || 'Therapist'} 👋
                    </h1>
                    <p className="text-calm-500 dark:text-calm-400 mt-2 text-lg">Practice Management Portal</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchData} className="p-3 rounded-2xl bg-white/10 border border-white/20 text-calm-600 dark:text-calm-400 hover:bg-lavender-500/10 hover:text-lavender-500 transition-all group">
                        <TrendingUp className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    </button>
                    <div className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-bold flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Online
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'dashboard' && (
                    <motion.div
                        key="dashboard"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                    >
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {stats.map((stat) => (
                                <GlassCard key={stat.label} className="p-6" hover={false}>
                                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4", stat.color)}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                    <p className="text-3xl font-bold text-calm-800 dark:text-white mb-1">{stat.value}</p>
                                    <p className="text-xs text-calm-500 dark:text-calm-400 uppercase tracking-widest font-bold">{stat.label}</p>
                                </GlassCard>
                            ))}
                        </div>

                        {/* Recent Activity List */}
                        <GlassCard className="p-6" hover={false}>
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold text-calm-800 dark:text-white flex items-center gap-2">
                                    <Clock3 className="w-6 h-6 text-lavender-500" /> Recent Requests
                                </h2>
                                <Badge variant="info">Real-time sync active</Badge>
                            </div>

                            <div className="space-y-4">
                                {loading ? (
                                    [1, 2, 3].map(i => <div key={i} className="h-24 bg-calm-100/30 animate-pulse rounded-2xl" />)
                                ) : [...pending, ...mine].length === 0 ? (
                                    <div className="text-center py-12">
                                        <MessageSquare className="w-16 h-16 text-calm-300 mx-auto mb-4" />
                                        <p className="text-calm-500 font-medium font-inter">No recent requests to display</p>
                                    </div>
                                ) : [...pending, ...mine].sort((a, b) => new Date(b.preferredDate).getTime() - new Date(a.preferredDate).getTime()).slice(0, 4).map((apt) => {
                                    const user = typeof apt.userId === 'object' ? apt.userId : { full_name: 'Patient', email: 'pt@mindwell.ai' };
                                    const isPending = apt.status === 'Pending Review';
                                    const isAccepted = apt.status === 'Accepted';

                                    return (
                                        <div key={apt._id} className="p-4 rounded-3xl bg-calm-500/5 border border-white/5 hover:border-lavender-500/20 transition-all flex items-center justify-between flex-wrap gap-4 group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lavender-500/20 to-accent-500/20 flex items-center justify-center text-lavender-500 font-bold group-hover:scale-105 transition-transform">
                                                    {user.full_name[0]?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-calm-800 dark:text-white">{user.full_name}</h4>
                                                        <Badge variant={isPending ? 'warning' : 'success'} size="sm">{apt.status}</Badge>
                                                    </div>
                                                    <p className="text-xs text-calm-500">{apt.sessionType} • {format(new Date(apt.preferredDate), 'MMM d, h:mm a')}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {isPending ? (
                                                    <button onClick={() => handleAction(apt._id, 'accept')} className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 transition-all">
                                                        Accept
                                                    </button>
                                                ) : isAccepted && (
                                                    apt.sessionStatus === 'live' ? (
                                                        <div className="flex flex-col gap-1 items-end">
                                                            <button
                                                                onClick={() => navigate(`/consultation?type=${apt.sessionType.toLowerCase()}&appointmentId=${apt._id}`)}
                                                                className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 transition-all flex items-center gap-1"
                                                            >
                                                                <Video className="w-3 h-3" /> Join Session
                                                            </button>
                                                            <button
                                                                onClick={() => handleResetSession(apt._id)}
                                                                className="text-[10px] text-calm-400 hover:text-red-400 transition-colors underline"
                                                            >
                                                                Reset session
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleStartSession(apt)}
                                                            className="px-4 py-2 rounded-xl bg-lavender-500 text-white font-bold text-xs hover:bg-lavender-600 transition-all flex items-center gap-1"
                                                        >
                                                            <Video className="w-3 h-3" /> Start Session
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </GlassCard>
                    </motion.div>
                )}

                {activeTab === 'appointments' && (
                    <motion.div
                        key="appointments"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <GlassCard className="p-8" hover={false}>
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold text-calm-800 dark:text-white">Full Session Management</h2>
                                <div className="flex gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-calm-400" />
                                        <input type="text" placeholder="Search patient..." className="pl-10 pr-4 py-2 rounded-xl bg-calm-100/50 dark:bg-calm-800 border border-calm-200 dark:border-calm-700 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-500/50" />
                                    </div>
                                    <button className="p-2 rounded-xl bg-calm-100 dark:bg-calm-800 text-calm-500 hover:text-lavender-500 transition-colors">
                                        <Filter className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {[...pending, ...mine].sort((a, b) => new Date(b.preferredDate).getTime() - new Date(a.preferredDate).getTime()).map((apt) => {
                                    const user = typeof apt.userId === 'object' ? apt.userId : { full_name: 'Patient', email: 'pt@mindwell.ai' };
                                    const isPending = apt.status === 'Pending Review';
                                    const isAccepted = apt.status === 'Accepted';

                                    return (
                                        <div key={apt._id} className="p-6 rounded-3xl bg-calm-50/30 dark:bg-white/5 border border-white/5 hover:border-lavender-500/30 transition-all">
                                            <div className="flex items-center justify-between flex-wrap gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-lavender-500 to-accent-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-lavender-500/20">
                                                        {user.full_name[0]?.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-bold text-calm-800 dark:text-white">{user.full_name}</h4>
                                                        <p className="text-sm text-calm-500">{user.email}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant={isPending ? 'warning' : 'success'} size="sm">{apt.status}</Badge>
                                                            <span className="text-xs text-calm-400 font-medium">• {apt.sessionType} Session</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-calm-700 dark:text-calm-200">{format(new Date(apt.preferredDate), 'EEEE, MMM d')}</p>
                                                        <p className="text-xs text-calm-400 font-bold uppercase mt-0.5">{apt.preferredTime || '10:00 AM'}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {isPending ? (
                                                            <>
                                                                <button onClick={() => handleAction(apt._id, 'accept')} className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 shadow-lg shadow-emerald-500/10">Accept</button>
                                                                <button onClick={() => handleAction(apt._id, 'reject')} className="px-5 py-2.5 rounded-xl bg-white/10 text-red-500 font-bold text-sm hover:bg-red-500/10 border border-white/10">Reject</button>
                                                            </>
                                                        ) : isAccepted ? (
                                                            apt.sessionStatus === 'live' ? (
                                                                <div className="flex flex-col gap-1 items-end">
                                                                    <button
                                                                        onClick={() => navigate(`/consultation?type=${apt.sessionType.toLowerCase()}&appointmentId=${apt._id}`)}
                                                                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm hover:opacity-90 shadow-lg flex items-center gap-2"
                                                                    >
                                                                        <Video className="w-4 h-4" /> Join Session
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleResetSession(apt._id)}
                                                                        className="text-[10px] text-calm-400 hover:text-red-400 transition-colors underline"
                                                                    >
                                                                        Reset session
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleStartSession(apt)}
                                                                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-lavender-500 to-accent-500 text-white font-bold text-sm hover:opacity-90 shadow-lg shadow-lavender-500/20 flex items-center gap-2"
                                                                >
                                                                    <Video className="w-4 h-4" /> Start Session
                                                                </button>
                                                            )
                                                        ) : (
                                                            <button className="p-2.5 rounded-xl bg-calm-100 dark:bg-calm-800 text-calm-400 hover:text-lavender-500">
                                                                <MoreHorizontal className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </GlassCard>
                    </motion.div>
                )}

                {activeTab === 'availability' && (
                    <motion.div
                        key="availability"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <GlassCard className="p-8" hover={false}>
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold text-calm-800 dark:text-white">Schedule Management</h2>
                                <button className="px-4 py-2 rounded-xl bg-lavender-500 text-white font-bold text-sm hover:bg-lavender-600 transition-all flex items-center gap-2">
                                    <Plus className="w-4 h-4" /> Add Time Slot
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                    <div key={day} className="p-4 rounded-2xl bg-calm-500/5 border border-white/5 text-center flex flex-col items-center justify-center min-h-[120px]">
                                        <p className="text-xs font-bold text-calm-500 uppercase mb-3">{day}</p>
                                        <div className="space-y-2">
                                            <p className="text-[10px] text-calm-400 font-medium italic">No slots set</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 p-6 rounded-2xl bg-lavender-500/5 border border-lavender-500/10 flex items-center gap-4">
                                <Shield className="w-8 h-8 text-lavender-500" />
                                <div>
                                    <p className="text-sm font-bold text-calm-800 dark:text-white tracking-tight">Practice Status: Active</p>
                                    <p className="text-xs text-calm-500">Your profile and schedule are visible to patients seeking new consultations.</p>
                                </div>
                                <div className="ml-auto">
                                    <button className="px-4 py-2 rounded-xl bg-white dark:bg-calm-800 text-calm-600 dark:text-calm-300 font-bold text-xs border border-calm-200 dark:border-calm-700">Update Profile</button>
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                )}

                {activeTab === 'notes' && (
                    <motion.div
                        key="notes"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <GlassCard className="p-8" hover={false}>
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold text-calm-800 dark:text-white">Clinical Session Notes</h2>
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 rounded-xl bg-calm-100 dark:bg-calm-800 text-calm-600 dark:text-calm-400 font-bold text-sm">All Journals</button>
                                    <button className="px-4 py-2 rounded-xl bg-calm-100 dark:bg-calm-800 text-calm-600 dark:text-calm-400 font-bold text-sm">Archived</button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {mine.filter(a => a.status === 'Completed' || a.sessionNotes).length === 0 ? (
                                    <div className="text-center py-12">
                                        <FileText className="w-16 h-16 text-calm-200 mx-auto mb-4" />
                                        <p className="text-calm-400 font-medium font-inter">No clinical records found</p>
                                    </div>
                                ) : mine.filter(a => a.status === 'Completed' || a.sessionNotes).map((apt) => {
                                    const user = typeof apt.userId === 'object' ? apt.userId : { full_name: 'Patient', email: 'pt@mindwell.ai' };
                                    return (
                                        <div key={apt._id} className="p-6 rounded-3xl bg-calm-50 dark:bg-white/5 border border-calm-100 dark:border-white/10 group hover:border-lavender-500/20 transition-all">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-lavender-500/10 flex items-center justify-center text-lavender-500">
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-calm-800 dark:text-white">{user.full_name}</h4>
                                                        <p className="text-xs text-calm-400">{format(new Date(apt.preferredDate), 'MMMM do, yyyy')}</p>
                                                    </div>
                                                </div>
                                                <Settings className="w-4 h-4 text-calm-300 group-hover:text-lavender-500 cursor-pointer" />
                                            </div>
                                            <div className="p-4 rounded-2xl bg-white dark:bg-calm-950/50 border border-calm-100 dark:border-calm-800 text-sm text-calm-600 dark:text-calm-300 font-medium italic leading-relaxed">
                                                "{apt.sessionNotes || 'No notes recorded for this session.'}"
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TherapistDashboard;
