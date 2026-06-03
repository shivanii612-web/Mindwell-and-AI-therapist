import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Plus,
  Search,
  Calendar,
  Trash2,
} from 'lucide-react';
import { useGetJournalsQuery, useDeleteJournalMutation } from '@redux/api/apiSlice';
import { GlassCard, GradientButton, Badge } from '@components/ui/Layout';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import toast from 'react-hot-toast';
import { cn } from '@utils/cn';

export const JournalPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [selectedJournal, setSelectedJournal] = useState<any>(null);
  const { data: journals = [], refetch } = useGetJournalsQuery({ limit: 50 });
  const [deleteJournal] = useDeleteJournalMutation();

  const filteredJournals = journals.filter((journal) => {
    const matchesSearch =
      journal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      journal.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMood = selectedMood === 'all' || journal.mood === selectedMood;
    return matchesSearch && matchesMood;
  });

  const groupByDate = (journals: typeof filteredJournals) => {
    const groups: { [key: string]: typeof journals } = {};
    journals.forEach((journal) => {
      const date = new Date(journal.created_at);
      let key = format(date, 'MMMM d, yyyy');
      if (isToday(date)) key = 'Today';
      else if (isYesterday(date)) key = 'Yesterday';
      else if (isThisWeek(date)) key = 'This Week';
      else if (format(date, 'yyyy') === format(new Date(), 'yyyy'))
        key = format(date, 'MMMM');
      else key = format(date, 'MMMM yyyy');

      if (!groups[key]) groups[key] = [];
      groups[key].push(journal);
    });
    return groups;
  };

  const groupedJournals = groupByDate(filteredJournals);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this journal entry?')) return;
    try {
      await deleteJournal(id).unwrap();
      toast.success('Journal entry deleted');
      refetch();
    } catch {
      toast.error('Failed to delete journal');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-calm-800 dark:text-white">
            My Journal
          </h1>
          <p className="text-calm-500 dark:text-calm-400">
            Express your thoughts and feelings
          </p>
        </div>
        <GradientButton
          icon={<Plus className="w-5 h-5" />}
          onClick={() => navigate('/journal/new')}
        >
          New Entry
        </GradientButton>
      </div>

      {/* Search and Filters */}
      <GlassCard className="p-4" hover={false}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-calm-400" />
            <input
              type="text"
              placeholder="Search journals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-calm-100/50 dark:bg-calm-800/50 border border-calm-200 dark:border-calm-700 text-calm-800 dark:text-white placeholder:text-calm-400 focus:outline-none focus:ring-2 focus:ring-lavender-500/50 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedMood}
              onChange={(e) => setSelectedMood(e.target.value)}
              className="px-4 py-2 rounded-xl bg-calm-100/50 dark:bg-calm-800/50 border border-calm-200 dark:border-calm-700 text-calm-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-lavender-500/50"
            >
              <option value="all">All Moods</option>
              <option value="great">Great</option>
              <option value="good">Good</option>
              <option value="neutral">Neutral</option>
              <option value="low">Low</option>
              <option value="bad">Bad</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Journal Entries */}
      {filteredJournals.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="p-12 text-center" hover={false}>
            <BookOpen className="w-16 h-16 text-calm-300 dark:text-calm-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-calm-800 dark:text-white mb-2">
              No journal entries yet.
            </h3>
            <p className="text-calm-500 dark:text-calm-400 mb-6">
              Write your first reflection today.
            </p>
            <GradientButton
              icon={<Plus className="w-5 h-5" />}
              onClick={() => navigate('/journal/new')}
            >
              Write your first entry
            </GradientButton>
          </GlassCard>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedJournals).map(([group, entries]) => (
            <motion.div
              key={group}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-lg font-semibold text-calm-600 dark:text-calm-400 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {group}
              </h2>
              <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {entries.map((journal, index) => (
                  <motion.div
                    key={journal.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <GlassCard
                      className="p-5 group cursor-pointer"
                      onClick={() => setSelectedJournal(journal)}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-calm-800 dark:text-white hover:text-lavender-600 dark:hover:text-lavender-400 transition-colors truncate">
                            {journal.title}
                          </h3>
                          <p className="text-xs text-calm-500 mt-1">
                            {format(new Date(journal.created_at), 'h:mm a')}
                          </p>
                        </div>
                        {journal.mood && (
                          <Badge
                            variant={
                              journal.mood === 'great'
                                ? 'success'
                                : journal.mood === 'good'
                                  ? 'info'
                                  : journal.mood === 'neutral'
                                    ? 'warning'
                                    : 'error'
                            }
                            size="sm"
                          >
                            {journal.mood}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-calm-600 dark:text-calm-300 mb-4 line-clamp-3">
                        {journal.content}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-lavender-600 hover:text-lavender-500 dark:text-lavender-400 font-medium">
                          Read more
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => handleDelete(e, journal.id)}
                            className="p-1.5 rounded-lg hover:bg-coral-100 dark:hover:bg-coral-900/30 text-coral-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* View Modal */}
      <AnimatePresence>
        {selectedJournal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedJournal(null)}
              className="absolute inset-0 bg-calm-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-calm-900 rounded-2xl shadow-2xl overflow-hidden border border-white/20 dark:border-white/10"
            >
              <div className="p-8 max-h-[80vh] overflow-y-auto">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-calm-800 dark:text-white mb-2">
                      {selectedJournal.title}
                    </h2>
                    <p className="text-sm text-calm-500">
                      {format(new Date(selectedJournal.created_at), 'MMMM d, yyyy • h:mm a')}
                    </p>
                  </div>
                  <Badge
                    variant={
                      selectedJournal.mood === 'great'
                        ? 'success'
                        : selectedJournal.mood === 'good'
                          ? 'info'
                          : selectedJournal.mood === 'neutral'
                            ? 'warning'
                            : 'error'
                    }
                  >
                    {selectedJournal.mood}
                  </Badge>
                </div>

                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-calm-700 dark:text-calm-200 whitespace-pre-wrap leading-relaxed">
                    {selectedJournal.content}
                  </p>
                </div>

                {selectedJournal.tags && selectedJournal.tags.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-calm-100 dark:border-calm-800">
                    <div className="flex flex-wrap gap-2">
                      {selectedJournal.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="px-3 py-1 rounded-full bg-lavender-100 dark:bg-lavender-900/30 text-lavender-600 dark:text-lavender-400 text-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 bg-calm-50 dark:bg-calm-800/50 flex justify-end">
                <GradientButton onClick={() => setSelectedJournal(null)}>
                  Close
                </GradientButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JournalPage;
