import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Heart, User, Mail, Phone, BookOpen, Stethoscope,
    Clock, FileText, Lock, Eye, EyeOff, CheckCircle2,
    ChevronRight, AlertCircle, Loader2, Shield,
} from 'lucide-react';
import { API_URL, joinUrl } from '@utils/apiUtils';
import toast from 'react-hot-toast';
import { cn } from '@utils/cn';

// ─── Password strength helper ─────────────────────────────────────────────────
const pwRequirements = [
    { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
    { label: 'Contains a number', test: (p: string) => /\d/.test(p) },
    { label: 'Contains uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
    { label: 'Contains lowercase letter', test: (p: string) => /[a-z]/.test(p) },
];

// ─── Field wrapper ────────────────────────────────────────────────────────────
const Field: React.FC<{
    label: string;
    required?: boolean;
    children: React.ReactNode;
    hint?: string;
}> = ({ label, required, children, hint }) => (
    <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-calm-700 dark:text-calm-300">
            {label}{required && <span className="text-red-400 ml-1">*</span>}
        </label>
        {children}
        {hint && <p className="text-xs text-calm-400">{hint}</p>}
    </div>
);

// ─── Styled input ─────────────────────────────────────────────────────────────
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }> = ({
    icon, className, ...props
}) => (
    <div className="relative">
        {icon && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-calm-400 pointer-events-none">
                {icon}
            </span>
        )}
        <input
            {...props}
            className={cn(
                'w-full rounded-xl border bg-calm-100/50 dark:bg-calm-800/50 px-4 py-3 text-sm',
                'text-calm-800 dark:text-white placeholder:text-calm-400',
                'border-calm-200 dark:border-calm-700',
                'focus:outline-none focus:ring-2 focus:ring-lavender-500/50 focus:border-lavender-500/50',
                'transition-all duration-200',
                icon && 'pl-10',
                className
            )}
        />
    </div>
);

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className, ...props }) => (
    <textarea
        {...props}
        className={cn(
            'w-full rounded-xl border bg-calm-100/50 dark:bg-calm-800/50 px-4 py-3 text-sm resize-none',
            'text-calm-800 dark:text-white placeholder:text-calm-400',
            'border-calm-200 dark:border-calm-700',
            'focus:outline-none focus:ring-2 focus:ring-lavender-500/50',
            'transition-all duration-200',
            className
        )}
    />
);

