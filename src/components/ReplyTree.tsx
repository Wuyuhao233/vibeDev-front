import ReplyItem from './ReplyItem';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from './ui';
import { ErrorEmpty, PaginationComponent } from './shared';
import type { Reply } from '../api/reply';

interface ReplyTreeProps {
  replies: Reply[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
  postId: string;
  currentUserId?: string | null;
  isModerator?: boolean;
  isAdmin?: boolean;
  onPageChange: (page: number) => void;
  onReply: (replyId: string) => void;
  onEdit: (replyId: string) => void;
  onDelete: (replyId: string) => void;
  onRetry: () => void;
  highlightedReplyId?: string | null;
  /** Post author's user ID, for "作者" badge */
  postAuthorId?: string | null;
}

export default function ReplyTree({
  replies,
  total,
  page,
  pageSize,
  loading,
  error,
  postId,
  currentUserId,
  isModerator,
  isAdmin,
  onPageChange,
  onReply,
  onEdit,
  onDelete,
  onRetry,
  highlightedReplyId = null,
  postAuthorId,
}: ReplyTreeProps) {
  if (loading && replies.length === 0) {
    return (
      <div className="space-y-4 py-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3 animate-shimmer">
            <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-20 h-3.5 bg-muted rounded" />
                <div className="w-12 h-3.5 bg-muted rounded" />
              </div>
              <div className="w-full h-4 bg-muted rounded mb-2" />
              <div className="w-2/3 h-4 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorEmpty description={error} onRetry={onRetry} />;
  }

  if (!loading && replies.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="text-muted-foreground">
            <path d="M32 12v26M20 26l12 12 12-12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M44 40v4a4 4 0 01-4 4H24a4 4 0 01-4-4v-4" stroke="currentColor" strokeWidth="2" />
          </svg>
          <EmptyTitle>暂无回复</EmptyTitle>
          <EmptyDescription>来发表第一条回复吧</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (

    <div className="reply-tree">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-foreground">
          共 {total} 条回复
        </h3>
      </div>

      <div className="reply-tree__items">
        {replies.map((reply) => {
          const isHighlighted = highlightedReplyId === reply.id;
          return (
            <div
              key={reply.id}
              id={`reply-${reply.id}`}
              className={`transition-colors duration-300 rounded-md border-b border-border/30 ${
                isHighlighted ? 'bg-yellow-100' : ''
              }`}
            >
              <ReplyItem
                id={reply.id}
                postId={postId}
                contentMarkdown={reply.contentMarkdown}
                author={reply.author}
                likeCount={reply.likeCount}
                isLikedByCurrentUser={reply.isLikedByCurrentUser}
                isDeleted={reply.isDeleted}
                createdAt={reply.createdAt}
                updatedAt={reply.updatedAt}
                currentUserId={currentUserId}
                isModerator={isModerator}
                isAdmin={isAdmin}
                postAuthorId={postAuthorId}
                childReplies={reply.childReplies}
                onReply={() => onReply(reply.id)}
                onReplyToChild={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          );
        })}
      </div>

      <PaginationComponent
        currentPage={page}
        total={total}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </div>
  );
}
