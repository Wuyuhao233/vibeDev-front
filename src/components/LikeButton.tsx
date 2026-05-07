import { useState, useCallback, useRef } from 'react';
import { addLike, removeLike } from '../api/like';
import { toast } from './ui/Toast';

interface LikeButtonProps {
  targetType: 'post' | 'reply';
  targetId: number;
  initialLiked: boolean;
  initialCount: number;
  onCountChange?: (count: number, liked: boolean) => void;
  className?: string;
}

const HEART_ANIMATION = `
@keyframes heartPop {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.3); }
  100% { transform: scale(1); }
}
.heart-pop {
  animation: heartPop 200ms ease;
}
`;

const COOLDOWN_MS = 300;

export default function LikeButton({
  targetType,
  targetId,
  initialLiked,
  initialCount,
  onCountChange,
  className = '',
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);
  const cooldownRef = useRef(false);

  const handleToggle = useCallback(async () => {
    if (loading || cooldownRef.current) return;

    cooldownRef.current = true;
    setTimeout(() => { cooldownRef.current = false; }, COOLDOWN_MS);

    setLoading(true);
    const prevLiked = liked;
    const prevCount = count;
    const newLiked = !liked;
    const newCount = liked ? count - 1 : count + 1;
    setLiked(newLiked);
    setCount(newCount);
    onCountChange?.(newCount, newLiked);

    if (newLiked) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 200);
    }

    try {
      if (newLiked) {
        await addLike(targetType, targetId);
      } else {
        await removeLike(targetType, targetId);
      }
    } catch (err: any) {
      setLiked(prevLiked);
      setCount(prevCount);
      onCountChange?.(prevCount, prevLiked);
      toast.error(err?.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [loading, liked, count, targetType, targetId, onCountChange]);

  return (
    <>
      <style>{HEART_ANIMATION}</style>
      <button
        onClick={handleToggle}
        disabled={loading}
        aria-label={`${liked ? '取消点赞' : '点赞'} (${count})`}
        className={`inline-flex items-center gap-1 text-sm transition-colors duration-150 ${
          liked
            ? 'text-like'
            : 'text-gray-400 hover:text-like'
        } ${className}`}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill={liked ? 'currentColor' : 'none'}
          className={`flex-shrink-0 ${animating ? 'heart-pop' : ''}`}
        >
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" strokeWidth="2" />
        </svg>
        <span>{count}</span>
      </button>
    </>
  );
}
