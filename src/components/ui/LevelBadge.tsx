interface LevelBadgeProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}

const levelStyles: Record<number, string> = {
  1: 'bg-gray-400 text-white',
  2: 'bg-gray-500 text-white',
  3: 'bg-blue-500 text-white',
  4: 'bg-violet-500 text-white',
  5: 'bg-amber-500 text-white',
  6: 'bg-red-500 text-white',
};

export default function LevelBadge({ level, className = '' }: LevelBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-sm px-1.5 py-px text-[11px] font-medium leading-[1.4] ${levelStyles[level] || levelStyles[1]} ${className}`}
    >
      Lv.{level}
    </span>
  );
}
