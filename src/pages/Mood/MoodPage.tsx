import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  Clock,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import { useAppSelector } from '@hooks/useRedux';
import { useGetMoodsQuery, useCreateMoodMutation, Mood } from '@redux/api/apiSlice';
import { GlassCard, GradientButton, Avatar, Badge } from '@components/ui/Layout';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek, isSameDay, subDays, addMonths, subMonths } from 'date-fns';
import toast from 'react-hot-toast';

interface MoodConfig {
  value: string;
  label: string;
  icon: string;
  color: string;
  glow: string;
  textColor: string;
}

const mood_config: MoodConfig[] = [
  { value: 'happy', label: 'Happy', icon: '😊', color: 'bg-green-500', glow: 'shadow-green-500/40', textColor: 'text-green-600 dark:text-green-400' },
  { value: 'calm', label: 'Calm', icon: '😌', color: 'bg-blue-400', glow: 'shadow-blue-400/40', textColor: 'text-blue-600 dark:text-blue-400' },
  { value: 'anxious', label: 'Anxious', icon: '😰', color: 'bg-orange-400', glow: 'shadow-orange-400/40', textColor: 'text-orange-600 dark:text-orange-400' },
  { value: 'sad', label: 'Sad', icon: '😔', color: 'bg-red-400', glow: 'shadow-red-400/40', textColor: 'text-red-600 dark:text-red-400' },
  { value: 'angry', label: 'Angry', icon: '😡', color: 'bg-red-600', glow: 'shadow-red-600/40', textColor: 'text-red-700 dark:text-red-500' },
  { value: 'tired', label: 'Tired', icon: '😴', color: 'bg-indigo-400', glow: 'shadow-indigo-400/40', textColor: 'text-indigo-600 dark:text-indigo-400' },
  { value: 'burned_out', label: 'Burned Out', icon: '😫', color: 'bg-purple-500', glow: 'shadow-purple-500/40', textColor: 'text-purple-600 dark:text-purple-400' },
];

const triggerOptions = [
  'Work Stress', 'Studies', 'Family', 'Sleep', 'Friends', 'Health', 'Overthinking', 'Social Media'
];

