import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  hover = true,
  gradient = false,
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'bg-white/80 dark:bg-calm-900/80',
        'backdrop-blur-xl backdrop-saturate-150',
        'border border-white/20 dark:border-white/10',
        'shadow-glass dark:shadow-glassDark',
        'transition-all duration-300',
        hover && 'cursor-pointer',
        className
      )}
      {...props}
    >
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-br from-lavender-500/10 via-transparent to-primary-500/10 pointer-events-none" />
      )}
      <div className={cn('relative z-10', className?.includes('flex') && 'flex-1 flex flex-col min-h-0')}>
        {children}
      </div>
    </motion.div>
  );
};

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className,
  disabled,
  ...props
}) => {
  const variants = {
    primary:
      'bg-gradient-to-r from-lavender-600 to-accent-600 text-white shadow-glow hover:shadow-glowLg',
    secondary:
      'bg-gradient-to-r from-primary-500 to-cyan-500 text-white shadow-lg hover:shadow-xl',
    accent:
      'bg-gradient-to-r from-coral-500 to-amber-500 text-white shadow-lg hover:shadow-xl',
    ghost:
      'bg-transparent dark:bg-white/5 text-calm-700 dark:text-calm-200 border border-calm-200 dark:border-calm-700 hover:bg-calm-100 dark:hover:bg-calm-800',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 rounded-xl font-semibold',
        'transition-all duration-300 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lavender-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {!loading && icon}
      {children}
    </motion.button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const GlassInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-calm-700 dark:text-calm-300">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-calm-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full rounded-xl px-4 py-3',
              'bg-white/60 dark:bg-calm-900/60',
              'backdrop-blur-xl',
              'border border-calm-200 dark:border-calm-700',
              'text-calm-900 dark:text-white',
              'placeholder:text-calm-400',
              'focus:outline-none focus:ring-2 focus:ring-lavender-500/50 focus:border-lavender-500',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              icon && 'pl-12',
              error && 'border-coral-500 focus:ring-coral-500/50',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-coral-500"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  className?: string;
}

export const GlassTextarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-calm-700 dark:text-calm-300">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full rounded-xl px-4 py-3',
            'bg-white/60 dark:bg-calm-900/60',
            'backdrop-blur-xl',
            'border border-calm-200 dark:border-calm-700',
            'text-calm-900 dark:text-white',
            'placeholder:text-calm-400',
            'focus:outline-none focus:ring-2 focus:ring-lavender-500/50 focus:border-lavender-500',
            'transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'resize-none',
            error && 'border-coral-500 focus:ring-coral-500/50',
            className
          )}
          {...props}
        />
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-coral-500"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

GlassTextarea.displayName = 'GlassTextarea';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
  className?: string;
}

export const GlassSelect = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-calm-700 dark:text-calm-300">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full rounded-xl px-4 py-3',
            'bg-white/60 dark:bg-calm-900/60',
            'backdrop-blur-xl',
            'border border-calm-200 dark:border-calm-700',
            'text-calm-900 dark:text-white',
            'focus:outline-none focus:ring-2 focus:ring-lavender-500/50 focus:border-lavender-500',
            'transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'appearance-none cursor-pointer',
            error && 'border-coral-500 focus:ring-coral-500/50',
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-coral-500"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

GlassSelect.displayName = 'GlassSelect';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
}) => {
  const variants = {
    primary: 'bg-lavender-100 text-lavender-700 dark:bg-lavender-900/30 dark:text-lavender-300',
    secondary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
    success: 'bg-mint-100 text-mint-700 dark:bg-mint-900/30 dark:text-mint-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    error: 'bg-coral-100 text-coral-700 dark:bg-coral-900/30 dark:text-coral-300',
    info: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
};

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-calm-200 dark:bg-calm-700',
        className
      )}
    />
  );
};

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  size = 'md',
  className,
}) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden',
        'bg-gradient-to-br from-lavender-500 to-accent-500',
        'flex items-center justify-center',
        sizes[size],
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-white font-semibold text-sm">
          {alt?.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
};

export const Divider: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        'h-px bg-gradient-to-r from-transparent via-calm-300 dark:via-calm-600 to-transparent',
        className
      )}
    />
  );
};

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  className,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size}>
        <circle
          className="text-calm-200 dark:text-calm-700"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-lavender-500 transition-all duration-500"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-calm-800 dark:text-white">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
};
