import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Video,
  User,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Loader,
} from 'lucide-react';
import { useGetAppointmentsQuery, useCreateAppointmentMutation } from '@redux/api/apiSlice';
import { GlassCard, GradientButton, Badge } from '@components/ui/Layout';
import { format, addDays, isSameDay } from 'date-fns';
import toast from 'react-hot-toast';
import { cn } from '@utils/cn';
import { connectConsultationSocket, disconnectConsultationSocket } from '@lib/consultationSocket';

const timeSlots = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
];

// ─── Helper: derive correct badge variant from appointment state ──────────────
const getStatusVariant = (apt: any): 'warning' | 'info' | 'success' | 'error' => {
  if (apt.status === 'Pending Review' || apt.status === 'Pending Therapist Assignment') return 'warning';
  if (apt.status === 'Rejected') return 'error';
  if (apt.status === 'Completed') return 'success';
  if (apt.status === 'Accepted') {
    if (apt.sessionStatus === 'live') return 'success';
    return 'info';
  }
  return 'info';
};

// ─── Helper: human-readable status message ───────────────────────────────────
const getStatusMessage = (apt: any): string => {
  if (apt.status === 'Pending Review' || apt.status === 'Pending Therapist Assignment') {
    return 'Waiting for therapist approval. We will notify you once a therapist accepts your request.';
  }
  if (apt.status === 'Rejected') {
    return 'Your request was rejected. Please contact support for more details.';
  }
  if (apt.status === 'Completed') {
    return 'Session completed. Thank you for using MindWell.';
  }
  if (apt.status === 'Cancelled') {
    return 'This appointment was cancelled.';
  }
  if (apt.status === 'Accepted') {
    if (apt.sessionStatus === 'live') return '🟢 Therapist has started the session. You can join now!';
    if (apt.sessionStatus === 'ended') return 'The session has ended.';
    return 'Appointment accepted. Waiting for therapist to start the session.';
  }
  return '';
};

