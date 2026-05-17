import ReplyItem from './ReplyItem';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from './ui';
import { ErrorEmpty, PaginationComponent } from './shared';
import type { Reply } from '../api/reply';

const DEPTH_COLORS = [
  'border-l-blue-400',
  'border-l-emerald-400',
  'border-l-purple-400',
  'border-l-amber-400',
  'border-l-pink-400',
  'border-l-cyan-400',
];

function buildTree(replies: Reply[]): { roots: Reply[]; childrenMap: Map<string, Reply[]> } {
  const childrenMap = new Map<string, Reply[]>();
  const roots: Reply[] = [];

  for (const reply of replies) {
    const parentId = reply.parentReplyId;
    if (parentId === null) {
      roots.push(reply);
    } else {
      const existing = childrenMap.get(parentId);
      if (existing) {
        existing.push(reply);
      } else {
        childrenMap.set(parentId, [reply]);
      }
    }
  }

  return { roots, childrenMap };
}

interface ReplyTreeNodeProps {
  reply: Reply;
  depth: number;
  childrenMap: Map<string, Reply[]>;
  postId: string;
  currentUserId?: string | null;
  isModerator?: boolean;
  isAdmin?: boolean;
  onReply: (replyId: string) => void;
  onShare?: (replyId: string) => void;
  onEdit: (replyId: string) => void;
  onDelete: (replyId: string) => void;
  highlightedReplyId: string | null;
}

function ReplyTreeNode({
  reply,
  depth,
  childrenMap,
  postId,
  currentUserId,
  isModerator,
  isAdmin,
  onReply,
  onShare,
  onEdit,
  onDelete,
  highlightedReplyId,
}: ReplyTreeNodeProps) {
  const children = childrenMap.get(reply.id) || [];
  const colorClass = DEPTH_COLORS[depth % DEPTH_COLORS.length];
  const isHighlighted = highlightedReplyId === reply.id;

  return (
    <div id={`reply-${reply.id}`}>
      <div
        className={`relative transition-colors duration-300 rounded-md ${
          isHighlighted ? 'bg-yellow-100' : ''
        }`}
      >
        {depth > 0 && (
          <div
            className={`absolute top-0 bottom-0 left-0 border-l-2 ${colorClass}`}
            style={{ marginLeft: `${(depth - 1) * 24 + 16}px` }}
          />
        )}
        <div style={{ paddingLeft: `${depth * 24}px` }}>
          <ReplyItem
            id={reply.id}
            postId={postId}
            contentMarkdown={reply.contentMarkdown}
            author={reply.author}
            depth={reply.depth}
            likeCount={reply.likeCount}
            isLikedByCurrentUser={reply.isLikedByCurrentUser}
            isDeleted={reply.isDeleted}
            createdAt={reply.createdAt}
            updatedAt={reply.updatedAt}
            currentUserId={currentUserId}
            isModerator={isModerator}
            isAdmin={isAdmin}
            onReply={() => onReply(reply.id)}
            onShare={onShare}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </div>
      {children.map((child) => (
        <ReplyTreeNode
          key={child.id}
          reply={child}
          depth={depth + 1}
          childrenMap={childrenMap}
          postId={postId}
          currentUserId={currentUserId}
          isModerator={isModerator}
          isAdmin={isAdmin}
          onReply={onReply}
          onShare={onShare}
          onEdit={onEdit}
          onDelete={onDelete}
          highlightedReplyId={highlightedReplyId}
        />
      ))}
    </div>
  );
}

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
  onShare?: (replyId: string) => void;
  onEdit: (replyId: string) => void;
  onDelete: (replyId: string) => void;
  onRetry: () => void;
  highlightedReplyId?: string | null;
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
  onShare,
  onEdit,
  onDelete,
  onRetry,
  highlightedReplyId = null,
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

  const { roots, childrenMap } = buildTree(replies);

  return (
    <div className="reply-tree">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-foreground">
          共 {total} 条回复
        </h3>
      </div>

      <div className="reply-tree__items">
        {roots.map((reply) => (
          <ReplyTreeNode
            key={reply.id}
            reply={reply}
            depth={0}
            childrenMap={childrenMap}
            postId={postId}
            currentUserId={currentUserId}
            isModerator={isModerator}
            isAdmin={isAdmin}
            onReply={onReply}
            onShare={onShare}
            onEdit={onEdit}
            onDelete={onDelete}
            highlightedReplyId={highlightedReplyId}
          />
        ))}
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
