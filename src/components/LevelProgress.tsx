import { LevelBadge } from './ui';

const LEVEL_THRESHOLDS: { level: 1 | 2 | 3 | 4 | 5 | 6; min: number }[] = [
  { level: 1, min: 0 },
  { level: 2, min: 100 },
  { level: 3, min: 300 },
  { level: 4, min: 1000 },
  { level: 5, min: 3000 },
  { level: 6, min: 10000 },
];

const LEVEL_MAX = 99999;

function getLevelInfo(points: number) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i].min) {
      const current = LEVEL_THRESHOLDS[i];
      const next = LEVEL_THRESHOLDS[i + 1];
      const nextMin = next ? next.min : LEVEL_MAX;
      const progress = next
        ? Math.round(((points - current.min) / (nextMin - current.min)) * 100)
        : 100;
      return {
        level: current.level,
        currentPoints: points,
        nextLevelPoints: nextMin,
        progress: Math.min(progress, 100),
        isMax: !next,
      };
    }
  }
  return { level: 1 as const, currentPoints: points, nextLevelPoints: 100, progress: 0, isMax: false };
}

interface LevelProgressProps {
  points: number;
  className?: string;
}

export default function LevelProgress({ points, className = '' }: LevelProgressProps) {
  const info = getLevelInfo(points);

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <LevelBadge level={info.level} />
        <span className="text-sm text-gray-600">
          {info.isMax
            ? '已达到最高等级'
            : `${info.currentPoints} / ${info.nextLevelPoints} 积分`}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 rounded-full transition-all duration-300"
          style={{ width: `${info.progress}%` }}
        />
      </div>
      {!info.isMax && (
        <p className="text-xs text-gray-400 mt-1">
          还需 {info.nextLevelPoints - info.currentPoints} 积分升级到 Lv.{info.level + 1}
        </p>
      )}
    </div>
  );
}
