import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Save,
  ArrowLeft,
  Heart,
  Tag,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useCreateJournalMutation } from '@redux/api/apiSlice';
import { GlassCard, GradientButton } from '@components/ui/Layout';
import toast from 'react-hot-toast';
import { cn } from '@utils/cn';

const moodOptions = [
  { value: 'great', label: 'Great', emoji: '😄', color: 'bg-mint-100 dark:bg-mint-900/30' },
  { value: 'good', label: 'Good', emoji: '🙂', color: 'bg-primary-100 dark:bg-primary-900/30' },
  { value: 'neutral', label: 'Neutral', emoji: '😐', color: 'bg-amber-100 dark:bg-amber-900/30' },
  { value: 'low', label: 'Low', emoji: '😔', color: 'bg-coral-100 dark:bg-coral-900/30' },
  { value: 'bad', label: 'Bad', emoji: '😢', color: 'bg-red-100 dark:bg-red-900/30' },
];

const suggestedTags = [
  'gratitude',
  'growth',
  'challenge',
  'reflection',
  'achievement',
  'self-care',
  'relationships',
  'work',
  'health',
  'dreams',
];

export const NewJournalPage: React.FC = () => {
  const navigate = useNavigate();
  const [createJournal] = useCreateJournalMutation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [moodScore, setMoodScore] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in the title and content');
      return;
    }

    setIsSubmitting(true);
    try {
      await createJournal({
        title: title.trim(),
        content: content.trim(),
        mood,
        mood_score: moodScore,
        tags: selectedTags,
        is_private: isPrivate,
      }).unwrap();

      toast.success('Journal entry saved!');
      navigate('/journal');
    } catch (error) {
      console.error('Save Journal Error:', error);
      toast.error('Failed to save journal entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/journal')}
            className="flex items-center gap-2 text-calm-600 dark:text-calm-400 hover:text-calm-800 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Journal</span>
          </button>
          <GradientButton
            icon={<Save className="w-5 h-5" />}
            loading={isSubmitting}
            onClick={handleSave}
          >
            Save Entry
          </GradientButton>
        </div>

        <GlassCard className="p-6 mb-6" hover={false}>
          {/* Title */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Entry title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-2xl font-bold bg-transparent border-none outline-none text-calm-800 dark:text-white placeholder:text-calm-300 dark:placeholder:text-calm-600"
            />
          </div>

          {/* Mood Selection */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-lavender-500" />
              <span className="text-sm font-medium text-calm-700 dark:text-calm-300">
                How are you feeling?
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {moodOptions.map((option) => (
                <motion.button
                  key={option.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setMood(option.value);
                    setMoodScore(moodOptions.indexOf(option) * 2 + 2);
                  }}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all',
                    option.color,
                    mood === option.value
                      ? 'border-lavender-500 shadow-glow'
                      : 'border-transparent'
                  )}
                >
                  <span className="text-xl">{option.emoji}</span>
                  <span className="text-sm font-medium text-calm-700 dark:text-calm-300">
                    {option.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="mb-6">
            <textarea
              placeholder="What's on your mind today? Write freely..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[300px] resize-none bg-calm-50/50 dark:bg-calm-800/50 rounded-xl p-4 text-calm-800 dark:text-white placeholder:text-calm-400 border border-calm-200 dark:border-calm-700 focus:outline-none focus:ring-2 focus:ring-lavender-500/50 transition-all"
            />
            <div className="flex justify-between mt-2 text-xs text-calm-500">
              <span>{wordCount} words</span>
              <span>{content.length} characters</span>
            </div>
          </div>

          {/* Tags */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-lavender-500" />
              <span className="text-sm font-medium text-calm-700 dark:text-calm-300">
                Tags
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                    selectedTags.includes(tag)
                      ? 'bg-lavender-500 text-white'
                      : 'bg-calm-100 dark:bg-calm-800 text-calm-600 dark:text-calm-400 hover:bg-lavender-100 dark:hover:bg-lavender-900/30'
                  )}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-calm-50 dark:bg-calm-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lavender-500 to-accent-500 flex items-center justify-center">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-calm-800 dark:text-white">
                  Private Entry
                </p>
                <p className="text-xs text-calm-500">
                  Only you can see this entry
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsPrivate(!isPrivate)}
              className={cn(
                'relative w-14 h-7 rounded-full transition-colors',
                isPrivate ? 'bg-lavender-500' : 'bg-calm-300 dark:bg-calm-600'
              )}
            >
              <motion.div
                animate={{ x: isPrivate ? 28 : 4 }}
                className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
              />
            </button>
          </div>
        </GlassCard>

        {/* Writing Prompts */}
        <GlassCard className="p-6" hover={false}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-calm-800 dark:text-white">
              Need inspiration? Try these prompts:
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              "What are three things you're grateful for today?",
              "Describe a challenge you faced and how you overcame it.",
              "Write a letter to your future self.",
              "What made you smile today?",
              "Describe your ideal day from start to finish.",
              "What's something you want to let go of?",
            ].map((prompt, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setContent(prompt + '\n\n')}
                className="p-3 rounded-xl bg-calm-50 dark:bg-calm-800/50 text-left text-sm text-calm-600 dark:text-calm-300 hover:bg-lavender-50 dark:hover:bg-lavender-900/20 transition-colors"
              >
                {prompt}
              </motion.button>
            ))}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default NewJournalPage;
