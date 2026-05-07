import ReplyItem from './ReplyItem';
import { Pagination, Empty } from './ui';
import ErrorState from './ui/ErrorState';
import type { Reply } from '../api/reply';

const DEPTH_COLORS = [
  'border-l-blue-400',
  'border-l-emerald-400',
  'border-l-purple-400',
  'border-l-amber-400',
  'border-l-pink-400',
  'border-l-cyan-400',
];

function buildTree(replies: Reply[]): { roots: Reply[]; childrenMap: Map<number, Reply[]> } {
  const childrenMap = new Map<number, Reply[]>();
  const roots: Reply[] = [];

  for (const reply of replies) {
    const parentId = reply.parentId;
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
  childrenMap: Map<number, Reply[]>;
  postId: number;
  currentUserId?: number | null;
  isModerator?: boolean;
  isAdmin?: boolean;
  onReply: (replyId: number) => void;
  onShare?: (replyId: number) => void;
  onEdit: (replyId: number) => void;
  onDelete: (replyId: number) => void;
  highlightedReplyId: number | null;
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
            content={reply.content}
            author={reply.author}
            floorNumber={reply.floorNumber}
            likeCount={reply.likeCount}
            isLiked={reply.isLiked}
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
  postId: number;
  currentUserId?: number | null;
  isModerator?: boolean;
  isAdmin?: boolean;
  onPageChange: (page: number) => void;
  onReply: (replyId: number) => void;
  onShare?: (replyId: number) => void;
  onEdit: (replyId: number) => void;
  onDelete: (replyId: number) => void;
  onRetry: () => void;
  highlightedReplyId?: number | null;
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
            <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-20 h-3.5 bg-gray-200 rounded" />
                <div className="w-12 h-3.5 bg-gray-200 rounded" />
              </div>
              <div className="w-full h-4 bg-gray-200 rounded mb-2" />
              <div className="w-2/3 h-4 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorState title="加载回复失败" description={error} onRetry={onRetry} />;
  }

  if (!loading && replies.length === 0) {
    return (
      <Empty
        icon={
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="text-gray-300">
            <path d="M32 12v26M20 26l12 12 12-12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M44 40v4a4 4 0 01-4 4H24a4 4 0 01-4-4v-4" stroke="currentColor" strokeWidth="2" />
          </svg>
        }
        title="暂无回复"
        description="来发表第一条回复吧"
      />
    );
  }

  const { roots, childrenMap } = buildTree(replies);

  return (
    <div className="reply-tree">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">
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

      <Pagination
        current={page}
        total={total}
        pageSize={pageSize}
        onChange={onPageChange}
      />
    </div>
  );
}
