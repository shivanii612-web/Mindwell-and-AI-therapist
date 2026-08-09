import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GlassCard } from '../../components/ui/Layout';

const TermsOfService: React.FC = () => {
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
                                Terms of Service
                            </h1>
                        </div>

                        <div className="prose dark:prose-invert max-w-none space-y-6 text-calm-600 dark:text-calm-300">
                            <section>
                                <h2 className="text-xl font-semibold text-calm-800 dark:text-white mb-3">1. Acceptance of Terms</h2>
                                <p>
                                    By accessing and using MindWell, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-calm-800 dark:text-white mb-3">2. Description of Service</h2>
                                <p>
                                    MindWell provides mental wellness tools, including AI-powered therapy chat, mood tracking, journaling, and connections to licensed professionals. Our AI services are designed for support and wellness, not as a replacement for emergency medical care or crisis intervention.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-calm-800 dark:text-white mb-3">3. User Accounts</h2>
                                <p>
                                    You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information when creating an account.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-calm-800 dark:text-white mb-3">4. Privacy & Security</h2>
                                <p>
                                    Your use of MindWell is also governed by our Privacy Policy. We use industry-standard encryption and security measures to protect your data, but no method of transmission over the internet is 100% secure.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-calm-800 dark:text-white mb-3">5. Prohibited Conduct</h2>
                                <p>
                                    You agree not to use the service for any unlawful purpose or in any way that could damage, disable, or impair the service or interfere with any other party's use and enjoyment of the service.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-calm-800 dark:text-white mb-3">6. Limitations of Liability</h2>
                                <p>
                                    MindWell and its AI Therapist are provided on an "as is" basis. While we strive for accuracy and support, we do not guarantee specific outcomes and are not liable for decisions made based on AI-generated responses.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-calm-800 dark:text-white mb-3">7. Changes to Terms</h2>
                                <p>
                                    We reserve the right to modify these terms at any time. Your continued use of the service following any changes constitutes acceptance of the new terms.
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

export default TermsOfService;
