import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Sparkles,
  MessageCircle,
  TrendingUp,
  BookOpen,
  Heart,
  Calendar,
  Clock,
  ChevronRight,
  Smile,
  Compass,
  ListTodo,
} from 'lucide-react';
import { useGetMoodsQuery, useGetAppointmentsQuery, useGetJournalsQuery } from '@redux/api/apiSlice';
import { GlassCard, GradientButton, Badge } from '@components/ui/Layout';
import { connectConsultationSocket, disconnectConsultationSocket } from '@lib/consultationSocket';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { safeFormatDate } from '@utils/dateUtils';
import { isToday } from 'date-fns';

const moods_config = [
  { label: 'Happy', icon: '😊', color: 'bg-green-400', textColor: 'text-green-600' },
  { label: 'Calm', icon: '😌', color: 'bg-blue-400', textColor: 'text-blue-600' },
  { label: 'Anxious', icon: '😰', color: 'bg-orange-400', textColor: 'text-orange-600' },
  { label: 'Sad', icon: '😢', color: 'bg-red-400', textColor: 'text-red-600' },
  { label: 'Tired', icon: '😴', color: 'bg-indigo-400', textColor: 'text-indigo-600' },
  { label: 'Burned Out', icon: '😫', color: 'bg-purple-400', textColor: 'text-purple-600' },
];