// ─── Main component ───────────────────────────────────────────────────────────
export const TherapistApplyPage: React.FC = () => {
    const [form, setForm] = useState({
        full_name: '',
        email: '',
        phone: '',
        qualification: '',
        specialization: '',
        experience_years: '',
        license_number: '',
        bio: '',
        available_timings: '',
        certificate_url: '',
        password: '',
        confirm_password: '',
    });
    const [showPw, setShowPw] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const set = (key: keyof typeof form) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => setForm(prev => ({ ...prev, [key]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (form.password !== form.confirm_password) {
            toast.error('Passwords do not match.');
            return;
        }
        if (!agreedToTerms) {
            toast.error('Please agree to the terms and conditions.');
            return;
        }
        if (form.password.length < 8) {
            toast.error('Password must be at least 8 characters.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(joinUrl(API_URL, '/therapist-applications/apply'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    experience_years: parseInt(form.experience_years) || 0,
                }),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setSubmitted(true);
                toast.success('Application submitted successfully!');
            } else {
                toast.error(data.error || 'Failed to submit application. Please try again.');
            }
        } catch {
            toast.error('Network error. Please check your connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Success screen ──────────────────────────────────────────────────────
    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-calm-950 via-calm-900 to-calm-950 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 shadow-2xl"
                >
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                        <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">Application Submitted!</h2>
                    <p className="text-calm-400 mb-2">
                        Thank you, <span className="text-lavender-400 font-semibold">{form.full_name}</span>!
                    </p>
                    <p className="text-calm-400 text-sm mb-8">
                        Your therapist application is under review. We will notify you once an admin has reviewed it.
                        You can check your status at any time using your email.
                    </p>
                    <div className="space-y-3">
                        <Link
                            to="/login"
                            className="block w-full py-3 rounded-xl bg-gradient-to-r from-lavender-500 to-accent-500 text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-glow"
                        >
                            Go to Login
                        </Link>
                        <Link
                            to="/"
                            className="block w-full py-3 rounded-xl bg-white/5 border border-white/10 text-calm-400 font-medium text-sm hover:bg-white/10 transition-colors"
                        >
                            Back to Home
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ── Application form ────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-calm-950 via-calm-900 to-calm-950">
            {/* Top nav bar */}
            <div className="sticky top-0 z-10 bg-calm-950/80 backdrop-blur border-b border-white/5">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <Heart className="w-6 h-6 text-lavender-400" />
                        <span className="text-lg font-bold bg-gradient-to-r from-lavender-400 to-accent-400 bg-clip-text text-transparent">
                            MindWell
                        </span>
                    </Link>
                    <Link to="/login" className="text-sm text-calm-400 hover:text-lavender-400 transition-colors font-medium">
                        Already have an account? Sign in →
                    </Link>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-12">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lavender-500/10 border border-lavender-500/20 mb-6">
                        <Shield className="w-4 h-4 text-lavender-400" />
                        <span className="text-sm font-medium text-lavender-400">Therapist Application</span>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-3">
                        Join as a <span className="bg-gradient-to-r from-lavender-400 to-accent-400 bg-clip-text text-transparent">Therapist</span>
                    </h1>
                    <p className="text-calm-400 max-w-lg mx-auto">
                        Submit your application to join the MindWell platform. Our team will review your credentials and approve your account within 2–3 business days.
                    </p>
                </motion.div>

                {/* Form card */}
                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onSubmit={handleSubmit}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl space-y-8"
                >
                    {/* ── Section 1: Personal Info ── */}
                    <div>
                        <h3 className="text-sm font-bold text-lavender-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                            <User className="w-4 h-4" /> Personal Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Field label="Full Name" required>
                                <Input
                                    icon={<User className="w-4 h-4" />}
                                    type="text"
                                    placeholder="Dr. Jane Smith"
                                    value={form.full_name}
                                    onChange={set('full_name')}
                                    required
                                />
                            </Field>
                            <Field label="Email Address" required>
                                <Input
                                    icon={<Mail className="w-4 h-4" />}
                                    type="email"
                                    placeholder="jane@example.com"
                                    value={form.email}
                                    onChange={set('email')}
                                    required
                                />
                            </Field>
                            <Field label="Phone Number" required>
                                <Input
                                    icon={<Phone className="w-4 h-4" />}
                                    type="tel"
                                    placeholder="+91 98765 43210"
                                    value={form.phone}
                                    onChange={set('phone')}
                                    required
                                />
                            </Field>
                        </div>
                    </div>

                    {/* ── Section 2: Professional Details ── */}
                    <div>
                        <h3 className="text-sm font-bold text-lavender-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                            <Stethoscope className="w-4 h-4" /> Professional Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Field label="Qualification" required hint="e.g. M.Phil Clinical Psychology, MBBS">
                                <Input
                                    icon={<BookOpen className="w-4 h-4" />}
                                    type="text"
                                    placeholder="M.Phil Clinical Psychology"
                                    value={form.qualification}
                                    onChange={set('qualification')}
                                    required
                                />
                            </Field>
                            <Field label="Specialization" required hint="e.g. Anxiety, CBT, Trauma">
                                <Input
                                    icon={<Stethoscope className="w-4 h-4" />}
                                    type="text"
                                    placeholder="Anxiety, CBT, Trauma"
                                    value={form.specialization}
                                    onChange={set('specialization')}
                                    required
                                />
                            </Field>
                            <Field label="Years of Experience" required>
                                <Input
                                    type="number"
                                    placeholder="5"
                                    min="0"
                                    max="60"
                                    value={form.experience_years}
                                    onChange={set('experience_years')}
                                    required
                                />
                            </Field>
                            <Field label="License / Registration Number" required hint="Official license issued by your regulatory body">
                                <Input
                                    icon={<FileText className="w-4 h-4" />}
                                    type="text"
                                    placeholder="RCI/MH/2024/12345"
                                    value={form.license_number}
                                    onChange={set('license_number')}
                                    required
                                />
                            </Field>
                        </div>

                        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Field label="Available Timings" required hint="Days and hours you are available">
                                <Input
                                    icon={<Clock className="w-4 h-4" />}
                                    type="text"
                                    placeholder="Mon–Fri, 9AM–5PM"
                                    value={form.available_timings}
                                    onChange={set('available_timings')}
                                    required
                                />
                            </Field>
                            <Field label="Certificate / Document URL" hint="Optional: link to your certificate (Google Drive, etc.)">
                                <Input
                                    type="url"
                                    placeholder="https://drive.google.com/..."
                                    value={form.certificate_url}
                                    onChange={set('certificate_url')}
                                />
                            </Field>
                        </div>

                        <div className="mt-5">
                            <Field label="Bio / About" required hint="Tell patients about yourself, your approach, and how you help">
                                <Textarea
                                    rows={4}
                                    placeholder="I am a licensed clinical psychologist with 5+ years of experience specialising in anxiety and trauma. My approach combines CBT with mindfulness..."
                                    value={form.bio}
                                    onChange={set('bio')}
                                    required
                                />
                            </Field>
                        </div>
                    </div>

                    {/* ── Section 3: Account Credentials ── */}
                    <div>
                        <h3 className="text-sm font-bold text-lavender-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                            <Lock className="w-4 h-4" /> Account Credentials
                        </h3>
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-5 flex items-start gap-3">
                            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-300">
                                Your account will only be activated after admin approval. These credentials will be used when you log in after approval.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Field label="Password" required>
                                <div className="relative">
                                    <Input
                                        icon={<Lock className="w-4 h-4" />}
                                        type={showPw ? 'text' : 'password'}
                                        placeholder="Create a strong password"
                                        value={form.password}
                                        onChange={set('password')}
                                        required
                                        className="pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPw(p => !p)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-calm-400 hover:text-calm-200 transition-colors"
                                    >
                                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {/* Password strength indicators */}
                                {form.password && (
                                    <div className="mt-2 space-y-1">
                                        {pwRequirements.map(req => (
                                            <div key={req.label} className="flex items-center gap-2">
                                                <div className={cn(
                                                    'w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0',
                                                    req.test(form.password)
                                                        ? 'bg-emerald-500'
                                                        : 'bg-calm-700'
                                                )}>
                                                    {req.test(form.password) && (
                                                        <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                                                    )}
                                                </div>
                                                <span className={cn(
                                                    'text-xs',
                                                    req.test(form.password) ? 'text-emerald-400' : 'text-calm-500'
                                                )}>
                                                    {req.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Field>
                            <Field label="Confirm Password" required>
                                <div className="relative">
                                    <Input
                                        icon={<Lock className="w-4 h-4" />}
                                        type={showPw ? 'text' : 'password'}
                                        placeholder="Re-enter your password"
                                        value={form.confirm_password}
                                        onChange={set('confirm_password')}
                                        required
                                    />
                                </div>
                                {form.confirm_password && form.password !== form.confirm_password && (
                                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> Passwords do not match
                                    </p>
                                )}
                            </Field>
                        </div>
                    </div>

                    {/* ── Terms + Submit ── */}
                    <div className="space-y-5 pt-2">
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={agreedToTerms}
                                onChange={e => setAgreedToTerms(e.target.checked)}
                                className="mt-0.5 w-4 h-4 rounded border-calm-600 bg-calm-800 text-lavender-500 focus:ring-lavender-500/50 shrink-0"
                            />
                            <span className="text-sm text-calm-400 group-hover:text-calm-300 transition-colors leading-relaxed">
                                I confirm that all information provided is accurate and I agree to the{' '}
                                <Link to="/terms" className="text-lavender-400 hover:text-lavender-300 underline">
                                    Terms of Service
                                </Link>{' '}
                                and{' '}
                                <Link to="/privacy" className="text-lavender-400 hover:text-lavender-300 underline">
                                    Privacy Policy
                                </Link>
                                . I understand my account will only be activated after admin approval.
                            </span>
                        </label>

                        <button
                            type="submit"
                            disabled={isSubmitting || !agreedToTerms}
                            className={cn(
                                'w-full py-4 rounded-2xl font-bold text-white text-base',
                                'bg-gradient-to-r from-lavender-500 to-accent-500',
                                'shadow-lg shadow-lavender-500/25',
                                'transition-all duration-200',
                                'flex items-center justify-center gap-3',
                                (isSubmitting || !agreedToTerms)
                                    ? 'opacity-60 cursor-not-allowed'
                                    : 'hover:opacity-90 hover:shadow-lavender-500/40 hover:-translate-y-0.5'
                            )}
                        >
                            {isSubmitting ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Submitting Application…</>
                            ) : (
                                <><span>Submit Application</span><ChevronRight className="w-5 h-5" /></>
                            )}
                        </button>

                        <p className="text-center text-xs text-calm-500">
                            Already have a therapist account?{' '}
                            <Link to="/login" className="text-lavender-400 hover:text-lavender-300 font-medium transition-colors">
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </motion.form>
            </div>
        </div>
    );
};

export default TherapistApplyPage;
