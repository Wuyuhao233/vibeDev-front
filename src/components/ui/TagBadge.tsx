import { type ReactNode } from 'react';

interface TagBadgeProps {
  children: ReactNode;
  variant?: 'default' | 'status-success' | 'status-warning' | 'status-error' | 'status-archived';
  onClose?: () => void;
  className?: string;
}

const variantStyles: Record<string, string> = {
  default: 'bg-gray-100 text-gray-500',
  'status-success': 'bg-emerald-50 text-emerald-500',
  'status-warning': 'bg-amber-50 text-amber-800',
  'status-error': 'bg-red-50 text-red-500',
  'status-archived': 'bg-gray-100 text-gray-400',
};

export default function TagBadge({
  children,
  variant = 'default',
  onClose,
  className = '',
}: TagBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
      {onClose && (
        <button
          onClick={onClose}
          className="ml-0.5 hover:opacity-70 transition-opacity"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      )}
    </span>
  );
}
