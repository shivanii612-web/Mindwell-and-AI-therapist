import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Activity,
  MoreHorizontal,
  Sparkles,
  MessageCircle,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Heart,
  Calendar,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@hooks/useRedux';
import { useGetMoodsQuery, useGetAppointmentsQuery, useGetJournalsQuery } from '@redux/api/apiSlice';
import { GlassCard } from '@components/ui/Layout';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isSameMonth, subDays } from 'date-fns';

const moods_config = [
  { label: 'Happy', icon: '😊', color: 'bg-green-500', glow: 'shadow-green-500/50' },
  { label: 'Calm', icon: '😌', color: 'bg-blue-400', glow: 'shadow-blue-400/50' },
  { label: 'Anxious', icon: '😰', color: 'bg-orange-400', glow: 'shadow-orange-400/50' },
  { label: 'Sad', icon: '😢', color: 'bg-red-400', glow: 'shadow-red-400/50' },
  { label: 'Tired', icon: '😴', color: 'bg-indigo-400', glow: 'shadow-indigo-400/50' },
  { label: 'Burned Out', icon: '😫', color: 'bg-purple-400', glow: 'shadow-purple-400/50' },
];

const getRandomQuote = () => {
  const quotes = [
    { text: "You've made progress every day, no matter how small. Keep being kind to yourself.", author: 'AI Companion' },
    { text: "Your mental health is a priority. Your happiness is an essential. Your self-care is a necessity.", author: 'MindWell' },
    { text: "The only way out is through, and you are doing exceptionally well.", author: 'AI Therapist' },
  ];
  return quotes[0];
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-calm-900 border border-calm-100 dark:border-white/10 p-2 rounded-lg shadow-xl backdrop-blur-md">
        <p className="text-[10px] font-bold text-calm-400 uppercase tracking-wider">{payload[0].payload.day}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-2 h-2 rounded-full bg-lavender-500" />
          <p className="text-sm font-bold text-calm-900 dark:text-white">
            Score: {payload[0].value}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export const DashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector((state) => state.auth);
  const { isDarkMode } = useAppSelector((state) => state.ui);
  const { data: moods = [] } = useGetMoodsQuery({ limit: 100 });
  const { data: appointments = [] } = useGetAppointmentsQuery({});
  const { data: journals = [] } = useGetJournalsQuery({ limit: 5 });
  const [selectedMood, setSelectedMood] = React.useState<string | null>('Calm');
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const quote = getRandomQuote();

  const latestMood = moods[0];
  const chartData = moods.map((mood) => ({
    day: format(new Date(mood.logged_at), 'MMM d'),
    score: mood.mood_score,
  })).reverse();

  const moodDistribution = moods.length > 0 ? Object.entries(
    moods.reduce((acc: any, m) => {
      acc[m.mood] = (acc[m.mood] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, count]: any) => ({
    name: name.charAt(0) + name.slice(1).toLowerCase(),
    value: Math.round((count / moods.length) * 100),
    color: moods_config.find(mc => mc.label.toLowerCase() === name.toLowerCase())?.color.replace('bg-', '#') || '#8b5cf6'
  })).sort((a, b) => b.value - a.value).slice(0, 5) : [];

  const emotionsThisWeek = moods.length > 0 ? Object.entries(
    moods.slice(0, 7).reduce((acc: any, m) => {
      acc[m.mood] = (acc[m.mood] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, count]: any) => ({
    day: name.charAt(0) + name.slice(1).toLowerCase(),
    value: count,
  })).slice(0, 4) : [];

  const weeklyUniqueDays = React.useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => subDays(new Date(), i))
      .filter(day => moods.some(m => isSameDay(new Date(m.logged_at), day)))
      .length;
  }, [moods]);

  const getMoodColor = (moodValue: string) => {
    switch (moodValue.toLowerCase()) {
      case 'happy': return '#22C55E';
      case 'calm': return '#3B82F6';
      case 'anxious': return '#F59E0B';
      case 'sad': return '#EF4444';
      case 'angry': return '#F97316';
      case 'tired': return '#64748B';
      case 'burned_out': return '#8B5CF6';
      default: return '#8B5CF6';
    }
  };

  const getMoodIcon = (moodValue: string) => {
    return moods_config.find(m => m.label.toLowerCase() === moodValue.toLowerCase())?.icon || '😌';
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(monthEnd),
  });

  return (
    <div className="space-y-6 pb-12 min-h-screen bg-gradient-to-br from-[#F8F7FF] via-[#EEF6FF] to-[#F7FBFF] dark:from-calm-950 dark:via-calm-900 dark:to-calm-950 p-4 md:p-6 lg:p-8 pt-24 md:pt-28">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-calm-900 dark:text-white mb-1">
            Hi {profile?.full_name?.split(' ')[0] || 'User'}, here's your emotional summary. 👋
          </h1>
          <p className="text-calm-600 dark:text-calm-400 text-sm font-medium">Take a moment to check in with yourself today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-3">
          <GlassCard className="p-4 bg-white/90 dark:bg-calm-950/40 border-lavender-500/20 dark:border-white/5 shadow-lg" hover={false}>
            <h3 className="text-sm font-semibold text-calm-900 dark:text-white mb-4">How are you feeling today?</h3>
            <div className="flex flex-wrap items-center gap-4">
              {moods_config.map((mood) => (
                <button
                  key={mood.label}
                  onClick={() => setSelectedMood(mood.label)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className={`w-12 h-12 rounded-xl ${mood.color} text-2xl flex items-center justify-center transition-all duration-300 ${selectedMood === mood.label ? `scale-110 shadow-lg ${mood.glow}` : 'opacity-50 group-hover:opacity-100 group-hover:scale-105'}`}>
                    {mood.icon}
                  </div>
                  <span className={`text-[10px] font-bold transition-colors ${selectedMood === mood.label ? 'text-calm-900 dark:text-white' : 'text-calm-500 dark:text-calm-400'}`}>
                    {mood.label}
                  </span>
                </button>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassCard className="p-4 bg-indigo-900/40 border-white/10 h-full flex items-center justify-between gap-4" hover={false}>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-white mb-2">
                <Sparkles className="w-4 h-4 text-lavender-400" />
                <span className="text-sm font-semibold">AI Companion</span>
              </div>
              <p className="text-[11px] text-calm-200 italic font-medium line-clamp-2">
                "{quote.text}"
              </p>
            </div>
            <Link to="/chat">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-glow hover:scale-110 transition-transform">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
            </Link>
          </GlassCard>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <GlassCard className="p-4 bg-white/90 dark:bg-calm-950/40 border-lavender-500/20 dark:border-white/5 h-full" hover={false}>
            <div className="flex flex-col h-full items-center justify-center text-center py-6">
              <div className="text-6xl mb-4 drop-shadow-md">
                {latestMood ? getMoodIcon(latestMood.mood) : '😌'}
              </div>
              <h3 className="text-xl font-bold text-calm-900 dark:text-white mb-2">
                {latestMood ? `Feeling ${latestMood.mood}` : 'No mood logged yet'}
              </h3>
              <p className="text-sm text-calm-500 font-medium">
                {latestMood ? 'Latest check-in' : 'Choose a mood above to start tracking.'}
              </p>
              {latestMood && (
                <p className="text-xs text-calm-400 mt-1 font-bold">
                  {format(new Date(latestMood.logged_at), 'MMM d, h:mm a')}
                </p>
              )}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1">
          <GlassCard className="p-4 bg-white/90 dark:bg-calm-950/40 border-lavender-500/20 dark:border-white/5 h-full" hover={false}>
            <h3 className="text-[10px] font-bold text-calm-400 uppercase tracking-[0.1em] mb-2">Mood Trends</h3>
            <div className="h-28 mb-2">
              {chartData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 9, fill: '#94A3B8' }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      minTickGap={15}
                    />
                    <YAxis
                      domain={[0, 10]}
                      tick={{ fontSize: 9, fill: '#94A3B8' }}
                      axisLine={false}
                      tickLine={false}
                      width={15}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorScore)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center bg-calm-50/50 dark:bg-white/3 rounded-xl border border-dashed border-calm-200 dark:border-white/10 p-4 text-center">
                  <Activity className="w-5 h-5 text-calm-300 mb-2" />
                  <p className="text-[10px] text-calm-500 dark:text-calm-400 font-bold leading-tight">
                    Not enough mood data yet
                  </p>
                </div>
              )}
            </div>
            <p className="text-[10px] text-calm-500 dark:text-calm-400 leading-tight">
              {chartData.length > 1 ? "Your emotional stability trend over time." : "Log moods on different days to see your trend."}
            </p>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="lg:col-span-1 border-l border-calm-100 dark:border-white/5 pl-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-calm-900 dark:text-white text-xs uppercase tracking-wider">{format(currentMonth, 'MMMM yyyy')}</h3>
                <p className="text-[9px] font-bold text-calm-400 uppercase tracking-widest mt-0.5">Calendar</p>
              </div>
              <div className="flex gap-2">
                <ChevronLeft className="w-3 h-3 text-calm-400 cursor-pointer hover:text-calm-900" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} />
                <ChevronRight className="w-3 h-3 text-calm-400 cursor-pointer hover:text-calm-900" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} />
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isToday(day) ? 'ring-1 ring-lavender-500' : ''} ${isSameMonth(day, currentMonth) ? 'border-calm-100 dark:border-white/5' : 'border-transparent opacity-20'}`}
                    style={{
                      backgroundColor: moods.find(m => isSameDay(new Date(m.logged_at), day))
                        ? `${getMoodColor(moods.find(m => isSameDay(new Date(m.logged_at), day))!.mood)}20`
                        : 'transparent'
                    }}
                  >
                    <span className={`text-[8px] font-bold ${isSameMonth(day, currentMonth) ? 'text-calm-400' : 'text-calm-200 dark:text-calm-700'}`}>{format(day, 'd')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1 border-l border-calm-100 dark:border-white/5 pl-4">
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-calm-900 dark:text-white text-xs uppercase tracking-wider">Key Insights</h3>
            <div className="h-28">
              {moods.length > 3 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={emotionsThisWeek}>
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {emotionsThisWeek.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={getMoodColor(entry.day)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center bg-calm-50/50 dark:bg-white/3 rounded-xl border border-dashed border-calm-200 dark:border-white/10 p-4 text-center">
                  <TrendingUp className="w-5 h-5 text-lavender-400 mb-2 opacity-50" />
                  <p className="text-[10px] text-calm-700 dark:text-calm-200 font-bold leading-tight">
                    Keep logging moods to unlock deeper insights.
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-[10px] text-calm-400 font-bold uppercase tracking-wider">Weekly Progress</p>
              <div className="w-full h-1.5 bg-calm-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-lavender-500 to-accent-500 rounded-full shadow-glow" style={{ width: `${Math.min(100, (weeklyUniqueDays / 7) * 100)}%` }} />
              </div>
              <p className="text-[9px] text-calm-500 font-medium text-right">{weeklyUniqueDays}/7 days logged</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        {[
          { label: 'Talk to Therapist', sub: 'Chat with AI', icon: MessageCircle, color: 'bg-purple-100 dark:bg-purple-900/40', path: '/chat', text: 'text-purple-700 dark:text-purple-100' },
          { label: 'Write Journal', sub: 'Express your thoughts', icon: BookOpen, color: 'bg-blue-100 dark:bg-blue-900/40', path: '/journal/new', text: 'text-blue-700 dark:text-blue-100' },
          { label: 'Mood Tracker', sub: 'Log your mood', icon: Heart, color: 'bg-amber-100 dark:bg-amber-900/40', path: '/mood', text: 'text-amber-700 dark:text-amber-100' },
          { label: 'Book Session', sub: 'Schedule appointment', icon: Calendar, color: 'bg-green-100 dark:bg-green-900/40', path: '/appointments', text: 'text-green-700 dark:text-green-100' },
        ].map((q, i) => (
          <Link key={i} to={q.path}>
            <GlassCard className={`p-4 ${q.color} border-calm-200 dark:border-white/5 group shadow-md hover:shadow-xl`} hover>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/40 dark:bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <q.icon className={`w-5 h-5 ${q.text}`} />
                </div>
                <div>
                  <p className={`text-sm font-bold ${q.text}`}>{q.label}</p>
                  <p className="text-[10px] text-calm-600 dark:text-calm-400 font-medium">{q.sub}</p>
                </div>
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div >
  );
};

export default DashboardPage;