export const MoodPage: React.FC = () => {
  const { profile } = useAppSelector((state) => state.auth);
  const { isDarkMode } = useAppSelector((state) => state.ui);
  const { data: moods = [], refetch } = useGetMoodsQuery({ limit: 100 });
  const [createMood, { isLoading: isSaving }] = useCreateMoodMutation();
  const [isSaved, setIsSaved] = useState(false);

  const [selectedMood, setSelectedMood] = useState<string | null>('calm');
  const [moodScore, setMoodScore] = useState(7);
  const [notes, setNotes] = useState('');
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleLogMood = async () => {
    if (!selectedMood) {
      toast.error('Please select a mood');
      return;
    }

    try {
      await createMood({
        userId: profile?.id,
        mood: selectedMood,
        mood_score: moodScore,
        notes,
        triggers: selectedTriggers,
      }).unwrap();

      toast.success('Mood diary updated!');
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      setNotes('');
      setSelectedTriggers([]);
      refetch();
    } catch (err) {
      console.error('Mood log error:', err);
      toast.error('Failed to log mood');
    }
  };

  const getMoodColor = (moodValue: string) => {
    switch (moodValue) {
      case 'happy': return '#22C55E';
      case 'calm': return '#3B82F6';
      case 'anxious': return '#F59E0B';
      case 'sad': return '#EF4444';
      case 'angry': return '#F97316';
      case 'tired': return '#64748B';
      case 'burned_out': return '#8B5CF6';
      default: return '#E2E8F0';
    }
  };

  // Date continuity for Mood Flow (Last 14 Days)
  const last14Days = Array.from({ length: 14 }, (_, i) => subDays(new Date(), 13 - i));
  const chartData = last14Days.map(date => {
    const dayLogs = (moods as Mood[]).filter(m => isSameDay(new Date(m.logged_at), date));
    // If multiple logs on same day, take the average or latest. Let's take latest for more direct feedback.
    const latestLog = dayLogs[0];
    return {
      day: format(date, 'MMM d'),
      fullDate: format(date, 'EEEE, MMM d'),
      score: latestLog ? latestLog.mood_score : null,
      mood: latestLog ? latestLog.mood : null,
      notes: latestLog ? latestLog.notes : null
    };
  });

  // Calculate real weekly insights
  const last7DaysEntries = (moods as Mood[]).filter(m => {
    const diff = (new Date().getTime() - new Date(m.logged_at).getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  });

  const moodsCountLast7Days = last7DaysEntries.length;
  const avgMoodScore = moodsCountLast7Days > 0
    ? (last7DaysEntries.reduce((sum, m) => sum + m.mood_score, 0) / moodsCountLast7Days).toFixed(1)
    : 0;

  const mostFrequentMood = moodsCountLast7Days > 0
    ? Object.entries(last7DaysEntries.reduce((acc: any, m) => {
      acc[m.mood] = (acc[m.mood] || 0) + 1;
      return acc;
    }, {})).sort((a: any, b: any) => b[1] - a[1])[0][0]
    : null;

  // Calendar logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(monthEnd),
  });

  const getMoodForDay = (day: Date): Mood | undefined => {
    return (moods as Mood[]).find(m => isSameDay(new Date(m.logged_at), day));
  };

  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length && payload[0].value !== null) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-calm-900 border border-calm-100 dark:border-white/10 p-3 rounded-xl shadow-xl backdrop-blur-md z-50">
          <p className="text-[10px] font-black text-calm-400 uppercase tracking-widest mb-1">{data.fullDate}</p>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{mood_config.find(mc => mc.value === data.mood)?.icon || '😌'}</span>
            <p className="text-sm font-black text-calm-900 dark:text-white capitalize">{data.mood?.replace('_', ' ')}</p>
            <Badge className="bg-lavender-500/10 text-lavender-600 border-none font-black text-[10px]">
              {data.score}/10
            </Badge>
          </div>
          {data.notes && (
            <p className="text-[10px] text-calm-600 dark:text-calm-400 italic font-medium leading-relaxed max-w-[150px] border-t border-calm-100 dark:border-white/5 pt-1 mt-1">
              "{data.notes}"
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-12 min-h-screen bg-gradient-to-br from-[#F8F7FF] via-[#EEF6FF] to-[#F7FBFF] dark:from-calm-950 dark:via-calm-900 dark:to-calm-950 px-6 md:px-8 pt-24 md:pt-28">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-calm-900 dark:text-white mb-2">Mood Tracker</h1>
          <p className="text-calm-600 dark:text-calm-400">Track your emotions and understand your patterns.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="primary" size="lg" className="bg-lavender-500/10 text-lavender-600 border border-lavender-200 dark:border-lavender-500/20">
            <Clock className="w-4 h-4 mr-2" />
            {moods.length > 0 ? `Last Sync: ${format(new Date(moods[0].logged_at), 'h:mm a')}` : 'No Entries Yet'}
          </Badge>
          <Avatar
            src={profile?.avatar_url}
            alt={profile?.full_name || 'User'}
            size="md"
            className="border-2 border-lavender-500/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Today's Check-in (Main Diary) */}
        <div className="lg:col-span-12 xl:col-span-8 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard className="p-8 bg-white/90 dark:bg-calm-950/40 border-lavender-500/20 dark:border-white/5 shadow-xl" hover={false}>
              <div className="flex items-center gap-2 mb-8">
                <Sparkles className="w-6 h-6 text-lavender-500" />
                <h2 className="text-2xl font-bold text-calm-900 dark:text-white">How are you feeling today?</h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4 mb-8">
                {mood_config.map((mood) => (
                  <button
                    key={mood.value}
                    onClick={() => setSelectedMood(mood.value)}
                    className="flex flex-col items-center gap-3 group"
                  >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl transition-all duration-300 transform ${selectedMood === mood.value
                      ? `${mood.color} ${mood.glow} scale-110 rotate-3`
                      : 'bg-calm-100 dark:bg-white/5 opacity-60 group-hover:opacity-100 group-hover:bg-calm-200'
                      }`}>
                      {mood.icon}
                    </div>
                    <span className={`text-xs font-bold transition-colors ${selectedMood === mood.value ? mood.textColor : 'text-calm-500 dark:text-calm-400'
                      }`}>
                      {mood.label}
                    </span>
                    {selectedMood === mood.value && (
                      <motion.div layoutId="active" className="w-1.5 h-1.5 rounded-full bg-lavender-500" />
                    )}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-8">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-sm font-bold text-calm-800 dark:text-calm-200">Mood Score</label>
                      <span className="text-2xl font-black text-lavender-600 dark:text-lavender-400">{moodScore}/10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={moodScore}
                      onChange={(e) => setMoodScore(parseInt(e.target.value))}
                      className="w-full h-3 bg-calm-100 dark:bg-white/5 rounded-lg appearance-none cursor-pointer accent-lavender-500"
                    />
                    <div className="flex justify-between mt-2 text-[10px] font-bold text-calm-400 uppercase tracking-tighter">
                      <span>Low</span>
                      <span>Neutral</span>
                      <span>Excellent</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-calm-800 dark:text-calm-200 block mb-4">What's influencing your mood?</label>
                    <div className="flex flex-wrap gap-2">
                      {triggerOptions.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => {
                            setSelectedTriggers(prev =>
                              prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                            );
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedTriggers.includes(tag)
                            ? 'bg-lavender-500 text-white border-lavender-500 shadow-glowSm'
                            : 'bg-white dark:bg-white/5 text-calm-600 dark:text-calm-300 border-calm-200 dark:border-white/10 hover:border-lavender-500/50'
                            }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-calm-800 dark:text-calm-200 block">Personal Diary Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="What happened today? How did it affect you?"
                    className="w-full h-32 p-4 rounded-2xl bg-calm-50 dark:bg-white/5 border border-calm-200 dark:border-white/10 text-calm-900 dark:text-white outline-none focus:ring-2 focus:ring-lavender-500/50 transition-all resize-none placeholder:text-calm-400 font-medium"
                  />
                  <GradientButton
                    size="lg"
                    className="shadow-glow mt-2 w-full"
                    onClick={handleLogMood}
                    disabled={isSaving}
                    icon={isSaving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : isSaved ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                  >
                    {isSaving ? 'Saving...' : isSaved ? 'Saved ✓' : 'Save Mood Check-in'}
                  </GradientButton>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mood Trend */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <GlassCard className="p-6 bg-white/90 dark:bg-calm-950/40 border-lavender-500/20 dark:border-white/5" hover={false}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-calm-900 dark:text-white uppercase tracking-wider text-xs">Mood Flow (Last 14 Days)</h3>
                  <TrendingUp className="w-4 h-4 text-lavender-500" />
                </div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="moodDiaryGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#ffffff10' : '#e2e8f0'} />
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fill: '#94a3b8' }}
                        interval={0}
                        minTickGap={15}
                      />
                      <YAxis hide domain={[0, 10]} />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#8b5cf6"
                        strokeWidth={4}
                        fill="url(#moodDiaryGrad)"
                        connectNulls={true}
                        dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </motion.div>

            {/* AI Insight Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <GlassCard className="p-6 bg-gradient-to-br from-indigo-600/10 to-lavender-600/10 dark:from-indigo-900/40 dark:to-lavender-900/40 border-lavender-200 dark:border-white/10 h-full flex flex-col justify-between" hover={false}>
                <div>
                  <div className="flex items-center gap-2 text-lavender-600 dark:text-lavender-400 mb-6">
                    <Sparkles className="w-5 h-5" />
                    <span className="font-bold tracking-tight uppercase text-xs">Weekly Reflection</span>
                  </div>
                  <div className="space-y-4">
                    {moodsCountLast7Days >= 3 ? (
                      <>
                        <p className="text-lg font-bold text-calm-900 dark:text-white leading-tight">
                          This week you felt mostly <span className="text-blue-500 capitalize">{mostFrequentMood?.replace('_', ' ')}</span>
                        </p>
                        <div className="space-y-3">
                          <div className="flex gap-3 text-sm text-calm-700 dark:text-calm-300 font-bold uppercase text-[10px] tracking-widest bg-white/50 dark:bg-black/20 p-2 rounded-lg items-center">
                            <Activity className="w-3 h-3 text-green-500" />
                            Avg Score: {avgMoodScore}/10
                          </div>
                          <div className="flex gap-3 text-sm text-calm-700 dark:text-calm-300 font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                            <p>You've logged {moodsCountLast7Days} entries this week. Consistency is key to understanding your patterns.</p>
                          </div>
                          {last7DaysEntries.some(m => m.triggers?.length > 0) && (
                            <div className="flex gap-3 text-sm text-calm-700 dark:text-calm-300 font-medium">
                              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 shrink-0" />
                              <p>Common triggers identified: {Array.from(new Set(last7DaysEntries.flatMap(m => m.triggers || []))).slice(0, 2).join(', ')}.</p>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="py-4 text-center">
                        <p className="text-sm font-bold text-calm-500 italic">Log moods for {3 - moodsCountLast7Days} more days to unlock detailed weekly insights.</p>
                      </div>
                    )}
                  </div>
                </div>
                <Badge variant="primary" className="mt-6 py-2 px-4 bg-lavender-500/20 text-lavender-700 dark:text-lavender-300 border-none justify-center font-bold">
                  {moodsCountLast7Days >= 3 ? "Keep it up, you're doing great!" : "Start your journey today"}
                </Badge>
              </GlassCard>
            </motion.div>
          </div>
        </div>

        {/* Right Column: Calendar and Recent Logs */}
        <div className="lg:col-span-12 xl:col-span-4 space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <GlassCard className="p-6 bg-white/90 dark:bg-calm-950/40 border-lavender-500/20 dark:border-white/5 shadow-xl" hover={false}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="font-bold text-calm-900 dark:text-white">{format(currentMonth, 'MMMM yyyy')}</h3>
                  <p className="text-[10px] font-bold text-calm-400 uppercase tracking-widest mt-1">Mood Calendar</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 rounded-lg bg-calm-50 dark:bg-white/5 text-calm-500 hover:text-lavender-500 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 rounded-lg bg-calm-50 dark:bg-white/5 text-calm-500 hover:text-lavender-500 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-[10px] text-calm-400 font-black mb-4 uppercase">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="text-center">{d}</div>)}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, i) => {
                  const dayMood = getMoodForDay(day);
                  return (
                    <div key={i} className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-help relative group shadow-sm ${isToday(day) ? 'ring-2 ring-lavender-500 ring-offset-2 dark:ring-offset-calm-900' : ''
                          } ${isSameMonth(day, currentMonth)
                            ? 'border-calm-100 dark:border-white/5'
                            : 'border-transparent opacity-20'
                          }`}
                        style={{
                          backgroundColor: dayMood ? `${getMoodColor(dayMood.mood)}20` : 'transparent'
                        }}
                      >
                        <span className={`text-xs font-bold ${isToday(day) ? 'text-lavender-600' : isSameMonth(day, currentMonth) ? 'text-calm-800 dark:text-calm-300' : 'text-calm-300 dark:text-calm-600'
                          }`}>
                          {format(day, 'd')}
                        </span>
                        {dayMood && (
                          <div
                            className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: getMoodColor(dayMood.mood) }}
                          />
                        )}

                        {/* Tooltip */}
                        {dayMood && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-calm-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-2xl pointer-events-none text-center">
                            <p className="font-bold capitalize mb-0.5">{dayMood.mood.replace('_', ' ')} · {dayMood.mood_score}/10</p>
                            <p className="text-calm-400 text-[8px] font-black uppercase tracking-tighter">{format(new Date(dayMood.logged_at), 'MMM d, yyyy')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 pt-8 border-t border-calm-100 dark:border-white/5">
                <p className="text-[10px] font-black text-calm-400 uppercase tracking-widest mb-4">Mood Palette</p>
                <div className="grid grid-cols-2 gap-3">
                  {mood_config.map(item => (
                    <div key={item.value} className="flex items-center gap-3">
                      <div className={`w-3.5 h-3.5 rounded-md ${item.color} shadow-sm`} />
                      <span className="text-[10px] font-bold text-calm-600 dark:text-calm-400 capitalize">{item.value.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Recent Detailed Logs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard className="p-6 bg-white/90 dark:bg-calm-950/40 border-lavender-500/20 dark:border-white/5" hover={false}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-calm-900 dark:text-white uppercase tracking-wider text-xs">Detailed Entries</h3>
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {moods && moods.length > 0 ? (moods as Mood[]).slice(0, 50).map((mood, idx) => {
                  const moodInfo = mood_config.find(m => m.value === mood.mood.toLowerCase()) || mood_config[1]; // Default to calm
                  return (
                    <div key={mood.id || idx} className="p-4 rounded-2xl bg-calm-50 dark:bg-white/5 border border-calm-100 dark:border-white/5 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{moodInfo?.icon || '😊'}</span>
                          <div>
                            <p className={`text-sm font-black capitalize ${moodInfo?.textColor || 'text-calm-900 dark:text-white'}`}>
                              {mood.mood.replace('_', ' ')}
                            </p>
                            <p className="text-[10px] font-bold text-calm-400">
                              {format(new Date(mood.logged_at), 'EEEE, MMM d · h:mm a')}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-lavender-500/10 text-lavender-600 border-none font-black text-[10px]">
                          {mood.mood_score}/10
                        </Badge>
                      </div>
                      {mood.notes && (
                        <p className="text-xs text-calm-700 dark:text-calm-300 italic line-clamp-3 leading-relaxed border-l-2 border-lavender-500/30 pl-3 py-1 bg-lavender-500/5 rounded-r-lg">
                          "{mood.notes}"
                        </p>
                      )}
                      {mood.triggers && mood.triggers.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {mood.triggers.map((t: string) => (
                            <span key={t} className="text-[8px] font-black uppercase tracking-tight px-2 py-0.5 rounded bg-white dark:bg-white/10 text-calm-500 dark:text-calm-400 border border-calm-100 dark:border-white/5">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }) : (
                  <div className="text-center py-10 opacity-60">
                    <Info className="w-10 h-10 text-calm-300 mx-auto mb-3" />
                    <p className="text-sm font-black text-calm-400">No mood entries yet</p>
                    <p className="text-[10px] text-calm-500 mt-1 uppercase tracking-widest font-black">Save your first mood check-in to see it here.</p>
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MoodPage;
