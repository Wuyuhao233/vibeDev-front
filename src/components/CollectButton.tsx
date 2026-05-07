import { useState, useCallback } from 'react';
import { addFavorite, removeFavorite } from '../api/favorite';
import { toast } from './ui/Toast';

interface CollectButtonProps {
  postId: number;
  initialCollected: boolean;
  initialCount: number;
  onCountChange?: (count: number, collected: boolean) => void;
  className?: string;
}

export default function CollectButton({
  postId,
  initialCollected,
  initialCount,
  onCountChange,
  className = '',
}: CollectButtonProps) {
  const [collected, setCollected] = useState(initialCollected);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleToggle = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    const prevCollected = collected;
    const prevCount = count;
    const newCollected = !collected;
    const newCount = collected ? count - 1 : count + 1;
    setCollected(newCollected);
    setCount(newCount);
    onCountChange?.(newCount, newCollected);

    try {
      if (newCollected) {
        await addFavorite(postId);
      } else {
        await removeFavorite(postId);
      }
    } catch (err: any) {
      setCollected(prevCollected);
      setCount(prevCount);
      onCountChange?.(prevCount, prevCollected);
      toast.error(err?.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [loading, collected, count, postId, onCountChange]);

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      aria-label={`${collected ? '取消收藏' : '收藏'} (${count})`}
      className={`inline-flex items-center gap-1 text-sm transition-colors duration-150 ${
        collected
          ? 'text-collect'
          : 'text-gray-400 hover:text-collect'
      } ${className}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill={collected ? 'currentColor' : 'none'} className="flex-shrink-0">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="currentColor" strokeWidth="2" />
      </svg>
      <span>{count}</span>
    </button>
  );
}
