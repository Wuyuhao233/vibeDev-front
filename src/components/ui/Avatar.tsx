import { useState } from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: number;
  className?: string;
}

const bgColors = [
  'bg-blue-500', 'bg-emerald-500', 'bg-violet-500',
  'bg-amber-500', 'bg-rose-500', 'bg-cyan-500',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getColorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % bgColors.length;
}

export default function Avatar({
  src,
  alt = '',
  name = '',
  size = 40,
  className = '',
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const showFallback = !src || imgError;

  return (
    <div
      className={`rounded-full overflow-hidden flex-shrink-0 ${showFallback ? bgColors[getColorIndex(name || alt)] + ' flex items-center justify-center' : ''} ${className}`}
      style={{ width: size, height: size }}
      title={name || alt}
    >
      {showFallback ? (
        <span className="text-white text-xs font-semibold">
          {name ? getInitials(name) : '?'}
        </span>
      ) : (
        <img
          src={src}
          alt={alt || name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      )}
    </div>
  );
}
