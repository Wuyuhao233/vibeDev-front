import { type ButtonHTMLAttributes, type ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 disabled:opacity-50',
  secondary:
    'bg-white text-primary-500 border border-primary-500 hover:bg-primary-50 active:bg-primary-50 disabled:opacity-50',
  danger:
    'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 disabled:opacity-50',
  ghost:
    'bg-transparent text-gray-500 hover:bg-gray-100 active:bg-gray-100 disabled:opacity-40',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-7 text-xs px-3',
  md: 'h-9 text-sm px-5',
  lg: 'h-11 text-base px-6',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${variantStyles[variant]} ${sizeStyles[size]} ${loading ? 'pointer-events-none opacity-50' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin-slow"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
