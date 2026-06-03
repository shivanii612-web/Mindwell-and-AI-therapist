import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Video,
  User,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useGetAppointmentsQuery, useCreateAppointmentMutation } from '@redux/api/apiSlice';
import { GlassCard, GradientButton, Badge } from '@components/ui/Layout';
import { format, addDays, isSameDay } from 'date-fns';
import toast from 'react-hot-toast';
import { cn } from '@utils/cn';

const timeSlots = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
];

// statusConfig removed

export const AppointmentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'book'>('upcoming');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [sessionType, setSessionType] = useState<'Video' | 'Audio' | 'Chat'>('Video');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: appointments = [], refetch } = useGetAppointmentsQuery();
  const [createAppointment] = useCreateAppointmentMutation();

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(new Date(), i)
  );

  const upcomingAppointments = appointments.filter(
    (apt) => apt.status === 'Pending Review' || apt.status === 'Pending Therapist Assignment'
  );
  const pastAppointments = appointments.filter(
    (apt) => apt.status === 'Completed' || apt.status === 'Cancelled'
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
      // Reset form
      setSelectedTime('');
      setReason('');
      setNotes('');
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Failed to submit session request';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-calm-800 dark:text-white">
            Appointments
          </h1>
          <p className="text-calm-500 dark:text-calm-400">
            Request and manage your therapy sessions
          </p>
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
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs',
                  activeTab === tab.id
                    ? 'bg-white/20'
                    : 'bg-lavender-100 dark:bg-lavender-900/30 text-lavender-600 dark:text-lavender-400'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'upcoming' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {upcomingAppointments.length === 0 ? (
            <GlassCard className="p-12 text-center" hover={false}>
              <Calendar className="w-16 h-16 text-calm-300 dark:text-calm-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-calm-800 dark:text-white mb-2">
                No appointment requests yet.
              </h3>
              <p className="text-calm-500 dark:text-calm-400 mb-6">
                Request a session with our wellness team
              </p>
              <GradientButton onClick={() => setActiveTab('book')}>
                Request a Session
              </GradientButton>
            </GlassCard>
          ) : (
            upcomingAppointments.map((apt, index) => (
              <motion.div
                key={apt.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="p-6">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lavender-500 to-accent-500 flex items-center justify-center shadow-glow">
                      {apt.sessionType === 'Video' ? <Video className="w-8 h-8 text-white" /> : <Clock className="w-8 h-8 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-calm-800 dark:text-white">
                          {apt.sessionType} Session
                        </h3>
                        <Badge
                          variant={apt.status === 'Pending Review' ? 'warning' : 'info'}
                          size="sm"
                        >
                          {apt.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-calm-600 dark:text-calm-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(apt.preferredDate), 'EEE, MMM d')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {apt.preferredTime}
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          <span className="truncate max-w-[200px]">{apt.reason}</span>
                        </div>
                      </div>
                    </div>
                    <div className="hidden md:block text-right text-xs text-calm-500">
                      <p>Requested on</p>
                      <p>{format(new Date(apt.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-calm-50/50 dark:bg-calm-800/30 rounded-lg">
                    <p className="text-xs text-calm-500 mb-1">Status Note:</p>
                    <p className="text-xs text-calm-600 dark:text-calm-400">
                      Therapist assignment and video link will be added by the wellness team.
                    </p>
                  </div>
                </GlassCard>
              </motion.div>
            ))
          )}
        </motion.div>
      )}

      {activeTab === 'past' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {pastAppointments.length === 0 ? (
            <GlassCard className="p-12 text-center" hover={false}>
              <Clock className="w-16 h-16 text-calm-300 dark:text-calm-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-calm-800 dark:text-white mb-2">
                No past appointments
              </h3>
              <p className="text-calm-500 dark:text-calm-400">
                Your completed sessions will appear here
              </p>
            </GlassCard>
          ) : (
            pastAppointments.map((apt, index) => (
              <motion.div
                key={apt.id}
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
                      <h3 className="text-lg font-semibold text-calm-800 dark:text-white">
                        {apt.sessionType} Session
                      </h3>
                      <p className="text-sm text-calm-500">
                        {format(new Date(apt.preferredDate), 'MMMM d, yyyy •')} {apt.preferredTime}
                      </p>
                    </div>
                    <Badge
                      variant={apt.status === 'Completed' ? 'success' : 'error'}
                      size="sm"
                    >
                      {apt.status}
                    </Badge>
                  </div>
                </GlassCard>
              </motion.div>
            ))
          )}
        </motion.div>
      )}

      {activeTab === 'book' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <GlassCard className="p-8" hover={false}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-lavender-500/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-lavender-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-calm-800 dark:text-white">
                  Request a Session
                </h2>
                <p className="text-calm-500">Our wellness team will match you with the best therapist</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Session Type */}
              <div>
                <label className="block text-sm font-medium text-calm-700 dark:text-calm-300 mb-2">
                  Session Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'Video', icon: Video },
                    { id: 'Audio', icon: Clock },
                    { id: 'Chat', icon: User },
                  ].map((type) => (
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
                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium text-calm-700 dark:text-calm-300 mb-2">
                    Preferred Date
                  </label>
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
                        <span className="text-[10px] font-medium uppercase">
                          {format(day, 'EEE')}
                        </span>
                        <span className="text-sm font-bold">
                          {format(day, 'd')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Selection */}
                <div>
                  <label className="block text-sm font-medium text-calm-700 dark:text-calm-300 mb-2">
                    Preferred Time
                  </label>
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

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-calm-700 dark:text-calm-300 mb-2">
                  Reason or concern
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Stress at work, Mindfulness guidance"
                  className="w-full px-4 py-3 rounded-xl bg-calm-100/50 dark:bg-calm-800/50 border border-calm-200 dark:border-calm-700 text-calm-800 dark:text-white placeholder:text-calm-400 focus:outline-none focus:ring-2 focus:ring-lavender-500/50"
                  required
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-calm-700 dark:text-calm-300 mb-2">
                  Additional Notes (Optional)
                </label>
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
