// src/components/ui/Button.tsx
import { ReactNode, ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const MotionButton: any = motion.button;

type Variant = 'primary' | 'secondary' | 'ghost' | 'text' | 'outlined';
type Size = 'sm' | 'md' | 'lg' | 'small';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  loading?: boolean;
  className?: string;
  color?: 'default' | 'error' | 'primary';
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  className = '',
  color = 'default',
  ...props
}: ButtonProps) {
  // normalize size alias
  const normSize = size === 'small' ? 'sm' : size;

  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 material-elevation-1 animate-ripple';
  const variantClasses: Record<Variant, string> = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300',
    text: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
    outlined: 'bg-transparent border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800',
  };

  // color overrides (simple)
  const colorClasses =
    color === 'error'
      ? 'text-white bg-red-600 hover:bg-red-700'
      : color === 'primary' && variant === 'secondary'
      ? 'text-white bg-blue-600 hover:bg-blue-700'
      : '';

  const sizeClasses: Record<string, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <MotionButton
      {...props}
      className={clsx(base, variantClasses[variant], colorClasses, sizeClasses[normSize] ?? sizeClasses.md, className)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      disabled={loading || props.disabled}
    >
      {loading && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />}
      {children}
    </MotionButton>
  );
}
