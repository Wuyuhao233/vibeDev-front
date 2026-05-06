interface SkeletonProps {
  variant?: 'post-card' | 'profile' | 'table-row' | 'text' | 'circle';
  width?: string;
  height?: string;
  rows?: number;
  className?: string;
}

export default function Skeleton({
  variant = 'text',
  width,
  height,
  rows = 1,
  className = '',
}: SkeletonProps) {
  const baseClass = 'animate-shimmer rounded-md bg-gray-200';

  if (variant === 'circle') {
    const size = width || '40px';
    return (
      <div
        className={`${baseClass} rounded-full ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  if (variant === 'post-card') {
    return (
      <div className={`p-4 bg-white rounded-lg shadow-card ${className}`}>
        <div className={`${baseClass} w-3/5 h-4 mb-3`} />
        <div className={`${baseClass} w-full h-3.5 mb-2`} />
        <div className={`${baseClass} w-3/5 h-3.5 mb-4`} />
        <div className="flex items-center gap-3">
          <div className={`${baseClass} rounded-full w-7 h-7`} />
          <div className={`${baseClass} w-[60px] h-3.5`} />
          <div className={`${baseClass} w-[80px] h-3.5`} />
        </div>
        <div className="flex gap-2 mt-3">
          <div className={`${baseClass} w-12 h-[22px]`} />
          <div className={`${baseClass} w-12 h-[22px]`} />
          <div className={`${baseClass} w-12 h-[22px]`} />
        </div>
      </div>
    );
  }

  if (variant === 'profile') {
    return (
      <div className={`flex flex-col items-center gap-4 p-6 ${className}`}>
        <div className={`${baseClass} rounded-full w-16 h-16`} />
        <div className={`${baseClass} w-[200px] h-6`} />
        <div className={`${baseClass} w-[300px] h-4`} />
        <div className={`${baseClass} w-full h-9 mt-2`} />
      </div>
    );
  }

  if (variant === 'table-row') {
    return (
      <div className={`flex flex-col gap-3 ${className}`}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <div
                key={j}
                className={`${baseClass} h-3.5`}
                style={{ width: `${40 + Math.random() * 40}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClass} ${className}`}
      style={{ width: width || '100%', height: height || '1rem' }}
    />
  );
}
