import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getReplies, createReply, deleteReply, type Reply } from '../api/reply';
import { useAuthStore } from '../store/authStore';
import ReplyTree from './ReplyTree';
import QuickReply from './QuickReply';
import { toast } from './ui';

const REPLY_PAGE_SIZE = 10;

interface InlineRepliesProps {
  postId: string;
  /** Post author's user ID, for "作者" badge */
  postAuthorId?: string | null;
  onClose?: () => void;
}

export default function InlineReplies({ postId, postAuthorId, onClose }: InlineRepliesProps) {
  const { user, isAuthenticated } = useAuthStore();

  const [replies, setReplies] = useState<Reply[]>([]);
  const [repliesTotal, setRepliesTotal] = useState(0);
  const [repliesPage, setRepliesPage] = useState(1);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [repliesError, setRepliesError] = useState<string | null>(null);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyToUsername, setReplyToUsername] = useState<string | null>(null);

  const fetchReplies = useCallback(async (page: number) => {
    setRepliesLoading(true);
    setRepliesError(null);
    try {
      const result = await getReplies(postId, { page, limit: REPLY_PAGE_SIZE });
      setReplies(result.items);
      setRepliesTotal(result.total);
    } catch (err: any) {
      setRepliesError(err?.message || '加载回复失败');
    } finally {
      setRepliesLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchReplies(1);
  }, [fetchReplies]);

  useEffect(() => {
    if (repliesPage > 1) {
      fetchReplies(repliesPage);
    }
  }, [repliesPage, fetchReplies]);

  const [replyToPostOnly, setReplyToPostOnly] = useState(false);

  const handleReplySubmit = useCallback(
    async (content: string) => {
      await createReply(postId, {
        content,
        parentReplyId: replyToPostOnly ? undefined : (replyToId ?? undefined),
        idempotencyKey: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      });
      toast.success('回复已发布');
      setReplyToId(null);
      setReplyToUsername(null);
      setReplyToPostOnly(false);
      fetchReplies(repliesPage);
    },
    [postId, replyToId, replyToPostOnly, repliesPage, fetchReplies],
  );

  const handleReplyDelete = useCallback(
    async (replyId: string) => {
      try {
        await deleteReply(replyId);
        toast.success('回复已删除');
        fetchReplies(repliesPage);
      } catch (err: any) {
        toast.error(err?.message || '删除失败');
      }
    },
    [repliesPage, fetchReplies],
  );

  const handleReplyEdit = useCallback((_replyId: string) => {
    toast.info('编辑功能将在后续版本上线');
  }, []);

  const handleReplyToReply = useCallback(
    (replyId: string) => {
      const reply = replies.find((r) => r.id === replyId);
      setReplyToId(replyId);
      setReplyToUsername(reply?.author.username ?? null);
      setTimeout(() => {
        document.querySelector(`#post-${postId} .quick-reply textarea`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    },
    [replies, postId],
  );

  const handleCancelReplyTo = useCallback(() => {
    setReplyToId(null);
    setReplyToUsername(null);
  }, []);

  return (
    <div className="mt-3 pt-3 border-t border-border" onClick={(e) => e.stopPropagation()}>
      {/* Header with close button */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-foreground">
          回复 {repliesTotal > 0 && `(${repliesTotal})`}
        </h4>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors duration-150"
          aria-label="收起回复"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Reply tree */}
      <ReplyTree
        replies={replies}
        total={repliesTotal}
        page={repliesPage}
        pageSize={REPLY_PAGE_SIZE}
        loading={repliesLoading}
        error={repliesError}
        postId={postId}
        currentUserId={isAuthenticated ? user?.id : null}
        onPageChange={setRepliesPage}
        onReply={handleReplyToReply}
        onEdit={handleReplyEdit}
        onDelete={handleReplyDelete}
        onRetry={() => fetchReplies(repliesPage)}
        postAuthorId={postAuthorId}
      />

      {/* Quick reply */}
      {isAuthenticated ? (
        <div className="mt-3">
          <QuickReply
            onSubmit={handleReplySubmit}
            currentUser={user}
            replyToUsername={replyToUsername}
            onCancelReplyTo={handleCancelReplyTo}
            replyToPostOnly={replyToPostOnly}
            onReplyToPostOnlyChange={setReplyToPostOnly}
          />
        </div>
      ) : (
        <div className="mt-3 py-3 text-center text-sm text-muted-foreground bg-muted/30 rounded-lg">
          <Link to="/login" className="text-primary hover:text-primary font-medium">登录</Link>
          <span> 后参与讨论</span>
        </div>
      )}
    </div>
  );
}
