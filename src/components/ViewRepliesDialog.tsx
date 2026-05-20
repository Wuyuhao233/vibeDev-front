import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from './ui';
import { Avatar, AvatarFallback, AvatarImage } from './ui';
import { addLike, removeLike } from '../api/like';
import type { Reply } from '../api/reply';
import ReportDialog from './ReportDialog';
import { toast } from './ui';
import { formatRelativeTime } from '../utils/relativeTime';
import { normalizeImageUrl } from '../utils/imageUrl';
import { ReplyContent } from '../utils/replyContent';

type SortMode = 'hot' | 'newest' | 'oldest';

interface ViewRepliesDialogProps {
  open: boolean;
  onClose: () => void;
  /** The parent reply for context (shown at top) */
  parentReply: {
    id: string;
    contentMarkdown: string;
    author: Reply['author'];
    createdAt: string;
    isDeleted?: boolean;
    likeCount?: number;
  };
  /** The clicked child reply */
  currentReply: Reply;
  /** All child replies of the parent — shown in the dialog */
  allChildReplies: Reply[];
  postId: string;
  currentUserId?: string | null;
  postAuthorId?: string | null;
  isModerator?: boolean;
  isAdmin?: boolean;
  onReply?: (replyId: string) => void;
  onEdit?: (replyId: string) => void;
  onDelete?: (replyId: string) => void;
}

/** Count total replies recursively */
function countReplies(replies: Reply[]): number {
  let count = 0;
  for (const r of replies) {
    count += 1;
    if (r.childReplies?.length) {
      count += countReplies(r.childReplies);
    }
  }
  return count;
}

function sortChildReplies(replies: Reply[], mode: SortMode): Reply[] {
  const sorted = [...replies];
  switch (mode) {
    case 'hot':
      sorted.sort((a, b) => b.likeCount - a.likeCount);
      break;
    case 'newest':
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case 'oldest':
      sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      break;
  }
  // Recursively sort child replies
  return sorted.map((r) => ({
    ...r,
    childReplies: r.childReplies?.length
      ? sortChildReplies(r.childReplies, mode)
      : r.childReplies,
  }));
}

