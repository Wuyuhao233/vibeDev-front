import { type ReactNode, useState, useCallback } from 'react';
import Avatar from './ui/Avatar';
import LevelBadge from './ui/LevelBadge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import LikeButton from './LikeButton';
import ReportDialog from './ReportDialog';
import { toast } from './ui/Toast';
import { formatRelativeTime } from '../utils/relativeTime';

interface ReplyItemProps {
  id: number;
  postId: number;
  content: string;
  author: {
    id: number;
    username: string;
    avatar: string | null;
    level: number;
  };
  floorNumber: number;
  likeCount: number;
  isLiked: boolean;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt?: string;
  currentUserId?: number | null;
  isModerator?: boolean;
  isAdmin?: boolean;
  onLikeChange?: (count: number, liked: boolean) => void;
  onReply?: () => void;
  onShare?: (replyId: number) => void;
  onEdit?: (replyId: number) => void;
  onDelete?: (replyId: number) => void;
  className?: string;
}

export default function ReplyItem({
  id,
  postId,
  content,
  author,
  floorNumber,
  likeCount,
  isLiked,
  isDeleted,
  createdAt,
  updatedAt,
  currentUserId,
  isModerator,
  isAdmin,
  onLikeChange,
  onReply,
  onShare,
  onEdit,
  onDelete,
  className = '',
}: ReplyItemProps) {
  const canEdit = currentUserId === author.id;
  const canDelete = currentUserId === author.id || isModerator || isAdmin;
  const wasEdited = updatedAt && updatedAt !== createdAt;
  const level = Math.min(Math.max(author.level, 1), 6) as 1 | 2 | 3 | 4 | 5 | 6;
  const [shareCopied, setShareCopied] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/post/${postId}#reply-${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      toast.success('链接已复制');
      setTimeout(() => setShareCopied(false), 2000);
      onShare?.(id);
    } catch {
      toast.error('复制失败，请手动复制');
    }
  }, [postId, id, onShare]);

  return (
    <>
      <div className={`reply-item py-4 border-b border-gray-100 ${isDeleted ? 'opacity-60' : ''} ${className}`}>
        <div className="flex gap-3">
        <button
          onClick={() => window.location.hash = ''}
          className="flex-shrink-0"
          tabIndex={-1}
        >
          <Avatar
            src={author.avatar || undefined}
            name={author.username}
            size={40}
            className="reply-item__avatar"
          />
        </button>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm font-medium text-gray-900">{author.username}</span>
            <LevelBadge level={level} />
            <span className="text-xs text-gray-400">#{floorNumber}</span>
            <span className="text-xs text-gray-400">
              {formatRelativeTime(createdAt)}
            </span>
            {wasEdited && (
              <span className="text-xs text-gray-400">（已编辑）</span>
            )}
          </div>

          {/* Content */}
          {isDeleted ? (
            <p className="text-sm text-gray-400 italic">该回复已被删除</p>
          ) : (
            <div className="prose prose-sm max-w-none prose-p:text-gray-700 prose-a:text-primary-500 prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-blockquote:border-l-primary-500">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          )}

          {/* Actions */}
          {!isDeleted && (
            <div className="flex items-center gap-4 mt-2">
              <LikeButton
                targetType="reply"
                targetId={id}
                initialLiked={isLiked}
                initialCount={likeCount}
                onCountChange={onLikeChange}
              />
              <button
                onClick={onReply}
                className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-primary-500 transition-colors duration-150"
                aria-label="回复"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" />
                </svg>
                <span>引用</span>
              </button>

              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-primary-500 transition-colors duration-150"
                aria-label={shareCopied ? '已复制' : '分享'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{shareCopied ? '已复制' : '分享'}</span>
              </button>

              {currentUserId && currentUserId !== author.id && (
                <button
                  onClick={() => setReportOpen(true)}
                  className="text-sm text-gray-400 hover:text-red-500 transition-colors duration-150"
                >
                  举报
                </button>
              )}
              {canEdit && onEdit && (
                <button
                  onClick={() => onEdit(id)}
                  className="text-sm text-gray-400 hover:text-primary-500 transition-colors duration-150"
                >
                  编辑
                </button>
              )}
              {canDelete && onDelete && (
                <button
                  onClick={() => onDelete(id)}
                  className="text-sm text-gray-400 hover:text-red-500 transition-colors duration-150"
                >
                  删除
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
      <ReportDialog
        open={reportOpen}
        targetType="reply"
        targetId={id}
        onClose={() => setReportOpen(false)}
      />
    </>
  );
}