export const AppointmentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'book'>('upcoming');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [sessionType, setSessionType] = useState<'Video' | 'Audio' | 'Chat'>('Video');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track live session updates received via Socket.io (appointmentId → sessionStatus)
  const [liveUpdates, setLiveUpdates] = useState<Record<string, string>>({});

  const navigate = useNavigate();
  const { data: appointments = [], refetch } = useGetAppointmentsQuery();
  const [createAppointment] = useCreateAppointmentMutation();

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  // ── Socket.io: listen for session_started / session_ended from therapist ──
  useEffect(() => {
    const socket = connectConsultationSocket();

    const onSessionStarted = ({ appointmentId }: { appointmentId: string }) => {
      setLiveUpdates(prev => ({ ...prev, [appointmentId]: 'live' }));
      toast.success('Therapist has started the session! You can join now.', {
        id: `session-live-${appointmentId}`,
        duration: 8000,
      });
    };

    const onSessionEnded = ({ appointmentId }: { appointmentId: string }) => {
      setLiveUpdates(prev => ({ ...prev, [appointmentId]: 'ended' }));
      toast('Session has ended.', { id: `session-ended-${appointmentId}` });
    };

    // When a therapist accepts the appointment, refresh to show their name
    const onAppointmentAccepted = ({ appointmentId, therapistName }: { appointmentId: string; therapistName: string }) => {
      toast.success(`Your appointment has been accepted by ${therapistName || 'a therapist'}!`, {
        id: `apt-accepted-${appointmentId}`,
        duration: 6000,
      });
      refetch(); // reload to get therapistId populated with name
    };

    socket.on('session_started', onSessionStarted);
    socket.on('session_ended', onSessionEnded);
    socket.on('appointment_accepted', onAppointmentAccepted);

    return () => {
      socket.off('session_started', onSessionStarted);
      socket.off('session_ended', onSessionEnded);
      socket.off('appointment_accepted', onAppointmentAccepted);
      disconnectConsultationSocket();
    };
  }, []);

  // Merge server data with live Socket updates
  const mergedAppointments = appointments.map((apt: any) => ({
    ...apt,
    sessionStatus: liveUpdates[apt._id] ?? apt.sessionStatus ?? 'pending_session',
  }));

  const upcomingAppointments = mergedAppointments.filter(
    (apt: any) => apt.status === 'Pending Review' ||
      apt.status === 'Pending Therapist Assignment' ||
      apt.status === 'Accepted'
  );
  const pastAppointments = mergedAppointments.filter(
    (apt: any) => apt.status === 'Completed' || apt.status === 'Cancelled'
  );

  const handleRequestSession = async () => {
    if (!selectedTime || !reason) {
      toast.error('Please fill in the preferred time and reason for the session');
      return;
    }
    setIsSubmitting(true);
    try {
      await createAppointment({
        sessionType,
        preferredDate: selectedDate.toISOString(),
        preferredTime: selectedTime,
        reason,
        notes,
      }).unwrap();
      toast.success('Your session request has been submitted. Our wellness team will contact you soon.');
      setActiveTab('upcoming');
      refetch();
      setSelectedTime('');
      setReason('');
      setNotes('');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to submit session request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-calm-800 dark:text-white">Appointments</h1>
          <p className="text-calm-500 dark:text-calm-400">Request and manage your therapy sessions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'upcoming', label: 'Requests', count: upcomingAppointments.length },
          { id: 'past', label: 'History', count: pastAppointments.length },
          { id: 'book', label: 'Request Session', count: null },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              'flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all',
              activeTab === tab.id
                ? 'bg-gradient-to-r from-lavender-500 to-accent-500 text-white shadow-glow'
                : 'bg-calm-100/50 dark:bg-calm-800/50 text-calm-600 dark:text-calm-400 hover:bg-calm-200 dark:hover:bg-calm-700'
            )}
          >
            {tab.label}
            {tab.count !== null && tab.count >= 0 && (
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs',
                activeTab === tab.id
                  ? 'bg-white/20'
                  : 'bg-lavender-100 dark:bg-lavender-900/30 text-lavender-600 dark:text-lavender-400'
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Upcoming */}
      {activeTab === 'upcoming' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {upcomingAppointments.length === 0 ? (
            <GlassCard className="p-12 text-center" hover={false}>
              <Calendar className="w-16 h-16 text-calm-300 dark:text-calm-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-calm-800 dark:text-white mb-2">No appointment requests yet.</h3>
              <p className="text-calm-500 dark:text-calm-400 mb-6">Request a session with our wellness team</p>
              <GradientButton onClick={() => setActiveTab('book')}>Request a Session</GradientButton>
            </GlassCard>
          ) : (
            upcomingAppointments.map((apt: any, index: number) => {
              const isLive = apt.sessionStatus === 'live';
              const isAccepted = apt.status === 'Accepted';
              const isPending = apt.status === 'Pending Review' || apt.status === 'Pending Therapist Assignment';

              return (
                <motion.div
                  key={apt.id || apt._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <GlassCard className={cn('p-6', isLive && 'ring-2 ring-emerald-500/40')}>
                    <div className="flex items-center gap-6">
                      <div className={cn(
                        'w-16 h-16 rounded-2xl flex items-center justify-center shadow-glow',
                        isLive
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                          : 'bg-gradient-to-br from-lavender-500 to-accent-500'
                      )}>
                        {apt.sessionType === 'Video' ? <Video className="w-8 h-8 text-white" /> : <Clock className="w-8 h-8 text-white" />}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-calm-800 dark:text-white">
                            {apt.sessionType} Session
                          </h3>
                          <Badge variant={getStatusVariant(apt)} size="sm">
                            {isLive ? 'Live Now' : apt.status}
                          </Badge>
                          {isLive && (
                            <span className="flex items-center gap-1 text-xs text-emerald-500 font-bold">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              Session Active
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-calm-600 dark:text-calm-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(apt.preferredDate), 'EEE, MMM d')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {apt.preferredTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            <span className="truncate max-w-[200px]">{apt.reason}</span>
                          </span>
                          {/* Show assigned therapist name once accepted */}
                          {isAccepted && apt.therapistId && (
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                              <User className="w-4 h-4" />
                              {typeof apt.therapistId === 'object'
                                ? (apt.therapistId as any).full_name || (apt.therapistId as any).email
                                : 'Therapist Assigned'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action area */}
                      <div className="flex flex-col gap-2 shrink-0 items-end">
                        {/* Join button ONLY when session is live */}
                        {isAccepted && isLive && (
                          <GradientButton
                            size="sm"
                            onClick={() => navigate(`/consultation?type=${apt.sessionType.toLowerCase()}&appointmentId=${apt._id || apt.id}`)}
                          >
                            <Video className="w-4 h-4 mr-1" /> Join Session
                          </GradientButton>
                        )}
                        {/* Waiting indicator when accepted but not yet started */}
                        {isAccepted && !isLive && apt.sessionStatus !== 'ended' && (
                          <div className="flex items-center gap-2 text-xs text-calm-400 font-medium">
                            <Loader className="w-3 h-3 animate-spin" />
                            Waiting for therapist…
                          </div>
                        )}
                        <div className="hidden md:block text-right text-xs text-calm-500">
                          <p>Requested on</p>
                          <p>{format(new Date(apt.createdAt), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Status message bar */}
                    <div className={cn(
                      'mt-4 p-3 rounded-lg',
                      isLive
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-calm-50/50 dark:bg-calm-800/30'
                    )}>
                      <p className={cn(
                        'text-xs font-semibold',
                        isLive ? 'text-emerald-700 dark:text-emerald-300' : 'text-calm-700 dark:text-calm-300'
                      )}>
                        {getStatusMessage(apt)}
                      </p>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })
          )}
        </motion.div>
      )}

      {/* Past */}
      {activeTab === 'past' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {pastAppointments.length === 0 ? (
            <GlassCard className="p-12 text-center" hover={false}>
              <Clock className="w-16 h-16 text-calm-300 dark:text-calm-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-calm-800 dark:text-white mb-2">No past appointments</h3>
              <p className="text-calm-500 dark:text-calm-400">Your completed sessions will appear here</p>
            </GlassCard>
          ) : (
            pastAppointments.map((apt: any, index: number) => (
              <motion.div
                key={apt.id || apt._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="p-6 opacity-75">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-xl bg-calm-100 dark:bg-calm-800 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-calm-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-calm-800 dark:text-white">{apt.sessionType} Session</h3>
                      <p className="text-sm text-calm-500">
                        {format(new Date(apt.preferredDate), 'MMMM d, yyyy •')} {apt.preferredTime}
                      </p>
                    </div>
                    <Badge variant={apt.status === 'Completed' ? 'success' : 'error'} size="sm">
                      {apt.status}
                    </Badge>
                  </div>
                </GlassCard>
              </motion.div>
            ))
          )}
        </motion.div>
      )}

      {/* Book */}
      {activeTab === 'book' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
          <GlassCard className="p-8" hover={false}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-lavender-500/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-lavender-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-calm-800 dark:text-white">Request a Session</h2>
                <p className="text-calm-500">Our wellness team will match you with the best therapist</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Session Type */}
              <div>
                <label className="block text-sm font-medium text-calm-700 dark:text-calm-300 mb-2">Session Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {[{ id: 'Video', icon: Video }, { id: 'Audio', icon: Clock }, { id: 'Chat', icon: User }].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSessionType(type.id as 'Video' | 'Audio' | 'Chat')}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all',
                        sessionType === type.id
                          ? 'border-lavender-500 bg-lavender-50 dark:bg-lavender-900/20 text-lavender-600'
                          : 'border-calm-100 dark:border-calm-800 hover:border-lavender-200'
                      )}
                    >
                      <type.icon className="w-6 h-6" />
                      <span className="text-sm font-medium">{type.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-calm-700 dark:text-calm-300 mb-2">Preferred Date</label>
                  <div className="grid grid-cols-7 gap-1">
                    {weekDays.map((day) => (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                          'flex flex-col items-center p-2 rounded-xl transition-all',
                          isSameDay(day, selectedDate)
                            ? 'bg-lavender-500 text-white shadow-glow'
                            : 'hover:bg-calm-100 dark:hover:bg-calm-800 text-calm-600 dark:text-calm-400'
                        )}
                      >
                        <span className="text-[10px] font-medium uppercase">{format(day, 'EEE')}</span>
                        <span className="text-sm font-bold">{format(day, 'd')}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-calm-700 dark:text-calm-300 mb-2">Preferred Time</label>
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={cn(
                          'p-2.5 rounded-xl text-sm font-medium border-2 transition-all',
                          selectedTime === time
                            ? 'border-lavender-500 bg-lavender-50 dark:bg-lavender-900/20 text-lavender-600'
                            : 'border-calm-100 dark:border-calm-800 hover:border-lavender-200 text-calm-600'
                        )}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-calm-700 dark:text-calm-300 mb-2">Reason or concern</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Stress at work, Mindfulness guidance"
                  className="w-full px-4 py-3 rounded-xl bg-calm-100/50 dark:bg-calm-800/50 border border-calm-200 dark:border-calm-700 text-calm-800 dark:text-white placeholder:text-calm-400 focus:outline-none focus:ring-2 focus:ring-lavender-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-calm-700 dark:text-calm-300 mb-2">Additional Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything else you'd like us to know..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-calm-100/50 dark:bg-calm-800/50 border border-calm-200 dark:border-calm-700 text-calm-800 dark:text-white placeholder:text-calm-400 focus:outline-none focus:ring-2 focus:ring-lavender-500/50 resize-none"
                />
              </div>

              <GradientButton
                className="w-full py-4 text-lg"
                onClick={handleRequestSession}
                disabled={isSubmitting || !selectedTime || !reason}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </GradientButton>

              <p className="text-center text-xs text-calm-500">
                Therapist assignment and video link will be added by the wellness team once review is complete.
              </p>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
};

export default AppointmentsPage;
