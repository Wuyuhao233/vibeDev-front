type SpinnerSize = 'sm' | 'md' | 'lg';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  text?: string;
  className?: string;
}

const sizeMap: Record<SpinnerSize, string> = {
  sm: '14px',
  md: '16px',
  lg: '24px',
};

export default function LoadingSpinner({
  size = 'md',
  text,
  className = '',
}: LoadingSpinnerProps) {
  const px = sizeMap[size];
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        className="animate-spin-slow text-primary-500"
        width={px}
        height={px}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      {text && <span className="text-sm text-gray-500">{text}</span>}
    </div>
  );
}
