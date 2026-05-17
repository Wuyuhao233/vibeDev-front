import { useState, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui';
import LevelBadge from './ui/LevelBadge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import LikeButton from './LikeButton';
import ReportDialog from './ReportDialog';
import { toast } from './ui';
import { formatRelativeTime } from '../utils/relativeTime';

interface ReplyItemProps {
  id: string;
  postId: string;
  contentMarkdown: string;
  author: {
    id: string;
    username: string;
    nickname: string;
    avatarUrl: string | null;
    level: number;
    role: string;
  };
  depth: number;
  likeCount: number;
  isLikedByCurrentUser: boolean;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt?: string;
  currentUserId?: string | null;
  isModerator?: boolean;
  isAdmin?: boolean;
  onLikeChange?: (count: number, liked: boolean) => void;
  onReply?: () => void;
  onShare?: (replyId: string) => void;
  onEdit?: (replyId: string) => void;
  onDelete?: (replyId: string) => void;
  className?: string;
}

export default function ReplyItem({
  id,
  postId,
  contentMarkdown,
  author,
  depth,
  likeCount,
  isLikedByCurrentUser,
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
      <div className={`reply-item py-4 border-b border-border ${isDeleted ? 'opacity-60' : ''} ${className}`}>
        <div className="flex gap-3">
        <button
          onClick={() => window.location.hash = ''}
          className="flex-shrink-0"
          tabIndex={-1}
        >
          <Avatar
            size="sm"
            className="reply-item__avatar"
          >
            {author.avatarUrl && <AvatarImage src={author.avatarUrl} alt={author.username} />}
            <AvatarFallback>{author.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
          </Avatar>
        </button>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm font-medium text-foreground">{author.username}</span>
            <LevelBadge level={level} />
            <span className="text-xs text-muted-foreground">L{depth}</span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(createdAt)}
            </span>
            {wasEdited && (
              <span className="text-xs text-muted-foreground">（已编辑）</span>
            )}
          </div>

          {/* Content */}
          {isDeleted ? (
            <p className="text-sm text-muted-foreground italic">该回复已被删除</p>
          ) : (
            <div className="prose prose-sm max-w-none prose-p:text-foreground prose-a:text-primary prose-code:text-sm prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-foreground prose-pre:text-background prose-blockquote:border-l-primary">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {contentMarkdown}
              </ReactMarkdown>
            </div>
          )}

          {/* Actions */}
          {!isDeleted && (
            <div className="flex items-center gap-4 mt-2">
              <LikeButton
                targetType="reply"
                targetId={id}
                initialLiked={isLikedByCurrentUser}
                initialCount={likeCount}
                onCountChange={onLikeChange}
              />
              <button
                onClick={onReply}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors duration-150"
                aria-label="回复"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" />
                </svg>
                <span>引用</span>
              </button>

              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors duration-150"
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
                  className="text-sm text-muted-foreground hover:text-red-500 transition-colors duration-150"
                >
                  举报
                </button>
              )}
              {canEdit && onEdit && (
                <button
                  onClick={() => onEdit(id)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors duration-150"
                >
                  编辑
                </button>
              )}
              {canDelete && onDelete && (
                <button
                  onClick={() => onDelete(id)}
                  className="text-sm text-muted-foreground hover:text-red-500 transition-colors duration-150"
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