export const DashboardPage: React.FC = () => {
  const { data: moodsRaw = [] } = useGetMoodsQuery({ limit: 100 });
  const { data: appointmentsRaw = [], refetch } = useGetAppointmentsQuery();
  const { data: journalsRaw = [] } = useGetJournalsQuery({ limit: 50 });

  const [liveUpdates, setLiveUpdates] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    const socket = connectConsultationSocket();

    const onSessionStarted = ({ appointmentId }: { appointmentId: string }) => {
      setLiveUpdates(prev => ({ ...prev, [appointmentId]: 'live' }));
    };

    const onSessionEnded = ({ appointmentId }: { appointmentId: string }) => {
      setLiveUpdates(prev => ({ ...prev, [appointmentId]: 'ended' }));
    };

    const onAppointmentAccepted = ({ appointmentId }: { appointmentId: string }) => {
      refetch();
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
  }, [refetch]);

  const moods = React.useMemo(() => {
    return (moodsRaw || []).filter((m: any) => {
      if (!m || !m.logged_at) return false;
      const d = new Date(m.logged_at);
      if (isNaN(d.getTime())) return false;
      const score = Number(m.mood_score);
      return !isNaN(score) && score >= 0 && score <= 10;
    });
  }, [moodsRaw]);

  const journals = React.useMemo(() => {
    return (journalsRaw || []).filter((j: any) => {
      if (!j || !j.created_at) return false;
      const d = new Date(j.created_at);
      return !isNaN(d.getTime());
    });
  }, [journalsRaw]);

  const appointments = React.useMemo(() => {
    return (appointmentsRaw || []).filter((a: any) => {
      if (!a || !a.preferredDate) return false;
      const d = new Date(a.preferredDate);
      return !isNaN(d.getTime());
    }).map((apt: any) => {
      const idKey = apt._id || apt.id;
      return {
        ...apt,
        sessionStatus: (idKey && liveUpdates[idKey]) ?? apt.sessionStatus ?? 'pending_session',
      };
    });
  }, [appointmentsRaw, liveUpdates]);

  const isNewUser = React.useMemo(() => {
    return moods.length === 0 && journals.length === 0 && appointments.length === 0;
  }, [moods, journals, appointments]);

  // Helper: Find mood config info
  const getMoodIcon = (moodValue: string) => {
    return moods_config.find(m => m.label.toLowerCase() === moodValue.toLowerCase())?.icon || '😌';
  };

  const getMoodTextColor = (moodValue: string) => {
    return moods_config.find(m => m.label.toLowerCase() === moodValue.toLowerCase())?.textColor || 'text-lavender-600';
  };

  // --- SECTION 1: Mental Wellness Score Calculations ---
  const wellnessScore = React.useMemo(() => {
    if (moods.length === 0) return 72; // Default starting score
    const avgMoodScore = moods.reduce((sum, m) => sum + m.mood_score, 0) / moods.length;
    const moodContribution = avgMoodScore * 8.5; // Up to 85 points
    const journalPoints = Math.min(10, journals.length * 2.5); // Up to 10 points
    const appointmentPoints = Math.min(5, appointments.length * 2.5); // Up to 5 points
    return Math.min(100, Math.max(25, Math.round(moodContribution + journalPoints + appointmentPoints)));
  }, [moods, journals, appointments]);

  const wellnessStatus = React.useMemo(() => {
    if (wellnessScore >= 85) return 'Excellent';
    if (wellnessScore >= 70) return 'Improving';
    if (wellnessScore >= 55) return 'Stable';
    return 'Needs Attention';
  }, [wellnessScore]);

  // --- SECTION 2: Today's Mood ---
  const moodLoggedToday = React.useMemo(() => {
    return moods.find(m => isToday(new Date(m.logged_at)));
  }, [moods]);

  // --- SECTION 3: AI Mental Health Analysis ---
  const aiInsights = React.useMemo(() => {
    const insights = [];
    if (moods.length >= 4) {
      const recentAvg = moods.slice(0, 2).reduce((sum, m) => sum + m.mood_score, 0) / 2;
      const olderAvg = moods.slice(2, 4).reduce((sum, m) => sum + m.mood_score, 0) / 2;
      if (recentAvg > olderAvg) {
        insights.push("Your mood has improved compared to last week.");
      } else if (recentAvg === olderAvg) {
        insights.push("You have been feeling calm and stable more frequently.");
      } else {
        insights.push("Your mood shows minor fluctuations. Take extra time to rest.");
      }
    } else {
      insights.push("Welcome! Log your mood daily to help compile deeper trends.");
    }

    const moodCounts: any = {};
    moods.forEach(m => {
      moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
    });
    const sortedMoods = Object.entries(moodCounts).sort((a: any, b: any) => b[1] - a[1]);
    if (sortedMoods.length > 0) {
      insights.push(`You have been feeling ${sortedMoods[0][0].replace('_', ' ')} more frequently.`);
    }

    if (moods.length > 0 && moods.every(m => m.mood_score >= 6)) {
      insights.push("Stress levels have reduced and stabilized.");
    }

    if (journals.length === 0) {
      insights.push("Your journal activity has decreased. Writing can help release mental load.");
    } else {
      insights.push("Your consistent journal entries are assisting in self-reflection.");
    }

    const upcoming = appointments.some(a => new Date(a.preferredDate) >= new Date());
    if (!upcoming) {
      insights.push("You haven't booked any professional check-ins recently. Consider scheduling a session.");
    }

    return insights.slice(0, 3);
  }, [moods, journals, appointments]);

  // --- SECTION 4: Weekly Mood Trend Line Chart ---
  const last7DaysLogs = React.useMemo(() => {
    return moods.slice(0, 7).map(m => ({
      day: safeFormatDate(m.logged_at, 'EEE'),
      score: m.mood_score,
      rawDate: new Date(m.logged_at)
    })).reverse();
  }, [moods]);

  const avgMoodScore = React.useMemo(() => {
    if (last7DaysLogs.length === 0) return '0.0';
    return (last7DaysLogs.reduce((sum, item) => sum + item.score, 0) / last7DaysLogs.length).toFixed(1);
  }, [last7DaysLogs]);

  const highestMoodDay = React.useMemo(() => {
    if (last7DaysLogs.length === 0) return 'None';
    const highest = last7DaysLogs.reduce((max, item) => item.score > max.score ? item : max, last7DaysLogs[0]);
    return highest.day;
  }, [last7DaysLogs]);

  const lowestMoodDay = React.useMemo(() => {
    if (last7DaysLogs.length === 0) return 'None';
    const lowest = last7DaysLogs.reduce((min, item) => item.score < min.score ? item : min, last7DaysLogs[0]);
    return lowest.day;
  }, [last7DaysLogs]);

  const moodStability = React.useMemo(() => {
    if (last7DaysLogs.length < 2) return 'Stable';
    const mean = last7DaysLogs.reduce((sum, item) => sum + item.score, 0) / last7DaysLogs.length;
    const variance = last7DaysLogs.reduce((sum, item) => sum + Math.pow(item.score - mean, 2), 0) / last7DaysLogs.length;
    if (variance < 1.2) return 'High';
    if (variance < 3.2) return 'Moderate';
    return 'Fluctuating';
  }, [last7DaysLogs]);

  // --- SECTION 5: Mood Distribution ---
  const moodDistributionMap = React.useMemo(() => {
    const counts: any = { Happy: 0, Calm: 0, Anxious: 0, Sad: 0, Tired: 0, 'Burned Out': 0 };
    let total = 0;
    moods.forEach(m => {
      const match = moods_config.find(mc => mc.label.toLowerCase() === m.mood.toLowerCase());
      if (match) {
        counts[match.label]++;
        total++;
      }
    });
    const percentages: any = {};
    Object.keys(counts).forEach(key => {
      percentages[key] = total > 0 ? Math.round((counts[key] / total) * 100) : 0;
    });
    return percentages;
  }, [moods]);

  // --- SECTION 6: Journal Insights ---
  const latestJournal = journals[0];

  // --- SECTION 7: Upcoming Appointment ---
  const nextAppointment = React.useMemo(() => {
    return appointments.find(a => 
      a.status === 'Pending Review' || 
      a.status === 'Pending Therapist Assignment' || 
      a.status === 'Accepted'
    );
  }, [appointments]);

  // --- SECTION 8: AI Chat Summary ---
  const aiChatSummary = "Exploring daily stress management and mindful breathing techniques to calm overall overthinking.";

  // --- SECTION 9: Wellness Progress ---
  const moodConsistency = Math.min(100, Math.round((moods.length / 10) * 100));
  const journalConsistency = Math.min(100, Math.round((journals.length / 5) * 100));
  const aiConversationsProgress = moods.length > 0 ? 75 : 0;
  const sessionsConsistency = appointments.length > 0 ? 100 : 0;
  const overallProgress = Math.round((moodConsistency + journalConsistency + aiConversationsProgress + sessionsConsistency) / 4);

  // --- SECTION 11: Recent Activity Timeline ---
  const recentActivities = React.useMemo(() => {
    const acts: any[] = [];
    moods.slice(0, 2).forEach(m => {
      acts.push({
        type: 'Mood Logged',
        description: `Feeling ${m.mood.replace('_', ' ')} (${m.mood_score}/10)`,
        date: new Date(m.logged_at)
      });
    });
    journals.slice(0, 2).forEach(j => {
      acts.push({
        type: 'Journal Written',
        description: `"${j.title}"`,
        date: new Date(j.created_at)
      });
    });
    appointments.slice(0, 2).forEach(a => {
      const therapistName = typeof (a as any).therapistId === 'object' ? (a as any).therapistId?.full_name || 'Therapist' : 'Therapist';
      acts.push({
        type: 'Session Booked',
        description: `With ${therapistName}`,
        date: new Date(a.preferredDate)
      });
    });
    return acts.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 4);
  }, [moods, journals, appointments]);

  // --- SECTION 12: Personalized Recommendations ---
  const recommendations = React.useMemo(() => {
    const list = [];
    if (!moodLoggedToday) {
      list.push({ text: "Log today's mood to continue tracking your daily patterns.", path: '/mood' });
    }
    if (journals.length === 0) {
      list.push({ text: "Write a journal entry to clear your head and document thoughts.", path: '/journal/new' });
    }
    list.push({ text: "Discuss stress management with your AI Therapist.", path: '/chat' });
    if (appointments.length === 0) {
      list.push({ text: "Schedule a therapy session to speak with a licensed guide.", path: '/appointments' });
    }
    return list.slice(0, 3);
  }, [moodLoggedToday, journals, appointments]);

  if (isNewUser) {
    return (
      <div className="w-full bg-[#F8F5FA] dark:bg-[#1D1A27] px-4 md:px-8 pt-6 pb-12 space-y-12 transition-colors duration-300">
        {/* Welcome Section */}
        <div className="text-center py-10 max-w-2xl mx-auto space-y-4">
          <h1 className="text-4xl font-extrabold text-[#241C33] dark:text-[#FAF8FD] tracking-tight">
            Welcome to MindWell <span className="inline-block animate-pulse">🌿</span>
          </h1>
          <p className="text-lg font-bold text-[#8B6FCB] dark:text-[#B497E8]">
            Your wellness journey starts today.
          </p>
          <p className="text-sm text-[#5F5770] dark:text-[#D5CCE8] font-medium leading-relaxed font-sans">
            Track your mood, write your thoughts, build healthy habits, and watch your progress grow over time.
          </p>
        </div>

        {/* Empty Dashboard Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Mood Tracker */}
          <GlassCard className="p-6 text-center flex flex-col justify-between h-[280px] bg-white/90 dark:bg-calm-950/40 border-lavender-500/20 dark:border-white/5 shadow-xl hover:scale-102 transition-all duration-300" hover={false}>
            <div className="space-y-4">
              <div className="text-4xl drop-shadow-sm">😊</div>
              <h3 className="text-lg font-extrabold text-[#241C33] dark:text-[#FAF8FD]">Mood Tracker</h3>
              <p className="text-sm text-[#5F5770] dark:text-[#D5CCE8] font-medium">
                "No mood has been recorded yet."
              </p>
            </div>
            <Link to="/mood" className="block mt-6">
              <GradientButton className="w-full text-xs font-bold py-3">
                Record Today's Mood
              </GradientButton>
            </Link>
          </GlassCard>

          {/* Journal */}
          <GlassCard className="p-6 text-center flex flex-col justify-between h-[280px] bg-white/90 dark:bg-calm-950/40 border-lavender-500/20 dark:border-white/5 shadow-xl hover:scale-102 transition-all duration-300" hover={false}>
            <div className="space-y-4">
              <div className="text-4xl drop-shadow-sm">📖</div>
              <h3 className="text-lg font-extrabold text-[#241C33] dark:text-[#FAF8FD]">Journal</h3>
              <p className="text-sm text-[#5F5770] dark:text-[#D5CCE8] font-medium">
                "Write your first journal entry."
              </p>
            </div>
            <Link to="/journal/new" className="block mt-6">
              <GradientButton className="w-full text-xs font-bold py-3">
                Write First Entry
              </GradientButton>
            </Link>
          </GlassCard>

          {/* Wellness Activities */}
          <GlassCard className="p-6 text-center flex flex-col justify-between h-[280px] bg-white/90 dark:bg-calm-950/40 border-lavender-500/20 dark:border-white/5 shadow-xl hover:scale-102 transition-all duration-300" hover={false}>
            <div className="space-y-4">
              <div className="text-4xl drop-shadow-sm">🌱</div>
              <h3 className="text-lg font-extrabold text-[#241C33] dark:text-[#FAF8FD]">Wellness Activities</h3>
              <p className="text-sm text-[#5F5770] dark:text-[#D5CCE8] font-medium">
                "Complete your first activity."
              </p>
            </div>
            <Link to="/community" className="block mt-6">
              <GradientButton className="w-full text-xs font-bold py-3">
                Start Activity
              </GradientButton>
            </Link>
          </GlassCard>

          {/* Meditation */}
          <GlassCard className="p-6 text-center flex flex-col justify-between h-[280px] bg-white/90 dark:bg-calm-950/40 border-lavender-500/20 dark:border-white/5 shadow-xl hover:scale-102 transition-all duration-300" hover={false}>
            <div className="space-y-4">
              <div className="text-4xl drop-shadow-sm">🧘</div>
              <h3 className="text-lg font-extrabold text-[#241C33] dark:text-[#FAF8FD]">Meditation</h3>
              <p className="text-sm text-[#5F5770] dark:text-[#D5CCE8] font-medium">
                "Start your first meditation."
              </p>
            </div>
            <Link to="/mood" className="block mt-6">
              <GradientButton className="w-full text-xs font-bold py-3">
                Meditate Now
              </GradientButton>
            </Link>
          </GlassCard>

          {/* AI Companion */}
          <GlassCard className="p-6 text-center flex flex-col justify-between h-[280px] bg-white/90 dark:bg-calm-950/40 border-lavender-500/20 dark:border-white/5 shadow-xl hover:scale-102 transition-all duration-300" hover={false}>
            <div className="space-y-4">
              <div className="text-4xl drop-shadow-sm">💬</div>
              <h3 className="text-lg font-extrabold text-[#241C33] dark:text-[#FAF8FD]">AI Companion</h3>
              <p className="text-sm text-[#5F5770] dark:text-[#D5CCE8] font-medium">
                "Have your first conversation."
              </p>
            </div>
            <Link to="/chat" className="block mt-6">
              <GradientButton className="w-full text-xs font-bold py-3">
                Start Chatting
              </GradientButton>
            </Link>
          </GlassCard>

          {/* Therapist */}
          <GlassCard className="p-6 text-center flex flex-col justify-between h-[280px] bg-white/90 dark:bg-calm-950/40 border-lavender-500/20 dark:border-white/5 shadow-xl hover:scale-102 transition-all duration-300" hover={false}>
            <div className="space-y-4">
              <div className="text-4xl drop-shadow-sm">👩‍⚕️</div>
              <h3 className="text-lg font-extrabold text-[#241C33] dark:text-[#FAF8FD]">Therapist</h3>
              <p className="text-sm text-[#5F5770] dark:text-[#D5CCE8] font-medium">
                "Book your first appointment."
              </p>
            </div>
            <Link to="/appointments" className="block mt-6">
              <GradientButton className="w-full text-xs font-bold py-3">
                Book Appointment
              </GradientButton>
            </Link>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#F8F5FA] dark:bg-[#1D1A27] px-4 md:px-8 pt-0 pb-8 space-y-8 transition-colors duration-300">
      {/* Top Header Grid Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#241C33] dark:text-[#FAF8FD] tracking-tight">
            Mental Health Portal
          </h1>
          <p className="text-sm text-[#5F5770] dark:text-[#D5CCE8] font-medium mt-1">
            Empowering your self-care and mental health journey.
          </p>
        </div>
        <Badge variant="primary" size="lg" className="bg-[#EADDF8] dark:bg-[#4A3E69] text-[#6F52B5] dark:text-[#FAF8FD] border-none font-bold">
          <Activity className="w-4 h-4 mr-2" />
          Active Check-in State
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Score, Mood Log, Insights, Weekly Trend Chart, Quick Actions, Timeline (Col-span 8) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* SECTION 1 & SECTION 2 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* SECTION 1: Mental Wellness Score */}
            <GlassCard className="p-6 flex flex-col justify-between" hover={false}>
              <div>
                <h3 className="text-xs font-bold text-[#8D84A3] dark:text-[#A89FBC] uppercase tracking-wider mb-4">
                  Mental Wellness Score
                </h3>
                <div className="flex items-center gap-6">
                  {/* Circular Progress Indicator */}
                  <div className="relative flex items-center justify-center shrink-0">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="rgba(139,111,203,0.1)"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="#8B6FCB"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (wellnessScore / 100) * 251.2}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute text-2xl font-black text-[#241C33] dark:text-[#FAF8FD]">
                      {wellnessScore}%
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#8D84A3] dark:text-[#A89FBC] uppercase tracking-widest">
                      Calculated Status
                    </p>
                    <h4 className="text-xl font-bold text-[#8B6FCB] dark:text-[#B497E8] mt-0.5">
                      {wellnessStatus}
                    </h4>
                    <p className="text-xs text-[#5F5770] dark:text-[#D5CCE8] leading-relaxed mt-1 font-medium">
                      Based on mood journals, professional therapy, and assistant conversations.
                    </p>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* SECTION 2: Today's Mood */}
            <GlassCard className="p-6 flex flex-col justify-between" hover={false}>
              <div>
                <h3 className="text-xs font-bold text-[#8D84A3] dark:text-[#A89FBC] uppercase tracking-wider mb-4">
                  Today's Mood Check-in
                </h3>
                {moodLoggedToday ? (
                  <div className="flex items-center gap-4">
                    <div className="text-5xl drop-shadow-md">
                      {getMoodIcon(moodLoggedToday.mood)}
                    </div>
                    <div>
                      <h4 className={`text-lg font-black capitalize ${getMoodTextColor(moodLoggedToday.mood)}`}>
                        {moodLoggedToday.mood.replace('_', ' ')}
                      </h4>
                      <p className="text-sm font-bold text-[#5F5770] dark:text-[#D5CCE8] mt-0.5">
                        Score: {moodLoggedToday.mood_score}/10
                      </p>
                      <p className="text-[10px] text-[#8D84A3] dark:text-[#A89FBC] font-medium mt-1 flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        Logged today at {safeFormatDate(moodLoggedToday.logged_at, 'h:mm a')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#F2EBFA] dark:bg-[#332C48] flex items-center justify-center text-2xl">
                        😌
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#241C33] dark:text-[#FAF8FD]">
                          No mood logged today.
                        </p>
                        <p className="text-xs text-[#5F5770] dark:text-[#D5CCE8]">
                          Take a moment to record your emotional check-in.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6">
                <Link to="/mood" className="block">
                  <GradientButton className="w-full text-sm font-bold">
                    Log Today's Mood
                  </GradientButton>
                </Link>
              </div>
            </GlassCard>

          </div>

          {/* SECTION 3: AI Mental Health Analysis */}
          <GlassCard className="p-6" hover={false}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#8B6FCB] dark:text-[#B497E8]" />
              <h3 className="text-sm font-bold text-[#241C33] dark:text-[#FAF8FD] uppercase tracking-wider">
                AI Mental Health Analysis
              </h3>
            </div>
            {moods.length < 3 ? (
              <div className="p-6 rounded-2xl bg-[#F4EDF8] dark:bg-[#332D45] border border-[#E7DDF3] dark:border-[#40385A] text-center shadow-sm">
                <p className="text-xs text-[#5F5770] dark:text-[#D5CCE8] font-bold">
                  Insights will appear after enough wellness data has been collected.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {aiInsights.map((insight, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-[#F4EDF8] dark:bg-[#332D45] border border-[#E7DDF3] dark:border-[#40385A] flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#8B6FCB] dark:bg-[#B497E8] mt-1.5 shrink-0" />
                    <p className="text-xs text-[#5F5770] dark:text-[#D5CCE8] font-bold leading-relaxed">
                      {insight}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* SECTION 4: Weekly Mood Trend Line Chart */}
          <GlassCard className="p-6" hover={false}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xs font-bold text-[#8D84A3] dark:text-[#A89FBC] uppercase tracking-wider">
                  Weekly Mood Trend
                </h3>
                <p className="text-[10px] text-[#5F5770] dark:text-[#D5CCE8] font-medium mt-0.5">
                  Visualizing emotional fluctuations across entries
                </p>
              </div>
              <TrendingUp className="w-5 h-5 text-[#8B6FCB] dark:text-[#B497E8]" />
            </div>

            {last7DaysLogs.length > 1 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height={224}>
                  <AreaChart data={last7DaysLogs}>
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#8D84A3' }}
                    />
                    <YAxis
                      domain={[0, 10]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#8D84A3' }}
                      width={20}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-[#292437] border border-[#E7DDF3] dark:border-[#40385A] p-2.5 rounded-xl shadow-lg">
                              <p className="text-[9px] font-bold text-[#8D84A3] uppercase tracking-wider">
                                {payload[0].payload.day}
                              </p>
                              <p className="text-sm font-black text-[#241C33] dark:text-[#FAF8FD] mt-0.5">
                                Score: {payload[0].value}/10
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#8B6FCB"
                      strokeWidth={3}
                      fill="url(#moodDiaryGrad)"
                      connectNulls={true}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center border border-dashed border-[#DDD2ED] dark:border-[#4A4363] rounded-2xl p-4 text-center">
                <Smile className="w-8 h-8 text-[#8B6FCB] dark:text-[#B497E8] mb-2 opacity-50" />
                <p className="text-xs text-[#5F5770] dark:text-[#D5CCE8] font-bold">
                  Insights will appear after enough wellness data has been collected.
                </p>
              </div>
            )}

            {/* Chart statistics labels */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#E9E2F2] dark:border-[#40385A] text-center">
              <div>
                <p className="text-[10px] text-[#8D84A3] dark:text-[#A89FBC] font-bold uppercase tracking-wider">
                  Average Score
                </p>
                <p className="text-base font-black text-[#241C33] dark:text-[#FAF8FD] mt-0.5">
                  {avgMoodScore}/10
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[#8D84A3] dark:text-[#A89FBC] font-bold uppercase tracking-wider">
                  Highest Day
                </p>
                <p className="text-base font-black text-[#241C33] dark:text-[#FAF8FD] mt-0.5">
                  {highestMoodDay}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[#8D84A3] dark:text-[#A89FBC] font-bold uppercase tracking-wider">
                  Lowest Day
                </p>
                <p className="text-base font-black text-[#241C33] dark:text-[#FAF8FD] mt-0.5">
                  {lowestMoodDay}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[#8D84A3] dark:text-[#A89FBC] font-bold uppercase tracking-wider">
                  Stability
                </p>
                <p className="text-base font-black text-[#8B6FCB] dark:text-[#B497E8] mt-0.5">
                  {moodStability}
                </p>
              </div>
            </div>
          </GlassCard>

          {/* SECTION 10: Quick Actions */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#8D84A3] dark:text-[#A89FBC] uppercase tracking-wider">
              Quick Navigation Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'AI Therapist', path: '/chat', icon: MessageCircle },
                { label: 'Mood Tracker', path: '/mood', icon: Heart },
                { label: 'Journal', path: '/journal', icon: BookOpen },
                { label: 'Appointments', path: '/appointments', icon: Calendar },
                { label: 'Community', path: '/community', icon: Compass },
              ].map((act, idx) => (
                <Link key={idx} to={act.path} className="group">
                  <GlassCard className="p-4 text-center flex flex-col items-center justify-center h-full hover:bg-[#F2EBFA] dark:hover:bg-[#332D45]" hover>
                    <div className="w-10 h-10 rounded-full bg-[#F2EBFA] dark:bg-[#332C48] flex items-center justify-center text-[#8B6FCB] dark:text-[#B497E8] mb-3 shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <act.icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-extrabold text-[#5F5770] dark:text-[#D5CCE8] group-hover:text-[#6F52B5] transition-colors duration-300">
                      {act.label}
                    </span>
                  </GlassCard>
                </Link>
              ))}
            </div>
          </div>

          {/* SECTION 11: Recent Activity Timeline */}
          <GlassCard className="p-6" hover={false}>
            <div className="flex items-center gap-2 mb-6">
              <ListTodo className="w-5 h-5 text-[#8B6FCB] dark:text-[#B497E8]" />
              <h3 className="text-xs font-bold text-[#241C33] dark:text-[#FAF8FD] uppercase tracking-wider">
                Recent Activity Timeline
              </h3>
            </div>
            <div className="relative border-l-2 border-[#E9E2F2] dark:border-[#40385A] ml-3 pl-6 space-y-6">
              {recentActivities.map((act, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-[#8B6FCB] border-2 border-white dark:border-[#1D1A27]" />
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#8D84A3] dark:text-[#A89FBC] tracking-wider">
                      {act.type}
                    </span>
                    <p className="text-sm font-bold text-[#241C33] dark:text-[#FAF8FD] mt-0.5">
                      {act.description}
                    </p>
                    <p className="text-[9px] text-[#8D84A3] font-medium mt-1">
                      {safeFormatDate(act.date, 'EEEE, MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

        </div>

        {/* Right Side: Mood Dist, Journal Insights, Appointments, AI Summary, Wellness Progress, Recommendations (Col-span 4) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* SECTION 5: Mood Distribution */}
          <GlassCard className="p-6" hover={false}>
            <h3 className="text-xs font-bold text-[#8D84A3] dark:text-[#A89FBC] uppercase tracking-wider mb-6">
              Mood Distribution
            </h3>
            <div className="space-y-4">
              {Object.entries(moodDistributionMap).map(([moodName, percent]: any) => (
                <div key={moodName} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-[#5F5770] dark:text-[#D5CCE8]">{moodName}</span>
                    <span className="text-[#8B6FCB] dark:text-[#B497E8]">{percent}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#F4EDF8] dark:bg-[#332D45] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#8B6FCB] to-[#A98DD9] rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* SECTION 6: Journal Insights */}
          <GlassCard className="p-6 flex flex-col justify-between" hover={false}>
            <div>
              <h3 className="text-xs font-bold text-[#8D84A3] dark:text-[#A89FBC] uppercase tracking-wider mb-4">
                Journal Insights
              </h3>
              {latestJournal ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-[#F4EDF8] dark:bg-[#332D45] border border-[#E7DDF3] dark:border-[#40385A]">
                    <p className="text-[10px] font-black uppercase text-[#8D84A3] tracking-widest">
                      Latest Entry
                    </p>
                    <p className="text-sm font-bold text-[#241C33] dark:text-[#FAF8FD] mt-1 line-clamp-1">
                      {latestJournal.title}
                    </p>
                    <p className="text-xs text-[#5F5770] dark:text-[#D5CCE8] mt-1 font-medium line-clamp-2">
                      {latestJournal.content}
                    </p>
                  </div>
                  <div className="flex gap-4 text-xs font-bold pt-1">
                    <div>
                      <p className="text-[10px] text-[#8D84A3] uppercase">Total Logs</p>
                      <p className="text-sm font-black text-[#241C33] dark:text-[#FAF8FD] mt-0.5">{journals.length}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#8D84A3] uppercase">Logged Date</p>
                      <p className="text-sm font-black text-[#241C33] dark:text-[#FAF8FD] mt-0.5">
                        {safeFormatDate(latestJournal.created_at, 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <BookOpen className="w-8 h-8 text-[#8D84A3] mx-auto opacity-40 mb-2" />
                  <p className="text-xs text-[#5F5770] dark:text-[#D5CCE8] font-bold">
                    No journal entries yet.
                  </p>
                </div>
              )}
            </div>
            <div className="mt-6">
              <Link to="/journal/new" className="block">
                <GradientButton className="w-full text-sm font-bold">
                  Write Journal
                </GradientButton>
              </Link>
            </div>
          </GlassCard>

          {/* SECTION 7: Upcoming Appointment */}
          <GlassCard className="p-6 flex flex-col justify-between" hover={false}>
            <div>
              <h3 className="text-xs font-bold text-[#8D84A3] dark:text-[#A89FBC] uppercase tracking-wider mb-4">
                Upcoming Appointment
              </h3>
              {nextAppointment ? (
                (() => {
                  const isAccepted = nextAppointment.status === 'Accepted';
                  const isPending = nextAppointment.status === 'Pending Review' || nextAppointment.status === 'Pending Therapist Assignment';
                  const therapistName = isAccepted && typeof nextAppointment.therapistId === 'object' && nextAppointment.therapistId
                    ? (nextAppointment.therapistId as any).full_name || (nextAppointment.therapistId as any).email
                    : 'Waiting for therapist acceptance';
                  return (
                    <div className="p-4 rounded-xl bg-[#F4EDF8] dark:bg-[#332D45] border border-[#E7DDF3] dark:border-[#40385A] space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#EADDF8] dark:bg-[#4A3E69] flex items-center justify-center text-[#8B6FCB] font-bold uppercase">
                          {therapistName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-[#241C33] dark:text-[#FAF8FD]">
                            {isPending ? 'Therapy Session Request' : 'Therapy Session'}
                          </p>
                          <p className="text-[10px] text-[#8D84A3] font-bold">
                            Status: <span className={isPending ? "text-amber-500" : "text-emerald-500 font-extrabold"}>{isPending ? '🟡 Pending' : '🟢 Accepted'}</span>
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-[#E9E2F2] dark:border-[#40385A] grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-[10px] text-[#8D84A3]">Date & Time</p>
                          <p className="font-bold text-[#241C33] dark:text-[#FAF8FD]">
                            {safeFormatDate(nextAppointment.preferredDate, 'MMM d')} at {nextAppointment.preferredTime}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#8D84A3]">Therapist</p>
                          <p className="font-bold text-[#241C33] dark:text-[#FAF8FD]">
                            {therapistName}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-6">
                  <Calendar className="w-8 h-8 text-[#8D84A3] mx-auto opacity-40 mb-2" />
                  <p className="text-xs text-[#5F5770] dark:text-[#D5CCE8] font-bold">
                    No upcoming appointments.
                  </p>
                </div>
              )}
            </div>
            <div className="mt-6">
              <Link to="/appointments" className="block">
                <GradientButton className="w-full text-sm font-bold">
                  {nextAppointment ? (nextAppointment.sessionStatus === 'live' ? "Join Session" : "View Appointments") : "Book Appointment"}
                </GradientButton>
              </Link>
            </div>
          </GlassCard>

          {/* SECTION 8: AI Chat Summary */}
          <GlassCard className="p-6 flex flex-col justify-between" hover={false}>
            <div>
              <h3 className="text-xs font-bold text-[#8D84A3] dark:text-[#A89FBC] uppercase tracking-wider mb-4">
                AI Chat Summary
              </h3>
              <div className="p-4 rounded-xl bg-[#F4EDF8] dark:bg-[#332D45] border border-[#E7DDF3] dark:border-[#40385A] space-y-2">
                <p className="text-xs text-[#5F5770] dark:text-[#D5CCE8] leading-relaxed italic font-medium">
                  "{aiChatSummary}"
                </p>
                <div className="pt-2 border-t border-[#E9E2F2] dark:border-[#40385A]">
                  <p className="text-[9px] uppercase font-bold text-[#8D84A3]">Suggested Next Step</p>
                  <p className="text-xs font-bold text-[#8B6FCB] dark:text-[#B497E8] mt-0.5">
                    Discuss sleep strategies or journal entry analysis
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Link to="/chat" className="block">
                <GradientButton className="w-full text-sm font-bold">
                  Continue Conversation
                </GradientButton>
              </Link>
            </div>
          </GlassCard>

          {/* SECTION 9: Wellness Progress */}
          <GlassCard className="p-6" hover={false}>
            <h3 className="text-xs font-bold text-[#8D84A3] dark:text-[#A89FBC] uppercase tracking-wider mb-6">
              Wellness Progress
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Mood Tracking', value: moodConsistency },
                { label: 'Journal Consistency', value: journalConsistency },
                { label: 'AI Conversations', value: aiConversationsProgress },
                { label: 'Therapy Sessions', value: sessionsConsistency },
                { label: 'Overall Progress', value: overallProgress },
              ].map((prog, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className={prog.label === 'Overall Progress' ? 'text-[#8B6FCB] dark:text-[#B497E8] font-black' : 'text-[#5F5770] dark:text-[#D5CCE8]'}>
                      {prog.label}
                    </span>
                    <span className="text-[#8D84A3]">{prog.value}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#F4EDF8] dark:bg-[#332D45] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${prog.label === 'Overall Progress' ? 'bg-[#8B6FCB]' : 'bg-[#A98DD9]'}`}
                      style={{ width: `${prog.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* SECTION 12: Personalized Recommendations */}
          <GlassCard className="p-6" hover={false}>
            <h3 className="text-xs font-bold text-[#8D84A3] dark:text-[#A89FBC] uppercase tracking-wider mb-4">
              Personalized Recommendations
            </h3>
            <div className="space-y-3">
              {recommendations.map((rec, idx) => (
                <Link key={idx} to={rec.path} className="block group">
                  <div className="p-3.5 rounded-xl bg-[#F4EDF8] dark:bg-[#332D45] border border-[#E7DDF3] dark:border-[#40385A] flex items-center justify-between shadow-sm group-hover:scale-102 transition-transform duration-300">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-[#8B6FCB] shrink-0" />
                      <p className="text-xs text-[#5F5770] dark:text-[#D5CCE8] font-bold">
                        {rec.text}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8D84A3] group-hover:text-[#6F52B5] transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </GlassCard>

        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