export default function ViewRepliesDialog({
  open,
  onClose,
  parentReply,
  currentReply,
  allChildReplies,
  postId,
  currentUserId,
  postAuthorId,
  isModerator,
  isAdmin,
  onReply,
  onEdit,
  onDelete,
}: ViewRepliesDialogProps) {
  const children = allChildReplies || [];
  const totalCount = children.length > 0 ? countReplies(children) : 0;
  const [sortMode, setSortMode] = useState<SortMode>('hot');
  const sorted = children.length > 0 ? sortChildReplies(children, sortMode) : [];

  // Build replyId → authorName map for looking up "回复 @xxx"
  const authorMap = new Map<string, string>();
  function buildAuthorMap(replies: Reply[]) {
    for (const r of replies) {
      authorMap.set(r.id, r.author.nickname || r.author.username);
      if (r.childReplies?.length) buildAuthorMap(r.childReplies);
    }
  }
  buildAuthorMap(children);
  // Also add parent
  authorMap.set(parentReply.id, parentReply.author.nickname || parentReply.author.username);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="sm:max-w-lg max-h-[70vh] flex flex-col p-0"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-border/50">
          <DialogTitle className="text-base font-semibold text-foreground">
            查看回复{totalCount > 0 ? `(${totalCount})` : ''}
          </DialogTitle>
          {children.length > 0 && (
            <div className="flex items-center gap-3 text-xs">
              {(['hot', 'newest', 'oldest'] as const).map((mode) => {
                const labels = { hot: '最热', newest: '最新', oldest: '最早' };
                const active = sortMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setSortMode(mode)}
                    className={`transition-colors duration-150 ${
                      active ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'
                    }`
                  }
                  >
                    {labels[mode]}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0">
          {/* Parent reply — independent card */}
          <ParentReplyCard
            reply={parentReply}
            postAuthorId={postAuthorId}
            childCount={children.length}
          />

          {/* All child replies — nested with indentation */}
          {sorted.length > 0 && sorted.map((reply) => (
            <NestedReplyItem
              key={reply.id}
              reply={reply}
              postId={postId}
              currentUserId={currentUserId}
              postAuthorId={postAuthorId}
              isModerator={isModerator}
              isAdmin={isAdmin}
              parentReplyId={parentReply.id}
              authorMap={authorMap}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              depth={1}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Parent reply shown at top of dialog as independent card */
function ParentReplyCard({
  reply,
  postAuthorId,
  childCount,
}: {
  reply: {
    id: string;
    contentMarkdown: string;
    author: Reply['author'];
    createdAt: string;
    isDeleted?: boolean;
    likeCount?: number;
  };
  postAuthorId?: string | null;
  childCount: number;
}) {
  return (
    <div className="py-3">
      <div className="flex gap-3">
        <Avatar size="sm" className="flex-shrink-0">
          {reply.author.avatarUrl && <AvatarImage src={normalizeImageUrl(reply.author.avatarUrl)} alt={reply.author.username} />}
          <AvatarFallback>{reply.author.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          {/* Row 1: nickname + author badge + time */}
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm font-semibold text-foreground">
              {reply.author.nickname || reply.author.username}
            </span>
            {postAuthorId === reply.author.id && (
              <span className="inline-flex items-center rounded-sm px-1 py-px text-[10px] font-medium text-blue-500 bg-blue-50">
                作者
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(reply.createdAt)}
            </span>
          </div>
          {/* Row 2: content */}
          {reply.isDeleted ? (
            <p className="text-sm text-muted-foreground italic">该回复已被删除</p>
          ) : (
            <div className="text-sm text-foreground leading-relaxed">
              <ReplyContent markdown={reply.contentMarkdown} />
            </div>
          )}
          {/* Row 3: action bar */}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {childCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {reply.likeCount ?? 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Nested reply item with recursive child rendering */
function NestedReplyItem({
  reply,
  postId,
  currentUserId,
  postAuthorId,
  isModerator,
  isAdmin,
  parentReplyId,
  authorMap,
  onReply,
  onEdit,
  onDelete,
  depth = 1,
}: {
  reply: Reply;
  postId: string;
  currentUserId?: string | null;
  postAuthorId?: string | null;
  isModerator?: boolean;
  isAdmin?: boolean;
  parentReplyId?: string;
  authorMap?: Map<string, string>;
  onReply?: (replyId: string) => void;
  onEdit?: (replyId: string) => void;
  onDelete?: (replyId: string) => void;
  depth?: number;
}) {
  const canEdit = currentUserId === reply.author.id;
  const canDelete = currentUserId === reply.author.id || isModerator || isAdmin;
  const isPostAuthor = postAuthorId === reply.author.id;
  // Show "回复 @xxx" only when replying to another child reply (not directly to parent)
  const showReplyTo = !!reply.parentReplyId && reply.parentReplyId !== parentReplyId;
  const [reportOpen, setReportOpen] = useState(false);

  const [liked, setLiked] = useState(reply.isLikedByCurrentUser);
  const [likeCountState, setLikeCountState] = useState(reply.likeCount);
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
    try {
      if (newLiked) {
        await addLike('reply', reply.id);
      } else {
        await removeLike('reply', reply.id);
      }
    } catch {
      setLiked(prevLiked);
      setLikeCountState(prevCount);
      toast.error('操作失败，请重试');
    } finally {
      setLikeLoading(false);
    }
  }, [likeLoading, liked, likeCountState, reply.id]);

  if (reply.isDeleted) {
    return (
      <div style={{ marginLeft: depth * 20 }} className="py-3 text-sm text-muted-foreground italic">
        该回复已被删除
      </div>
    );
  }

  const replyAuthorName = reply.author.nickname || reply.author.username;

  return (
    <>
      <div
        className="group/nested-reply py-3"
        style={{ marginLeft: depth * 20 }}
      >
        <div className="flex gap-3">
          {/* Left: Avatar */}
          <Avatar size="sm" className="flex-shrink-0">
            {reply.author.avatarUrl && <AvatarImage src={normalizeImageUrl(reply.author.avatarUrl)} alt={reply.author.username} />}
            <AvatarFallback>{reply.author.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
          </Avatar>

          {/* Right: content */}
          <div className="flex-1 min-w-0">
            {/* Row 1: nickname + reply-to + author badge + time */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-semibold text-foreground">
                {replyAuthorName}
              </span>
              {showReplyTo && reply.parentReplyId && authorMap?.get(reply.parentReplyId) && (
                <span className="text-xs text-muted-foreground">
                  回复 <span className="text-primary font-medium">@{authorMap.get(reply.parentReplyId)}</span>
                </span>
              )}
              {isPostAuthor && (
                <span className="inline-flex items-center rounded-sm px-1 py-px text-[10px] font-medium text-blue-500 bg-blue-50">
                  作者
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(reply.createdAt)}
              </span>
            </div>

            {/* Row 2: Content */}
            <div className="text-sm text-foreground leading-relaxed">
              <ReplyContent markdown={reply.contentMarkdown} />
            </div>

            {/* Row 3: Action bar — same as external ReplyItem */}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              {onReply && (
                <button
                  onClick={() => onReply(reply.id)}
                  className="inline-flex items-center gap-1 hover:text-primary transition-colors duration-150"
                  aria-label="回复"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>回复</span>
                </button>
              )}

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
              {currentUserId && currentUserId !== reply.author.id && (
                <button
                  onClick={() => setReportOpen(true)}
                  className="inline-flex items-center gap-1 opacity-0 group-hover/nested-reply:opacity-100 hover:text-foreground transition-all duration-150"
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
                <div className="relative inline-flex opacity-0 group-hover/nested-reply:opacity-100 transition-all duration-150">
                  {canEdit && onEdit && (
                    <button
                      onClick={() => onEdit(reply.id)}
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
                      onClick={() => onDelete(reply.id)}
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
          </div>
        </div>
      </div>

      {/* Recursive child replies — no gray area, just indentation */}
      {reply.childReplies && reply.childReplies.length > 0 && (
        <div>
          {reply.childReplies.map((child) => (
            <NestedReplyItem
              key={child.id}
              reply={child}
              postId={postId}
              currentUserId={currentUserId}
              postAuthorId={postAuthorId}
              isModerator={isModerator}
              isAdmin={isAdmin}
              parentReplyId={reply.id}
              authorMap={authorMap}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      <ReportDialog
        open={reportOpen}
        targetType="reply"
        targetId={reply.id}
        onClose={() => setReportOpen(false)}
      />
    </>
  );
}
