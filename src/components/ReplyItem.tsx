import { useState, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui';
import { addLike, removeLike } from '../api/like';
import type { Reply } from '../api/reply';
import ReportDialog from './ReportDialog';
import ViewRepliesDialog from './ViewRepliesDialog';
import { toast } from './ui';
import { formatRelativeTime } from '../utils/relativeTime';
import { normalizeImageUrl } from '../utils/imageUrl';
import { ReplyContent } from '../utils/replyContent';

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
  likeCount: number;
  isLikedByCurrentUser: boolean;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt?: string;
  currentUserId?: string | null;
  isModerator?: boolean;
  isAdmin?: boolean;
  /** Post author's user ID, for showing "作者" badge */
  postAuthorId?: string | null;
  /** Child replies to render inline in gray area */
  childReplies?: Reply[];
  onLikeChange?: (count: number, liked: boolean) => void;
  onReply?: () => void;
  onReplyToChild?: (replyId: string) => void;
  onEdit?: (replyId: string) => void;
  onDelete?: (replyId: string) => void;
  className?: string;
}

export default function ReplyItem({
  id,
  postId,
  contentMarkdown,
  author,
  likeCount,
  isLikedByCurrentUser,
  isDeleted,
  createdAt,
  updatedAt,
  currentUserId,
  isModerator,
  isAdmin,
  postAuthorId,
  childReplies,
  onLikeChange,
  onReply,
  onReplyToChild,
  onEdit,
  onDelete,
  className = '',
}: ReplyItemProps) {
  const canEdit = currentUserId === author.id;
  const canDelete = currentUserId === author.id || isModerator || isAdmin;
  const isPostAuthor = postAuthorId === author.id;
  const [reportOpen, setReportOpen] = useState(false);

  // Inline like state (replaces LikeButton component)
  const [liked, setLiked] = useState(isLikedByCurrentUser);
  const [likeCountState, setLikeCountState] = useState(likeCount);
  const [likeLoading, setLikeLoading] = useState(false);

  const handleLikeToggle = useCallback(async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    const prevLiked = liked;
    const prevCount = likeCountState;
    const newLiked = !liked;
    const newCount = liked ? likeCountState - 1 : likeCountState + 1;
    setLiked(newLiked);
    setLikeCountState(newCount);
    onLikeChange?.(newCount, newLiked);
    try {
      if (newLiked) {
        await addLike('reply', id);
      } else {
        await removeLike('reply', id);
      }
    } catch {
      setLiked(prevLiked);
      setLikeCountState(prevCount);
      onLikeChange?.(prevCount, prevLiked);
      toast.error('操作失败，请重试');
    } finally {
      setLikeLoading(false);
    }
  }, [likeLoading, liked, likeCountState, id, onLikeChange]);

  return (
    <>
      <div className={`reply-item group/reply-item py-3 ${isDeleted ? 'opacity-60' : ''} ${className}`}>
        {/* Left-right layout: avatar left, content right */}
        <div className="flex gap-3">
          {/* Left: Avatar only */}
          <Avatar size="sm" className="flex-shrink-0">
            {author.avatarUrl && <AvatarImage src={normalizeImageUrl(author.avatarUrl)} alt={author.username} />}
            <AvatarFallback>{author.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
          </Avatar>

          {/* Right: content area */}
          <div className="flex-1 min-w-0">
            {/* Row 1: nickname + author badge + time */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-foreground">
                {author.nickname || author.username}
              </span>
              {isPostAuthor && (
                <span className="inline-flex items-center rounded-sm px-1 py-px text-[10px] font-medium text-blue-500 bg-blue-50">
                  作者
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(createdAt)}
              </span>
            </div>

            {/* Row 2: Reply content */}
            {isDeleted ? (
              <p className="text-sm text-muted-foreground italic">该回复已被删除</p>
            ) : (
              <div className="text-sm text-foreground leading-relaxed">
                <ReplyContent markdown={contentMarkdown} />
              </div>
            )}

            {/* Row 3: Child replies in gray area */}
            {!isDeleted && childReplies && childReplies.length > 0 && (
              <div className="mt-2 bg-reply-bg rounded-lg p-2.5 space-y-2">
                {childReplies.map((child) => (
                  <ChildReplyItem
                    key={child.id}
                    reply={child}
                    parentReply={{
                      id,
                      contentMarkdown,
                      author,
                      createdAt,
                      isDeleted,
                      likeCount: likeCountState,
                    }}
                    allChildReplies={childReplies}
                    postId={postId}
                    currentUserId={currentUserId}
                    postAuthorId={postAuthorId}
                    onReply={() => onReplyToChild?.(child.id)}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    isModerator={isModerator}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            )}

            {/* Row 4: Action bar — reply + like + report (hover only) */}
            {!isDeleted && (
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <button
                  onClick={onReply}
                  className="inline-flex items-center gap-1 hover:text-primary transition-colors duration-150"
                  aria-label="回复"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>回复</span>
                </button>

                <button
                  onClick={handleLikeToggle}
                  disabled={likeLoading}
                  className={`inline-flex items-center gap-1 transition-colors duration-150 ${
                    liked ? 'text-like' : 'hover:text-like'
                  }`}
                  aria-label={liked ? '取消点赞' : '点赞'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <span>{likeCountState}</span>
                </button>

                {/* Report — only shows on hover */}
                {currentUserId && currentUserId !== author.id && (
                  <button
                    onClick={() => setReportOpen(true)}
                    className="inline-flex items-center gap-1 opacity-0 group-hover/reply-item:opacity-100 hover:text-foreground transition-all duration-150"
                    aria-label="举报"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                      <line x1="4" y1="22" x2="4" y2="15" />
                    </svg>
                    <span>举报</span>
                  </button>
                )}

                {/* Edit/Delete — only shows on hover, for the reply author */}
                {(canEdit || canDelete) && (
                  <div className="relative inline-flex opacity-0 group-hover/reply-item:opacity-100 transition-all duration-150">
                    {canEdit && onEdit && (
                      <button
                        onClick={() => onEdit(id)}
                        className="inline-flex items-center gap-1 hover:text-primary transition-colors duration-150"
                        aria-label="编辑"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    )}
                    {canDelete && onDelete && (
                      <button
                        onClick={() => onDelete(id)}
                        className="inline-flex items-center gap-1 hover:text-red-500 transition-colors duration-150 ml-2"
                        aria-label="删除"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    )}
                  </div>
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

/** Count total replies recursively */
function countChildReplies(replies?: Reply[]): number {
  if (!replies) return 0;
  let count = 0;
  for (const r of replies) {
    count += 1;
    if (r.childReplies?.length) count += countChildReplies(r.childReplies);
  }
  return count;
}

/** Compact child reply — nickname only (no avatar), click to view sub-replies */
function ChildReplyItem({
  reply,
  parentReply,
  allChildReplies,
  postId,
  currentUserId,
  postAuthorId,
  isModerator,
  isAdmin,
  onReply,
  onEdit,
  onDelete,
}: {
  reply: Reply;
  parentReply: {
    id: string;
    contentMarkdown: string;
    author: Reply['author'];
    createdAt: string;
    isDeleted?: boolean;
    likeCount?: number;
  };
  allChildReplies: Reply[];
  postId: string;
  currentUserId?: string | null;
  postAuthorId?: string | null;
  isModerator?: boolean;
  isAdmin?: boolean;
  onReply: () => void;
  onEdit?: (replyId: string) => void;
  onDelete?: (replyId: string) => void;
}) {
  const isPostAuthor = postAuthorId === reply.author.id;
  const [viewRepliesOpen, setViewRepliesOpen] = useState(false);
  const hasChildReplies = reply.childReplies && reply.childReplies.length > 0;

  if (reply.isDeleted) {
    return (
      <div className="text-xs text-muted-foreground italic py-1">该回复已被删除</div>
    );
  }

  return (
    <>
      <div
        className="py-1.5 cursor-pointer"
        onClick={() => setViewRepliesOpen(true)}
      >
        {/* Nickname + author badge + time */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-xs font-semibold text-foreground">
            {reply.author.nickname || reply.author.username}
          </span>
          {isPostAuthor && (
            <span className="inline-flex items-center rounded-sm px-1 py-px text-[9px] font-medium text-blue-500 bg-blue-50">
              作者
            </span>
          )}
          <span className="text-[11px] text-muted-foreground">
            {formatRelativeTime(reply.createdAt)}
          </span>
          {hasChildReplies && (
            <span className="text-[11px] text-primary font-medium ml-1">
              查看回复({countChildReplies(reply.childReplies)})
            </span>
          )}
        </div>

        {/* Content */}
        <div className="text-xs text-foreground leading-relaxed">
          <ReplyContent markdown={reply.contentMarkdown} />
        </div>
      </div>
      <ViewRepliesDialog
        open={viewRepliesOpen}
        onClose={() => setViewRepliesOpen(false)}
        parentReply={parentReply}
        currentReply={reply}
        allChildReplies={allChildReplies}
        postId={postId}
        currentUserId={currentUserId}
        postAuthorId={postAuthorId}
        isModerator={isModerator}
        isAdmin={isAdmin}
        onReply={onReply}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </>
  );
}
