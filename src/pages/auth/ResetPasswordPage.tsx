import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Heart, CheckCircle, ArrowLeft, Check } from 'lucide-react';
import { GlassCard, GradientButton, GlassInput } from '@components/ui/Layout';
import toast from 'react-hot-toast';
import { API_URL, joinUrl } from '@utils/apiUtils';

const passwordRequirements = [
    { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
    { label: 'Contains a number', test: (p: string) => /\d/.test(p) },
    { label: 'Contains uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
    { label: 'Contains lowercase letter', test: (p: string) => /[a-z]/.test(p) },
];

export const ResetPasswordPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            toast.error('Invalid reset link');
            navigate('/login');
            return;
        }

        // CRITICAL: Clear any existing sessions when opening a reset link
        // to prevent account mismatch/confusion
        console.log('MindWell: Reset token detected. Clearing stale sessions for account isolation.');
        localStorage.removeItem('mindwell-session');
        localStorage.removeItem('mindwell-user');
        localStorage.removeItem('mindwell-profile');
    }, [token, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!password || !confirmPassword) {
            toast.error('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        // Check requirements
        const failedReq = passwordRequirements.find(req => !req.test(password));
        if (failedReq) {
            toast.error(`Password must meet all requirements: ${failedReq.label}`);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(joinUrl(API_URL, '/auth/reset-password'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ token, newPassword: password }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Reset failed');
            }

            setIsSuccess(true);
            toast.success('Password updated successfully!');

            // Clear passwords from state for security
            setPassword('');
            setConfirmPassword('');

            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            console.error('MindWell: Reset Error:', error);
            toast.error((error as Error).message || 'Failed to update password');
        } finally {
            setIsLoading(false);
        }
    };

    const isPasswordValid = passwordRequirements.every(req => req.test(password)) && password === confirmPassword && password.length > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <GlassCard className="p-8" hover={false}>
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-lavender-500 to-accent-500 mb-4"
                    >
                        <Heart className="w-8 h-8 text-white" />
                    </motion.div>

                    {isSuccess ? (
                        <>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-16 h-16 mx-auto rounded-full bg-mint-100 dark:bg-mint-900/30 flex items-center justify-center mb-4"
                            >
                                <CheckCircle className="w-8 h-8 text-mint-600 dark:text-mint-400" />
                            </motion.div>
                            <h2 className="text-3xl font-bold text-calm-800 dark:text-white mb-2">
                                All Set!
                            </h2>
                            <p className="text-calm-500 dark:text-calm-400 mb-6">
                                Password reset successful. Please login with your new password. Redirecting you to login...
                            </p>
                            <Link to="/login">
                                <GradientButton className="w-full">
                                    Login Now
                                </GradientButton>
                            </Link>
                        </>
                    ) : (
                        <>
                            <h2 className="text-3xl font-bold text-calm-800 dark:text-white mb-2">
                                Reset Password
                            </h2>
                            <p className="text-calm-500 dark:text-calm-400">
                                Create a new secure password for your account
                            </p>
                        </>
                    )}
                </div>

                {!isSuccess && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <GlassInput
                                label="New Password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter new password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                icon={<Lock className="w-5 h-5" />}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-[38px] text-calm-400 hover:text-calm-600 dark:hover:text-calm-300 transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>

                        {password && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-2"
                            >
                                {passwordRequirements.map((req, index) => (
                                    <motion.div
                                        key={req.label}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="flex items-center gap-2"
                                    >
                                        <div
                                            className={`w-4 h-4 rounded-full flex items-center justify-center ${req.test(password)
                                                ? 'bg-mint-500 text-white'
                                                : 'bg-calm-200 dark:bg-calm-700'
                                                }`}
                                        >
                                            {req.test(password) && <Check className="w-3 h-3" />}
                                        </div>
                                        <span
                                            className={`text-xs ${req.test(password)
                                                ? 'text-mint-600 dark:text-mint-400'
                                                : 'text-calm-500'
                                                }`}
                                        >
                                            {req.label}
                                        </span>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}

                        <GlassInput
                            label="Confirm New Password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Confirm your new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            icon={<Lock className="w-5 h-5" />}
                            error={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : ''}
                        />

                        <GradientButton
                            type="submit"
                            loading={isLoading}
                            disabled={!isPasswordValid}
                            className="w-full"
                            size="lg"
                        >
                            Update Password
                        </GradientButton>
                    </form>
                )}

                <Link
                    to="/login"
                    className="mt-6 flex items-center justify-center gap-2 text-sm text-calm-600 dark:text-calm-400 hover:text-lavender-600 dark:hover:text-lavender-400 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Sign In
                </Link>
            </GlassCard>
        </motion.div>
    );
};

export default ResetPasswordPage;
