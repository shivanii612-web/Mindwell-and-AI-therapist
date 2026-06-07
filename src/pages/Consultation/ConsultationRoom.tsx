import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Video, Mic, MicOff, PhoneOff, MessageSquare,
    Send, Users, Clock, Shield, Layout, User, FileText, Loader,
    Volume2, Play, Square, Save, CheckCircle, AlertCircle, WifiOff
} from 'lucide-react';
import { GlassCard, GradientButton, Badge } from '@components/ui/Layout';
import { cn } from '@utils/cn';
import toast from 'react-hot-toast';
import { useAppSelector } from '@hooks/useRedux';
import { API_URL, joinUrl } from '@utils/apiUtils';
import { getConsultationSocket, connectConsultationSocket, disconnectConsultationSocket } from '@lib/consultationSocket';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
    id: string;
    sender: 'me' | 'other';
    senderName: string;
    text: string;
    time: string;
}

interface AppointmentInfo {
    _id: string;
    sessionType: string;
    status: string;
    userId?: { full_name: string; email: string };
    therapistId?: { full_name: string; email: string };
    preferredDate?: string;
    preferredTime?: string;
}

export const ConsultationRoom: React.FC = () => {
    const { profile, session } = useAppSelector((state) => state.auth);
    const token = session?.access_token;
    const isTherapist = profile?.role === 'therapist';

    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialType = queryParams.get('type')?.toLowerCase() as 'video' | 'audio' | 'chat';
    const appointmentId = queryParams.get('appointmentId');

    const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'chat'>(initialType || 'video');

    // Video state — Daily iframe replaces local camera preview
    const [videoActive, setVideoActive] = useState(false);
    const [videoDenied, setVideoDenied] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Audio state — Daily iframe (camera off) replaces local mic preview
    const [audioActive, setAudioActive] = useState(false);
    const [audioDenied, setAudioDenied] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const audioStreamRef = useRef<MediaStream | null>(null);

    // Daily.co room state — kept for future production use
    const [dailyRoomUrl, setDailyRoomUrl] = useState<string | null>(null);
    const [dailyLoading, setDailyLoading] = useState(false);
    const [dailyError, setDailyError] = useState<string | null>(null);
    const [dailyJoined, setDailyJoined] = useState(false); // true = Daily iframe visible

    // Local demo mode — used when Daily is unavailable (no billing, etc.)
    const [localJoined, setLocalJoined] = useState(false);   // true = local preview visible
    const [localMode, setLocalMode] = useState<'video' | 'audio'>('video');
    const [localLoading, setLocalLoading] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [localIsMuted, setLocalIsMuted] = useState(false);
    const [localCamOff, setLocalCamOff] = useState(false);

    // Chat state
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [chatConnected, setChatConnected] = useState(false);
    const [chatConnecting, setChatConnecting] = useState(false);
    // Granular chat status for proper UI feedback
    const [chatStatus, setChatStatus] = useState<
        'no_appointment' | 'connecting' | 'connected' | 'access_denied' | 'connection_failed'
    >(appointmentId ? 'connecting' : 'no_appointment');
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Appointment data
    const [appointment, setAppointment] = useState<AppointmentInfo | null>(null);
    const [loadingAppointment, setLoadingAppointment] = useState(!!appointmentId);

    // Session lifecycle: tracks whether therapist has started the live session.
    // Derived from appointment.sessionStatus; updated in real-time via Socket.io.
    const [sessionStatus, setSessionStatus] = useState<'pending_session' | 'live' | 'ended'>('pending_session');

    // Session Notes (therapist only)
    const [sessionNotes, setSessionNotes] = useState('');
    const [notesSaveStatus, setNotesSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Fetch real appointment data
    useEffect(() => {
        if (!appointmentId || !token) {
            setLoadingAppointment(false);
            return;
        }
        const fetchAppointment = async () => {
            try {
                const res = await fetch(joinUrl(API_URL, `/appointments/${appointmentId}`), {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setAppointment(data);
                    // Normalise sessionStatus — old records may have undefined; treat as not_started
                    const ss = data.sessionStatus;
                    if (ss === 'live' || ss === 'ended') {
                        setSessionStatus(ss);
                    } else {
                        setSessionStatus('pending_session');
                    }
                    if (data.sessionType) {
                        setActiveTab(data.sessionType.toLowerCase() as 'video' | 'audio' | 'chat');
                    }
                } else {
                    toast.error('Could not load appointment details');
                }
            } catch {
                toast.error('Failed to connect to consultation');
            } finally {
                setLoadingAppointment(false);
            }
        };
        fetchAppointment();
    }, [appointmentId, token]);

    // Load session notes on mount (therapist only)
    useEffect(() => {
        if (!appointmentId || !token || !isTherapist) return;
        const fetchNotes = async () => {
            try {
                const res = await fetch(joinUrl(API_URL, `/appointments/${appointmentId}/notes`), {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setSessionNotes(data.sessionNotes || '');
                }
                // silently ignore 403/404 — notes may not exist yet
            } catch {
                // network error — don't throw, notes just stay empty
            }
        };
        fetchNotes();
    }, [appointmentId, token, isTherapist]);

    // Save session notes
    const handleSaveNotes = useCallback(async () => {
        if (!appointmentId || !token) return;
        setNotesSaveStatus('saving');
        try {
            const res = await fetch(joinUrl(API_URL, `/appointments/${appointmentId}/notes`), {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sessionNotes }),
            });
            if (res.ok) {
                setNotesSaveStatus('saved');
                setTimeout(() => setNotesSaveStatus('idle'), 3000);
            } else {
                setNotesSaveStatus('error');
                setTimeout(() => setNotesSaveStatus('idle'), 4000);
            }
        } catch {
            setNotesSaveStatus('error');
            setTimeout(() => setNotesSaveStatus('idle'), 4000);
        }
    }, [appointmentId, token, sessionNotes]);

    // Scroll chat to bottom
    useEffect(() => {
        if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Cleanup streams AND socket AND Daily room on unmount
    useEffect(() => {
        return () => {
            stopVideo();
            stopAudio();
            leaveDailyRoom();
            disconnectConsultationSocket();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Socket.io consultation chat ──────────────────────────────────────────
    // Connects when appointmentId and token are available, joins the room,
    // loads history, and wires up real-time message events.
    // Cleans up all listeners on unmount or when appointmentId changes.
    useEffect(() => {
        // No appointmentId — show the "select an appointment" state immediately
        if (!appointmentId) {
            setChatStatus('no_appointment');
            setChatConnected(false);
            setChatConnecting(false);
            return;
        }

        if (!token) return;

        // connectConsultationSocket always creates a fresh instance with the
        // current stored token, preventing stale-auth rejections.
        const socket = connectConsultationSocket();
        setChatStatus('connecting');
        setChatConnecting(true);
        setChatConnected(false);

        // Helper: derive logged-in user ID from profile (supports both id and _id)
        const userId = (profile?.id || profile?._id || '').toString();

        const toDisplayMsg = (raw: any): Message => {
            const rawSenderId =
                raw.senderId?._id?.toString() ||
                raw.senderId?.toString() ||
                '';
            const isMine = userId !== '' && rawSenderId === userId;
            return {
                id: raw._id?.toString() || String(Date.now() + Math.random()),
                sender: isMine ? 'me' : 'other',
                senderName: raw.senderId?.full_name || (isMine ? 'You' : 'Other'),
                text: raw.message,
                time: new Date(raw.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                }),
            };
        };

        // ── Event handlers ─────────────────────────────────────────────
        const onConnect = () => {
            console.log('MindWell Socket: connected, joining room', appointmentId);
            setChatStatus('connecting'); // still connecting until room is joined
            setChatConnecting(true);
            socket.emit('join_consultation_room', { appointmentId });
        };

        const onDisconnect = (reason: string) => {
            console.log('MindWell Socket: disconnected:', reason);
            setChatConnected(false);
            if (reason !== 'io client disconnect') {
                setChatStatus('connecting');
                setChatConnecting(true);
            }
        };

        const onConnectError = (err: Error) => {
            console.error('MindWell Socket: connect error:', err.message);
            setChatConnected(false);
            setChatConnecting(false);
            setChatStatus('connection_failed');
        };

        const onReconnect = () => {
            console.log('MindWell Socket: reconnected, re-joining room');
            setChatStatus('connecting');
            setChatConnecting(true);
            socket.emit('join_consultation_room', { appointmentId });
        };

        const onHistory = ({ messages: history }: { appointmentId: string; messages: any[] }) => {
            // Room joined successfully — we are now connected
            setChatConnected(true);
            setChatConnecting(false);
            setChatStatus('connected');
            if (Array.isArray(history)) {
                setMessages(history.map(toDisplayMsg));
            }
        };

        const onMessage = (raw: any) => {
            setMessages(prev => {
                if (prev.some(m => m.id === raw._id?.toString())) return prev;
                return [...prev, toDisplayMsg(raw)];
            });
        };

        const onError = ({ message: errMsg }: { message: string }) => {
            console.error('MindWell Socket: consultation_error:', errMsg);
            const isAccessDenied =
                errMsg.toLowerCase().includes('access') ||
                errMsg.toLowerCase().includes('denied') ||
                errMsg.toLowerCase().includes('not a participant');

            if (isAccessDenied) {
                setChatStatus('access_denied');
                setChatConnected(false);
                setChatConnecting(false);
                // Show toast only once
                toast.error('Access denied for this consultation.', { id: 'consult-access-denied' });
            }
            // Non-access errors (e.g. invalid ID) don't change connection status
        };

        // Register all handlers before connecting
        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('connect_error', onConnectError);
        socket.io.on('reconnect', onReconnect);
        socket.on('consultation_history', onHistory);
        socket.on('receive_consultation_message', onMessage);
        socket.on('consultation_error', onError);

        // socket.connect() was already called in connectConsultationSocket()
        // If for some reason it's already connected (unlikely with fresh instance),
        // join the room directly.
        if (socket.connected) {
            socket.emit('join_consultation_room', { appointmentId });
        }

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('connect_error', onConnectError);
            socket.io.off('reconnect', onReconnect);
            socket.off('consultation_history', onHistory);
            socket.off('receive_consultation_message', onMessage);
            socket.off('consultation_error', onError);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appointmentId, token]);

    // ── Session lifecycle events ─────────────────────────────────────────────
    // Listen for therapist starting/ending the session in real time.
    // The socket is already connected (from the chat effect above) so we just
    // add/remove listeners here without reconnecting.
    useEffect(() => {
        if (!appointmentId || !token) return;

        const socket = getConsultationSocket();

        const onSessionStarted = ({ appointmentId: aid }: { appointmentId: string }) => {
            if (aid === appointmentId) {
                setSessionStatus('live');
                if (!isTherapist) {
                    toast.success('Therapist has started the session. You can now join!', {
                        id: 'session-live',
                        duration: 8000,
                    });
                }
            }
        };

        const onSessionEnded = ({ appointmentId: aid }: { appointmentId: string }) => {
            if (aid === appointmentId) {
                setSessionStatus('ended');
                leaveCall();
                toast('The session has ended.', { id: 'session-ended' });
            }
        };

        socket.on('session_started', onSessionStarted);
        socket.on('session_ended', onSessionEnded);

        return () => {
            socket.off('session_started', onSessionStarted);
            socket.off('session_ended', onSessionEnded);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appointmentId, token, isTherapist]);

    // === CALL CONTROLS ===

    /**
     * DAILY_ENABLED — read once at module level from the Vite env flag.
     * Set VITE_ENABLE_DAILY=false in .env to skip Daily entirely and use
     * local demo mode. Set to true only when Daily billing is configured.
     */
    const DAILY_ENABLED = import.meta.env.VITE_ENABLE_DAILY === 'true';

    /**
     * joinCall — primary entry point for both Video and Audio tabs.
     *
     * When VITE_ENABLE_DAILY=false (default for local dev):
     *   → Goes straight to local getUserMedia demo mode. Daily is never called.
     *
     * When VITE_ENABLE_DAILY=true (production with billing):
     *   → Tries Daily.co first; falls back to local demo on any failure.
     *
     * Camera/mic are NEVER requested until user explicitly clicks Join.
     */
    const joinCall = async (mode: 'video' | 'audio') => {
        if (!appointmentId || !token) return;
        setLocalMode(mode);
        setDailyError(null);
        setPermissionDenied(false);

        // ── Daily disabled via env flag → go straight to local demo ─────
        if (!DAILY_ENABLED) {
            await startLocalDemo(mode);
            return;
        }

        // ── Daily enabled → try Daily.co first ───────────────────────────
        setDailyLoading(true);
        try {
            const res = await fetch(joinUrl(API_URL, `/consultations/${appointmentId}/daily-room`), {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            const data = await res.json();

            if (res.ok && data.roomUrl) {
                setDailyRoomUrl(data.roomUrl);
                setDailyJoined(true);
                setDailyLoading(false);
                return;
            }
            console.warn('MindWell: Daily.co unavailable, falling back to local demo:', data?.error);
        } catch (err) {
            console.warn('MindWell: Daily.co request failed, falling back to local demo:', err);
        }

        // ── Daily failed → fall back to local demo ────────────────────────
        setDailyLoading(false);
        await startLocalDemo(mode);
    };

    /**
     * startLocalDemo — requests camera/mic via getUserMedia and shows local preview.
     * If permissions are denied, shows demo cards (no crash).
     */
    const startLocalDemo = async (mode: 'video' | 'audio') => {
        setLocalLoading(true);
        setPermissionDenied(false);
        try {
            const constraints = mode === 'video'
                ? { video: true, audio: true }
                : { video: false, audio: true };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            // Attach video tracks to the video element
            if (videoRef.current && mode === 'video') {
                videoRef.current.srcObject = stream;
            }
            setVideoActive(mode === 'video');
            setAudioActive(true);
            setLocalJoined(true);
        } catch {
            // Permission denied or hardware unavailable — show demo cards, don't crash
            setPermissionDenied(true);
            setLocalJoined(true); // still enter local mode, just show demo cards
        } finally {
            setLocalLoading(false);
        }
    };

    const leaveCall = () => {
        // Tear down Daily iframe if active
        setDailyJoined(false);
        setDailyRoomUrl(null);
        setDailyError(null);
        // Tear down local streams if active
        stopVideo();
        stopAudio();
        setLocalJoined(false);
        setPermissionDenied(false);
        setLocalIsMuted(false);
        setLocalCamOff(false);
    };

    const leaveDailyRoom = leaveCall; // alias — keeps existing cleanup calls working

    const stopVideo = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) videoRef.current.srcObject = null;
        setVideoActive(false);
    };

    const stopAudio = () => {
        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(t => t.stop());
            audioStreamRef.current = null;
        }
        setAudioActive(false);
        setIsMuted(false);
    };

    const toggleLocalMute = () => {
        if (streamRef.current) {
            streamRef.current.getAudioTracks().forEach(t => { t.enabled = localIsMuted; });
        }
        setLocalIsMuted(m => !m);
    };

    const toggleLocalCam = () => {
        if (streamRef.current) {
            streamRef.current.getVideoTracks().forEach(t => { t.enabled = localCamOff; });
        }
        setLocalCamOff(c => !c);
    };

    // === CHAT — socket-based send ===
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        const text = newMessage.trim();
        if (!text || !appointmentId) return;

        const socket = getConsultationSocket();
        if (!socket.connected) {
            toast.error('Chat disconnected — reconnecting…', { id: 'chat-reconnect' });
            connectConsultationSocket();
            return;
        }
        socket.emit('send_consultation_message', { appointmentId, message: text });
        setNewMessage('');
    };

    // Derived names
    const patientName = appointment?.userId?.full_name || appointment?.userId?.email || 'Patient';
    const therapistName = appointment?.therapistId?.full_name || appointment?.therapistId?.email || 'Therapist';
    const otherPartyName = isTherapist ? patientName : therapistName;
    const sessionLabel = appointment ? `${appointment.sessionType} Session` : 'Consultation Session';

    // Stop local streams and leave call when switching away from video/audio tabs
    useEffect(() => {
        if (activeTab !== 'video' && activeTab !== 'audio') {
            leaveCall();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    if (loadingAppointment) {
        return (
            <div className="h-[calc(100vh-10rem)] flex items-center justify-center">
                <GlassCard className="p-12 text-center" hover={false}>
                    <Loader className="w-10 h-10 text-lavender-500 mx-auto mb-4 animate-spin" />
                    <p className="text-calm-600 dark:text-calm-400">Loading consultation details...</p>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-10rem)] flex flex-col gap-4">
            {/* ─── Top Bar ─── */}
            <GlassCard className="p-4" hover={false}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(isTherapist ? '/therapist' : '/appointments')}
                            className="p-2 rounded-xl hover:bg-calm-100 dark:hover:bg-calm-800 transition-colors"
                        >
                            <Layout className="w-5 h-5 text-calm-500" />
                        </button>
                        <div className="w-12 h-12 rounded-2xl bg-lavender-500 flex items-center justify-center shadow-glow">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-calm-800 dark:text-white">
                                {isTherapist ? `Patient: ${patientName}` : `Session with ${therapistName}`}
                            </h2>
                            <div className="flex items-center gap-2 text-xs text-calm-500">
                                <Badge variant="success" size="sm">Live</Badge>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {sessionLabel}</span>
                                <span className="flex items-center gap-1 font-medium text-emerald-500"><Shield className="w-3 h-3" /> Encrypted</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            stopVideo();
                            stopAudio();
                            toast.success(isTherapist ? 'Consultation session ended' : 'You have left the session');
                            navigate(isTherapist ? '/therapist' : '/appointments');
                        }}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/25"
                    >
                        <PhoneOff className="w-5 h-5" /> {isTherapist ? 'End Session' : 'Leave Session'}
                    </button>
                </div>
            </GlassCard>

            {/* ─── Main Content ─── */}
            <div className="flex-1 flex gap-4 min-h-0">
                <div className="flex-1 flex flex-col gap-4">
                    {/* Tab Switcher */}
                    <div className="flex gap-1 p-1 bg-calm-100/50 dark:bg-calm-800/50 rounded-2xl w-fit">
                        {([
                            { id: 'video', label: 'Video', icon: Video },
                            { id: 'audio', label: 'Audio', icon: Volume2 },
                            { id: 'chat', label: 'Chat', icon: MessageSquare },
                        ] as const).map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                                    activeTab === tab.id
                                        ? "bg-white dark:bg-calm-700 text-lavender-600 shadow-sm"
                                        : "text-calm-500 hover:text-calm-700 dark:hover:text-calm-300"
                                )}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* ─── Tab Content ─── */}
                    <GlassCard className="flex-1 overflow-hidden flex flex-col min-h-0" hover={false}>
                        <AnimatePresence mode="wait">

                            {/* ════════ VIDEO TAB ════════ */}
                            {activeTab === 'video' && (
                                <motion.div key="video" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col">

                                    {/* ── User waiting gate: session not live yet ── */}
                                    {!isTherapist && sessionStatus !== 'live' && (
                                        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 bg-gradient-to-br from-calm-50 to-lavender-50 dark:from-calm-900 dark:to-calm-950">
                                            <div className="flex gap-8">
                                                <div className="w-56 h-40 rounded-2xl bg-white/60 dark:bg-calm-800/60 border border-calm-200 dark:border-calm-700 flex flex-col items-center justify-center shadow-lg">
                                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-lavender-400 to-accent-500 flex items-center justify-center mb-3">
                                                        <User className="w-8 h-8 text-white" />
                                                    </div>
                                                    <p className="text-sm font-bold text-calm-700 dark:text-calm-200">{therapistName}</p>
                                                    <p className="text-[10px] text-calm-400 uppercase tracking-widest mt-0.5">Therapist</p>
                                                </div>
                                                <div className="w-56 h-40 rounded-2xl bg-white/60 dark:bg-calm-800/60 border border-calm-200 dark:border-calm-700 flex flex-col items-center justify-center shadow-lg">
                                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-cyan-500 flex items-center justify-center mb-3">
                                                        <User className="w-8 h-8 text-white" />
                                                    </div>
                                                    <p className="text-sm font-bold text-calm-700 dark:text-calm-200">{patientName}</p>
                                                    <p className="text-[10px] text-calm-400 uppercase tracking-widest mt-0.5">You</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-calm-500 dark:text-calm-400 text-sm">
                                                <Loader className="w-4 h-4 animate-spin" />
                                                Waiting for therapist to start the session…
                                            </div>
                                            <p className="text-xs text-calm-400 text-center max-w-sm">
                                                You will be able to join as soon as your therapist starts the session.
                                            </p>
                                        </div>
                                    )}

                                    {/* ── Pre-join screen (therapist always, user when live) ── */}
                                    {(isTherapist || sessionStatus === 'live') && !dailyJoined && !localJoined && (
                                        <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8 bg-gradient-to-br from-calm-50 to-lavender-50 dark:from-calm-900 dark:to-calm-950">
                                            {/* Participant cards */}
                                            <div className="flex flex-wrap justify-center gap-8">
                                                <div className="w-56 h-44 rounded-2xl bg-white/80 dark:bg-calm-800/80 border border-calm-200 dark:border-calm-700 flex flex-col items-center justify-center shadow-xl gap-3">
                                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-lavender-400 to-accent-500 flex items-center justify-center shadow-lg">
                                                        <User className="w-10 h-10 text-white" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-sm font-bold text-calm-700 dark:text-calm-200">{therapistName}</p>
                                                        <p className="text-[10px] text-calm-400 uppercase tracking-widest">Therapist</p>
                                                    </div>
                                                </div>
                                                <div className="w-56 h-44 rounded-2xl bg-white/80 dark:bg-calm-800/80 border border-calm-200 dark:border-calm-700 flex flex-col items-center justify-center shadow-xl gap-3">
                                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-cyan-500 flex items-center justify-center shadow-lg">
                                                        <User className="w-10 h-10 text-white" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-sm font-bold text-calm-700 dark:text-calm-200">{patientName}</p>
                                                        <p className="text-[10px] text-calm-400 uppercase tracking-widest">Patient</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="text-calm-500 dark:text-calm-400 text-sm text-center">
                                                Camera and mic activate only after you click Join Video Call.
                                            </p>

                                            <GradientButton
                                                onClick={() => joinCall('video')}
                                                disabled={dailyLoading || localLoading}
                                                className="px-10 py-3 text-base"
                                            >
                                                {dailyLoading || localLoading
                                                    ? <><Loader className="w-5 h-5 mr-2 animate-spin" /> Starting…</>
                                                    : <><Play className="w-5 h-5 mr-2" /> Join Video Call</>
                                                }
                                            </GradientButton>
                                        </div>
                                    )}

                                    {/* ── Daily.co iframe (production) ── */}
                                    {dailyJoined && dailyRoomUrl && (
                                        <div className="flex-1 flex flex-col">
                                            <iframe
                                                src={`${dailyRoomUrl}?showLeaveButton=0&showFullscreenButton=1`}
                                                allow="camera; microphone; fullscreen; display-capture; autoplay"
                                                className="flex-1 w-full border-0"
                                                title="Video Consultation"
                                            />
                                            <div className="flex-none flex justify-center py-3 bg-calm-950/90 backdrop-blur">
                                                <button onClick={leaveCall} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-all shadow-lg">
                                                    <PhoneOff className="w-4 h-4" /> Leave Call
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── Local demo mode (VITE_ENABLE_DAILY=false fallback) ── */}
                                    {localJoined && !dailyJoined && (
                                        <div className="flex-1 relative bg-calm-950 overflow-hidden">
                                            {/* Demo mode label */}
                                            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-amber-500/90 backdrop-blur text-white text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                                                Local Demo Consultation Mode
                                            </div>

                                            {/* Remote party — fills entire background */}
                                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-calm-900 to-calm-950">
                                                <div className="text-center">
                                                    <div className="w-28 h-28 rounded-full bg-lavender-500/20 border-4 border-lavender-500/40 flex items-center justify-center mx-auto mb-4 animate-pulse shadow-2xl shadow-lavender-500/20">
                                                        <User className="w-14 h-14 text-lavender-400" />
                                                    </div>
                                                    <p className="text-white font-semibold text-lg">{otherPartyName}</p>
                                                    <p className="text-calm-400 text-sm mt-1">
                                                        {permissionDenied ? 'Camera / mic unavailable — demo cards' : 'Connected'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Self-view: camera preview or avatar */}
                                            <div className="absolute top-14 right-4 w-48 aspect-video rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-10 bg-calm-900 flex items-center justify-center">
                                                {permissionDenied || localCamOff ? (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <User className="w-10 h-10 text-calm-500" />
                                                        <span className="text-[9px] text-calm-500 font-bold uppercase tracking-wider">
                                                            {permissionDenied ? 'No Camera' : 'Cam Off'}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <video
                                                        ref={videoRef}
                                                        autoPlay
                                                        playsInline
                                                        muted
                                                        className="w-full h-full object-cover"
                                                        style={{ transform: 'scaleX(-1)' }}
                                                    />
                                                )}
                                                <div className="absolute bottom-1.5 left-2 px-2 py-0.5 bg-black/60 backdrop-blur rounded-lg text-[9px] text-white font-bold uppercase tracking-wider">
                                                    You
                                                </div>
                                            </div>

                                            {/* Controls bar */}
                                            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 px-5 py-3 bg-black/50 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                                                {!permissionDenied && (
                                                    <>
                                                        <button
                                                            onClick={toggleLocalMute}
                                                            title={localIsMuted ? 'Unmute' : 'Mute'}
                                                            className={cn(
                                                                'flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all',
                                                                localIsMuted
                                                                    ? 'bg-red-500/90 text-white hover:bg-red-600'
                                                                    : 'bg-white/10 text-white hover:bg-white/20'
                                                            )}
                                                        >
                                                            {localIsMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                                            <span className="hidden sm:inline">{localIsMuted ? 'Unmute' : 'Mute'}</span>
                                                        </button>
                                                        <button
                                                            onClick={toggleLocalCam}
                                                            title={localCamOff ? 'Camera On' : 'Camera Off'}
                                                            className={cn(
                                                                'flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all',
                                                                localCamOff
                                                                    ? 'bg-red-500/90 text-white hover:bg-red-600'
                                                                    : 'bg-white/10 text-white hover:bg-white/20'
                                                            )}
                                                        >
                                                            <Video className="w-4 h-4" />
                                                            <span className="hidden sm:inline">{localCamOff ? 'Cam On' : 'Cam Off'}</span>
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={leaveCall}
                                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-all shadow-lg"
                                                >
                                                    <PhoneOff className="w-4 h-4" /> Leave
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* ════════ AUDIO TAB ════════ */}
                            {activeTab === 'audio' && (
                                <motion.div key="audio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col">

                                    {/* ── User waiting gate ── */}
                                    {!isTherapist && sessionStatus !== 'live' && (
                                        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 bg-gradient-to-br from-lavender-50/50 to-accent-50/50 dark:from-calm-900 dark:to-calm-950">
                                            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-lavender-500/20 to-accent-500/20 flex items-center justify-center border-4 border-lavender-200 dark:border-lavender-800">
                                                <Volume2 className="w-12 h-12 text-lavender-500" />
                                            </div>
                                            <div className="text-center">
                                                <h3 className="text-xl font-bold text-calm-800 dark:text-white mb-2">Audio Session with {otherPartyName}</h3>
                                                <div className="flex items-center gap-2 justify-center text-calm-500 text-sm">
                                                    <Loader className="w-4 h-4 animate-spin" />
                                                    Waiting for therapist to start the session…
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── Pre-join screen ── */}
                                    {(isTherapist || sessionStatus === 'live') && !dailyJoined && !localJoined && (
                                        <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8 bg-gradient-to-br from-lavender-50/50 to-accent-50/50 dark:from-calm-900 dark:to-calm-950">
                                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-lavender-500/20 to-accent-500/20 flex items-center justify-center border-4 border-lavender-200 dark:border-lavender-800 shadow-xl">
                                                <Volume2 className="w-16 h-16 text-lavender-500" />
                                            </div>
                                            <div className="text-center">
                                                <h3 className="text-xl font-bold text-calm-800 dark:text-white mb-2">Audio Session with {otherPartyName}</h3>
                                                <p className="text-calm-500 text-sm">Microphone activates after you join. Camera stays off.</p>
                                            </div>
                                            <GradientButton
                                                onClick={() => joinCall('audio')}
                                                disabled={dailyLoading || localLoading}
                                                className="px-10 py-3 text-base"
                                            >
                                                {dailyLoading || localLoading
                                                    ? <><Loader className="w-5 h-5 mr-2 animate-spin" /> Starting…</>
                                                    : <><Mic className="w-5 h-5 mr-2" /> Join Audio Call</>
                                                }
                                            </GradientButton>
                                        </div>
                                    )}

                                    {/* ── Daily.co iframe audio (production) ── */}
                                    {dailyJoined && dailyRoomUrl && (
                                        <div className="flex-1 flex flex-col">
                                            <iframe
                                                src={`${dailyRoomUrl}?showLeaveButton=0&showFullscreenButton=0&startVideoOff=1`}
                                                allow="microphone; autoplay"
                                                className="flex-1 w-full border-0"
                                                title="Audio Consultation"
                                            />
                                            <div className="flex-none flex justify-center py-3 bg-calm-950/90 backdrop-blur">
                                                <button onClick={leaveCall} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-all shadow-lg">
                                                    <PhoneOff className="w-4 h-4" /> Leave Call
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── Local demo mode audio ── */}
                                    {localJoined && !dailyJoined && (
                                        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 bg-gradient-to-br from-lavender-50/50 to-accent-50/50 dark:from-calm-900 dark:to-calm-950">
                                            {/* Demo label */}
                                            <div className="px-3 py-1 rounded-full bg-amber-500/90 text-white text-[10px] font-bold uppercase tracking-wider">
                                                Local Demo Consultation Mode
                                            </div>

                                            {/* Indicator circle */}
                                            <div className={cn(
                                                'w-32 h-32 rounded-full flex items-center justify-center border-4 relative',
                                                permissionDenied
                                                    ? 'bg-calm-200/20 border-calm-400 dark:border-calm-700'
                                                    : 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-emerald-400 dark:border-emerald-600'
                                            )}>
                                                <Volume2 className={cn('w-14 h-14', permissionDenied ? 'text-calm-400' : 'text-emerald-500')} />
                                                {!permissionDenied && !localIsMuted && (
                                                    <div className="absolute inset-0 rounded-full border-2 border-emerald-400/40 animate-ping" />
                                                )}
                                            </div>

                                            <div className="text-center">
                                                <h3 className="text-xl font-bold text-calm-800 dark:text-white mb-1">
                                                    {permissionDenied ? 'Microphone Unavailable' : 'Audio Session Active'}
                                                </h3>
                                                <p className="text-calm-500 text-sm">
                                                    {permissionDenied
                                                        ? 'Permission denied — showing demo layout'
                                                        : `Connected with ${otherPartyName}`}
                                                </p>
                                            </div>

                                            {/* Sound bars */}
                                            {!permissionDenied && (
                                                <div className="flex items-end gap-1 h-10">
                                                    {[20, 35, 55, 25, 70, 45, 80, 35, 50, 20].map((h, i) => (
                                                        <motion.div
                                                            key={i}
                                                            animate={localIsMuted ? { height: 4 } : { height: [h * 0.4, h * 0.8, h * 0.4] }}
                                                            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.08 }}
                                                            className="w-1.5 bg-emerald-500/60 rounded-full"
                                                        />
                                                    ))}
                                                </div>
                                            )}

                                            {/* Controls */}
                                            <div className="flex items-center gap-3">
                                                {!permissionDenied && (
                                                    <button
                                                        onClick={toggleLocalMute}
                                                        className={cn(
                                                            'flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all',
                                                            localIsMuted
                                                                ? 'bg-red-500 text-white hover:bg-red-600'
                                                                : 'bg-calm-200 dark:bg-calm-700 text-calm-700 dark:text-calm-200 hover:bg-calm-300 dark:hover:bg-calm-600'
                                                        )}
                                                    >
                                                        {localIsMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                                        {localIsMuted ? 'Unmute' : 'Mute'}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={leaveCall}
                                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-all shadow-lg"
                                                >
                                                    <PhoneOff className="w-4 h-4" /> Leave Call
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* ════════ CHAT TAB ════════ */}
                            {activeTab === 'chat' && (
                                <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col">

                                    {/* ── Status: No appointment selected ── */}
                                    {chatStatus === 'no_appointment' && (
                                        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
                                            <MessageSquare className="w-14 h-14 text-calm-300 opacity-40" />
                                            <p className="font-semibold text-calm-600 dark:text-calm-300">No consultation selected.</p>
                                            <p className="text-xs text-calm-400 max-w-xs">
                                                Please go to your Appointments page and click "Join Session" on an accepted appointment.
                                            </p>
                                        </div>
                                    )}

                                    {/* ── Status: Connecting ── */}
                                    {chatStatus === 'connecting' && (
                                        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
                                            <Loader className="w-8 h-8 text-lavender-500 animate-spin" />
                                            <p className="text-sm font-medium text-calm-500 dark:text-calm-400">Connecting to consultation room…</p>
                                        </div>
                                    )}

                                    {/* ── Status: Access denied ── */}
                                    {chatStatus === 'access_denied' && (
                                        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
                                            <AlertCircle className="w-14 h-14 text-red-400 opacity-70" />
                                            <p className="font-semibold text-calm-700 dark:text-calm-200">Access denied for this consultation.</p>
                                            <p className="text-xs text-calm-400 max-w-xs">
                                                You are not a participant in this appointment. Please use your own accepted appointment.
                                            </p>
                                        </div>
                                    )}

                                    {/* ── Status: Connection failed ── */}
                                    {chatStatus === 'connection_failed' && (
                                        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
                                            <WifiOff className="w-14 h-14 text-amber-400 opacity-70" />
                                            <p className="font-semibold text-calm-700 dark:text-calm-200">Could not connect to chat server.</p>
                                            <p className="text-xs text-calm-400 max-w-xs mb-2">Please check your connection and try again.</p>
                                            <button
                                                onClick={() => {
                                                    setChatStatus('connecting');
                                                    connectConsultationSocket();
                                                }}
                                                className="px-4 py-2 rounded-xl bg-lavender-500 text-white text-xs font-bold hover:bg-lavender-600 transition-colors"
                                            >
                                                Retry
                                            </button>
                                        </div>
                                    )}

                                    {/* ── Status: Connected — show messages ── */}
                                    {chatStatus === 'connected' && (
                                        <>
                                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                                {messages.length === 0 && (
                                                    <div className="text-center text-calm-400 text-sm mt-12">
                                                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                                        <p className="font-medium">Chat with {otherPartyName}</p>
                                                        <p className="text-xs mt-1 opacity-70">Messages are saved and will reload when you return.</p>
                                                    </div>
                                                )}
                                                {messages.map((msg) => (
                                                    <div
                                                        key={msg.id}
                                                        className={cn(
                                                            'flex flex-col max-w-[75%] space-y-1',
                                                            msg.sender === 'me' ? 'ml-auto items-end' : 'items-start'
                                                        )}
                                                    >
                                                        {msg.sender === 'other' && (
                                                            <span className="text-[10px] font-bold text-calm-400 px-1 uppercase tracking-tight">
                                                                {msg.senderName}
                                                            </span>
                                                        )}
                                                        <div
                                                            className={cn(
                                                                'px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed',
                                                                msg.sender === 'me'
                                                                    ? 'bg-gradient-to-br from-lavender-500 to-accent-500 text-white rounded-br-md shadow-md'
                                                                    : 'bg-calm-100 dark:bg-calm-800 text-calm-700 dark:text-calm-200 rounded-bl-md border border-calm-200 dark:border-calm-700'
                                                            )}
                                                        >
                                                            {msg.text}
                                                        </div>
                                                        <span className="text-[10px] text-calm-400 font-bold px-1 uppercase tracking-tight">
                                                            {msg.time}
                                                        </span>
                                                    </div>
                                                ))}
                                                <div ref={chatEndRef} />
                                            </div>

                                            <form
                                                onSubmit={handleSendMessage}
                                                className="p-4 border-t border-calm-200 dark:border-calm-700 flex items-center gap-3"
                                            >
                                                <input
                                                    type="text"
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                    placeholder={`Message ${otherPartyName}…`}
                                                    className="flex-1 px-4 py-3 rounded-xl bg-calm-100/50 dark:bg-calm-800/50 border border-calm-200 dark:border-calm-700 text-calm-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-lavender-500/50 text-sm"
                                                />
                                                <GradientButton
                                                    type="submit"
                                                    className="px-5 py-3"
                                                    disabled={!newMessage.trim()}
                                                >
                                                    <Send className="w-4 h-4" />
                                                </GradientButton>
                                            </form>
                                        </>
                                    )}
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </GlassCard>
                </div>

                {/* ─── Side Panel (Therapist only) ─── */}
                {isTherapist && (
                    <div className="w-80 flex flex-col gap-4">
                        {/* Patient Info */}
                        <GlassCard className="p-5" hover={false}>
                            {appointment && (
                                <div className="mb-4 p-3 rounded-xl bg-lavender-50 dark:bg-lavender-900/20 border border-lavender-100 dark:border-lavender-800">
                                    <p className="text-xs font-bold text-lavender-600 dark:text-lavender-400 uppercase tracking-wider mb-1">Patient</p>
                                    <p className="text-sm font-semibold text-calm-800 dark:text-white">{patientName}</p>
                                    <p className="text-xs text-calm-500">{appointment.userId?.email}</p>
                                </div>
                            )}
                            <h3 className="text-base font-bold text-calm-800 dark:text-white mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-lavender-500" /> Session Checklist
                            </h3>
                            <div className="space-y-2">
                                {[
                                    "Mental State Assessment",
                                    "Review Journal Entries",
                                    "Mood Trend Analysis",
                                    "Homework Discussion",
                                    "Set Next Session Goal"
                                ].map((item, i) => (
                                    <label key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-calm-50/50 dark:bg-calm-800/30 cursor-pointer hover:bg-calm-100 dark:hover:bg-calm-800 transition-colors">
                                        <input type="checkbox" className="w-4 h-4 rounded border-2 border-calm-300 text-lavender-500 focus:ring-lavender-500/50" />
                                        <span className="text-sm text-calm-600 dark:text-calm-300">{item}</span>
                                    </label>
                                ))}
                            </div>
                        </GlassCard>

                        {/* Session Notes */}
                        <GlassCard className="flex-1 p-5 flex flex-col" hover={false}>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-base font-bold text-calm-800 dark:text-white flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-lavender-500" /> Session Notes
                                </h3>
                                {/* Save status indicator */}
                                {notesSaveStatus === 'saving' && (
                                    <span className="flex items-center gap-1.5 text-xs font-semibold text-calm-500">
                                        <Loader className="w-3.5 h-3.5 animate-spin" /> Saving...
                                    </span>
                                )}
                                {notesSaveStatus === 'saved' && (
                                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
                                        <CheckCircle className="w-3.5 h-3.5" /> Notes saved
                                    </span>
                                )}
                                {notesSaveStatus === 'error' && (
                                    <span className="flex items-center gap-1.5 text-xs font-semibold text-red-500">
                                        <AlertCircle className="w-3.5 h-3.5" /> Failed to save
                                    </span>
                                )}
                            </div>
                            <textarea
                                className="flex-1 w-full bg-calm-50/30 dark:bg-calm-800/30 border border-calm-200 dark:border-calm-700 rounded-xl p-3 resize-none text-sm text-calm-600 dark:text-calm-400 focus:outline-none focus:ring-2 focus:ring-lavender-500/30 placeholder:text-calm-400"
                                placeholder="Jot down important observations..."
                                value={sessionNotes}
                                onChange={(e) => setSessionNotes(e.target.value)}
                            />
                            <button
                                onClick={handleSaveNotes}
                                disabled={notesSaveStatus === 'saving'}
                                className={cn(
                                    "mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold text-sm transition-all",
                                    notesSaveStatus === 'saving'
                                        ? "bg-calm-200 dark:bg-calm-700 text-calm-400 cursor-not-allowed"
                                        : "bg-gradient-to-r from-lavender-500 to-accent-500 text-white hover:opacity-90 shadow-md"
                                )}
                            >
                                <Save className="w-4 h-4" />
                                {notesSaveStatus === 'saving' ? 'Saving...' : 'Save Notes'}
                            </button>
                        </GlassCard>

                    </div>
                )}
            </div>
        </div>
    );
};

export default ConsultationRoom;
