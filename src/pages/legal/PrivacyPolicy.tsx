import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GlassCard } from '../../components/ui/Layout';

const PrivacyPolicy: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-primary-50 dark:from-calm-950 dark:via-calm-900 dark:to-calm-950 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <Link
                    to="/signup"
                    className="inline-flex items-center text-calm-600 hover:text-lavender-600 dark:text-calm-400 dark:hover:text-lavender-400 mb-8 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    Back to Signup
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <GlassCard className="p-8 md:p-12" hover={false}>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lavender-500 to-accent-500 flex items-center justify-center shadow-glow">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-calm-800 dark:text-white">
                                Privacy Policy
                            </h1>
                        </div>

                        <div className="prose dark:prose-invert max-w-none space-y-6 text-calm-600 dark:text-calm-300">
                            <section>
                                <h2 className="text-xl font-semibold text-calm-800 dark:text-white mb-3">1. Information We Collect</h2>
                                <p>
                                    We collect information you provide directly to us, such as when you create an account, journal, or chat with our AI Therapist. This includes your name, email address, and the content of your interactions.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-calm-800 dark:text-white mb-3">2. How We Use Your Information</h2>
                                <p>
                                    We use your information to provide and improve our services, personalize your experience, and maintain the security of our platform. Your journal entries and chat history are used to provide personal insights and continuity in support.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-calm-800 dark:text-white mb-3">3. Data Security</h2>
                                <p>
                                    We implement a variety of security measures to maintain the safety of your personal information. Your sensitive data is encrypted and stored securely using industry-standard protocols.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-calm-800 dark:text-white mb-3">4. Data Sharing</h2>
                                <p>
                                    We do not sell, trade, or otherwise transfer your personally identifiable information to third parties. We may share anonymized, aggregated data for research purposes to improve mental health technology.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-calm-800 dark:text-white mb-3">5. AI Learning</h2>
                                <p>
                                    Our AI Therapist learns from interactions to provide better support. However, these interactions are de-identified and used in a way that protects your individual privacy.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-calm-800 dark:text-white mb-3">6. Your Rights</h2>
                                <p>
                                    You have the right to access, correct, or delete your personal data at any time through your account settings or by contacting our support team.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-calm-800 dark:text-white mb-3">7. Cookies</h2>
                                <p>
                                    We use cookies to enhance your experience and remember your preferences. You can choose to disable cookies through your browser settings, though some features of the site may not function properly.
                                </p>
                            </section>

                            <div className="pt-8 border-t border-calm-200 dark:border-calm-800 text-sm text-calm-500">
                                Last updated: June 3, 2026
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
