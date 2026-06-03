import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Calendar,
  BookOpen,
  Brain,
  Shield,
  Users,
  Star,
  ChevronRight,
  Sparkles,
  Activity,
} from 'lucide-react';
import { GlassCard, GradientButton } from '../components/ui/Layout';

const features = [
  {
    icon: Brain,
    title: 'AI Therapist',
    description: '24/7 supportive AI chat with emotional intelligence',
    color: 'from-lavender-500 to-accent-500',
  },
  {
    icon: Activity,
    title: 'Mood Tracking',
    description: 'Visualize your emotional patterns and insights',
    color: 'from-coral-500 to-amber-500',
  },
  {
    icon: Calendar,
    title: 'Video Sessions',
    description: 'Connect with licensed therapists from anywhere',
    color: 'from-primary-500 to-cyan-500',
  },
  {
    icon: BookOpen,
    title: 'Journaling',
    description: 'Private space to express and reflect on your thoughts',
    color: 'from-mint-500 to-emerald-500',
  },
];

const testimonials = [
  {
    name: 'Sarah M.',
    role: 'Member',
    content: 'MindWell has been transformative for my mental health journey. The AI therapist is incredibly supportive.',
    rating: 5,
  },
  {
    name: 'Dr. James K.',
    role: 'Therapist',
    content: 'An excellent platform that bridges the gap between technology and mental wellness.',
    rating: 5,
  },
  {
    name: 'Emily R.',
    role: 'Premium Member',
    content: 'The mood tracking and journaling features helped me understand my patterns better.',
    rating: 5,
  },
];

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-primary-50 dark:from-calm-950 dark:via-calm-900 dark:to-calm-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Floating Elements */}
        <motion.div
          animate={{ y: [0, -30, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-20 left-10 w-40 h-40 rounded-full bg-gradient-to-br from-lavender-400/20 to-accent-400/20 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-40 right-20 w-60 h-60 rounded-full bg-gradient-to-br from-primary-400/20 to-cyan-400/20 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 40, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute bottom-20 left-1/3 w-32 h-32 rounded-full bg-gradient-to-br from-mint-400/20 to-emerald-400/20 blur-2xl"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lavender-100 dark:bg-lavender-900/30 mb-8"
            >
              <Sparkles className="w-4 h-4 text-lavender-500" />
              <span className="text-sm font-medium text-lavender-600 dark:text-lavender-400">
                Trusted by 50,000+ users
              </span>
            </motion.div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-calm-800 dark:text-white mb-6 leading-tight">
              Your journey to
              <span className="block bg-gradient-to-r from-lavender-600 via-accent-500 to-primary-500 bg-clip-text text-transparent">
                mental wellness
              </span>
              starts here
            </h1>

            <p className="text-xl text-calm-600 dark:text-calm-300 mb-10 max-w-2xl mx-auto">
              AI-powered therapy, licensed professionals, and a supportive community.
              All in one beautiful platform designed for your peace of mind.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup">
                <GradientButton size="lg" className="group">
                  Start Your Journey
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </GradientButton>
              </Link>
              <Link to="/login">
                <GradientButton variant="ghost" size="lg">
                  Sign In
                </GradientButton>
              </Link>
            </div>
          </motion.div>

          {/* Hero Image/Stats */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-20"
          >
            <GlassCard className="p-8" hover={false}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { value: '50K+', label: 'Active Users' },
                  { value: '100+', label: 'Therapists' },
                  { value: '4.9', label: 'User Rating' },
                  { value: '24/7', label: 'AI Support' },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-4xl font-bold bg-gradient-to-r from-lavender-600 to-accent-600 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-sm text-calm-500 mt-1">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-calm-800 dark:text-white mb-4">
            Everything you need for mental wellness
          </h2>
          <p className="text-lg text-calm-500 dark:text-calm-400 max-w-2xl mx-auto">
            Comprehensive tools designed by mental health professionals
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className="p-6 text-center h-full">
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mx-auto mb-4 shadow-glow`}
                >
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-calm-800 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-calm-500 dark:text-calm-400">
                  {feature.description}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-r from-lavender-100/50 to-primary-100/50 dark:from-lavender-900/20 dark:to-primary-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-calm-800 dark:text-white mb-4">
              How it works
            </h2>
            <p className="text-lg text-calm-500 dark:text-calm-400">
              Three simple steps to better mental health
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: 1, title: 'Create Account', desc: 'Sign up for free and complete your wellness profile' },
              { step: 2, title: 'Explore Tools', desc: 'Access AI therapy, mood tracking, and journaling' },
              { step: 3, title: 'Connect & Grow', desc: 'Book sessions with therapists and join the community' },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="text-center"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-lavender-500 to-accent-500 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white shadow-glow">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-calm-800 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-calm-500 dark:text-calm-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-calm-800 dark:text-white mb-4">
            What our users say
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className="p-6 h-full">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-500 fill-current" />
                  ))}
                </div>
                <p className="text-calm-600 dark:text-calm-300 mb-4 italic">
                  "{item.content}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lavender-500 to-accent-500" />
                  <div>
                    <p className="font-medium text-calm-800 dark:text-white">
                      {item.name}
                    </p>
                    <p className="text-xs text-calm-500">{item.role}</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <GlassCard className="p-12" gradient hover={false}>
            <Shield className="w-16 h-16 text-lavender-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-calm-800 dark:text-white mb-4">
              Your mental health matters
            </h2>
            <p className="text-lg text-calm-500 dark:text-calm-400 mb-8">
              Take the first step today. Start your free trial with no commitment.
            </p>
            <Link to="/signup">
              <GradientButton size="lg" className="group">
                Get Started Free
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </GradientButton>
            </Link>
          </GlassCard>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-calm-200 dark:border-calm-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-lavender-500" />
              <span className="text-xl font-bold bg-gradient-to-r from-lavender-600 to-accent-600 bg-clip-text text-transparent">
                MindWell
              </span>
            </div>
            <p className="text-sm text-calm-500">
              {new Date().getFullYear()} MindWell. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
