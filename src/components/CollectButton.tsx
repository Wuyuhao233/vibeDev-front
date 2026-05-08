import { useState, useCallback } from 'react';
import { collectPost, uncollectPost } from '../api/post';
import { addToFolder } from '../api/collection';
import { toast } from './ui';
import FolderSelector from './FolderSelector';

interface CollectButtonProps {
  postId: string;
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
  const [folderSelectorOpen, setFolderSelectorOpen] = useState(false);

  const handleToggle = useCallback(async () => {
    if (loading) return;

    if (collected) {
      // Uncollect
      setLoading(true);
      const prevCount = count;
      setCollected(false);
      setCount(prevCount - 1);
      onCountChange?.(prevCount - 1, false);

      try {
        await uncollectPost(postId);
      } catch (err: any) {
        setCollected(true);
        setCount(prevCount);
        onCountChange?.(prevCount, true);
        toast.error(err?.message || '操作失败，请重试');
      } finally {
        setLoading(false);
      }
    } else {
      // Collect — open folder selector
      setFolderSelectorOpen(true);
    }
  }, [loading, collected, count, postId, onCountChange]);

  const handleFolderSelect = useCallback(
    async (folderId: string, folderName: string) => {
      setFolderSelectorOpen(false);
      setLoading(true);
      const prevCount = count;
      setCollected(true);
      setCount(prevCount + 1);
      onCountChange?.(prevCount + 1, true);

      try {
        if (!folderId) {
          // Default favorites (no folder)
          await collectPost(postId);
        } else {
          await collectPost(postId, folderId);
        }
        toast.success(!folderId ? '已收藏' : `已收藏到「${folderName}」`);
      } catch (err: any) {
        setCollected(false);
        setCount(prevCount);
        onCountChange?.(prevCount, false);
        toast.error(err?.message || '操作失败，请重试');
      } finally {
        setLoading(false);
      }
    },
    [collected, count, postId, onCountChange],
  );

  return (
    <div className="relative inline-flex">
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
      <FolderSelector
        open={folderSelectorOpen}
        onSelect={handleFolderSelect}
        onClose={() => setFolderSelectorOpen(false)}
      />
    </div>
  );
}
