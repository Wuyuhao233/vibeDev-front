import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getPost, deletePost, recordPostView, pinPost, unpinPost, toggleEssence, type PostDetail } from '../api/post';
import { getReplies, createReply, deleteReply, type Reply } from '../api/reply';
import { useAuthStore } from '../store/authStore';
import Avatar from '../components/ui/Avatar';
import LevelBadge from '../components/ui/LevelBadge';
import TagBadge from '../components/ui/TagBadge';
import { EmptyState, ErrorState, ConfirmDialog, Button } from '../components/ui';
import { toast } from '../components/ui/Toast';
import PostDetailSkeleton from '../components/PostDetailSkeleton';
import LikeButton from '../components/LikeButton';
import CollectButton from '../components/CollectButton';
import SharePanel from '../components/SharePanel';
import ReplyTree from '../components/ReplyTree';
import QuickReply from '../components/QuickReply';
import { formatRelativeTime } from '../utils/relativeTime';

const REPLY_PAGE_SIZE = 20;

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const postId = parseInt(id || '0', 10);
  const { user, isAuthenticated } = useAuthStore();

  // Post state
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Replies state
  const [replies, setReplies] = useState<Reply[]>([]);
  const [repliesTotal, setRepliesTotal] = useState(0);
  const [repliesPage, setRepliesPage] = useState(1);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [repliesError, setRepliesError] = useState<string | null>(null);

  // UI state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [essenceLoading, setEssenceLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [replyToId, setReplyToId] = useState<number | null>(null);
  const [replyToUsername, setReplyToUsername] = useState<string | null>(null);
  const [highlightedReplyId, setHighlightedReplyId] = useState<number | null>(null);

  // Fetch post
  const fetchPost = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const data = await getPost(postId);
      setPost(data);
      // Record view
      recordPostView(postId);
    } catch (err: any) {
      const msg = err?.message || '';
      const code = err?.code || '';
      if (msg.includes('404') || code === 'NOT_FOUND (30001)' || code === 'POST_DELETED (30002)') {
        setNotFound(true);
      } else {
        setError(msg || '加载失败');
      }
    } finally {
      setLoading(false);
    }
  }, [postId]);

  // Fetch replies
  const fetchReplies = useCallback(async (page: number) => {
    if (!postId) return;
    setRepliesLoading(true);
    setRepliesError(null);

    try {
      const result = await getReplies(postId, { page, pageSize: REPLY_PAGE_SIZE });
      setReplies(result.items);
      setRepliesTotal(result.total);
    } catch (err: any) {
      setRepliesError(err?.message || '加载回复失败');
    } finally {
      setRepliesLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  useEffect(() => {
    fetchReplies(repliesPage);
  }, [fetchReplies, repliesPage]);

  // Hash anchor: #reply-{reply_id} auto-scroll + 3s yellow highlight
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#reply-')) {
        const replyId = parseInt(hash.slice(7), 10);
        if (!isNaN(replyId)) {
          setHighlightedReplyId(replyId);
          // Scroll after a tick to allow DOM to update
          setTimeout(() => {
            const el = document.getElementById(hash.slice(1));
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
          // Clear highlight after 3s
          setTimeout(() => setHighlightedReplyId(null), 3000);
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [replies]);

  // Delete post
  const handleDelete = useCallback(async () => {
    setDeleteLoading(true);
    try {
      await deletePost(postId);
      toast.success('帖子已删除');
      navigate(post?.board?.slug ? `/board/${post.board.slug}` : '/', { replace: true });
    } catch (err: any) {
      toast.error(err?.message || '删除失败');
    } finally {
      setDeleteLoading(false);
      setDeleteOpen(false);
    }
  }, [postId, post, navigate]);

  // Pin
  const handlePin = useCallback(
    async (pinType: 'board' | 'global') => {
      setPinLoading(true);
      try {
        if (post?.isPinned) {
          await unpinPost(postId);
          setPost((prev) => prev ? { ...prev, isPinned: false } : prev);
          toast.success('已取消置顶');
        } else {
          await pinPost(postId, pinType);
          setPost((prev) => prev ? { ...prev, isPinned: true } : prev);
          toast.success('已置顶');
        }
      } catch (err: any) {
        toast.error(err?.message || '操作失败');
      } finally {
        setPinLoading(false);
        setPinOpen(false);
      }
    },
    [postId, post],
  );

  // Essence toggle
  const handleEssenceToggle = useCallback(async () => {
    setEssenceLoading(true);
    try {
      const result = await toggleEssence(postId);
      setPost((prev) => prev ? { ...prev, isEssence: result.isEssence } : prev);
      toast.success(result.isEssence ? '已加精' : '已取消加精');
    } catch (err: any) {
      toast.error(err?.message || '操作失败');
    } finally {
      setEssenceLoading(false);
    }
  }, [postId]);

  // Reply actions
  const handleReplySubmit = useCallback(
    async (content: string) => {
      await createReply(postId, { content, parentId: replyToId ?? undefined });
      toast.success('回复已发布');
      setReplyToId(null);
      setReplyToUsername(null);
      fetchReplies(repliesPage);
    },
    [postId, replyToId, repliesPage, fetchReplies],
  );

  const handleReplyDelete = useCallback(
    async (replyId: number) => {
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

  const handleReplyEdit = useCallback((replyId: number) => {
    // V1.1 will implement inline editing
    toast.info('编辑功能将在后续版本上线');
  }, []);

  const handleReplyToReply = useCallback(
    (replyId: number) => {
      const reply = replies.find((r) => r.id === replyId);
      setReplyToId(replyId);
      setReplyToUsername(reply?.author.username ?? null);
      // Scroll to quick reply
      setTimeout(() => {
        document.querySelector('.quick-reply')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    },
    [replies],
  );

  const handleCancelReplyTo = useCallback(() => {
    setReplyToId(null);
    setReplyToUsername(null);
  }, []);

  // Permission checks
  const isAuthor = user?.id === post?.author?.id;
  const isModerator = false; // V1.0: simplified
  const isAdmin = user?.id === 1; // simplified admin check
  const canManage = isAuthor || isModerator || isAdmin;

  // Loading
  if (loading) {
    return <PostDetailSkeleton />;
  }

  // Error
  if (error) {
    return <ErrorState title="加载失败" description={error} onRetry={fetchPost} />;
  }

  // Not found
  if (notFound) {
    return (
      <EmptyState
        icon={
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="text-gray-300">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M16 16s-1.5-2-4-2-4 2-4 2M9 9h.01M15 9h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        }
        title="帖子不存在"
        description="该帖子可能已被删除或链接无效"
        action={
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600"
          >
            返回首页
          </Link>
        }
      />
    );
  }

  if (!post) return null;

  const level = Math.min(Math.max(post.author.level, 1), 6) as 1 | 2 | 3 | 4 | 5 | 6;
  const postUrl = `${window.location.origin}/post/${post.id}`;

  return (
    <div className="post-detail max-w-4xl mx-auto">
      {/* Deleted banner (author only) */}
      {post.isDeleted && isAuthor && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-2 rounded-lg mb-4">
          该帖已被你删除。其他用户无法查看。
        </div>
      )}

      {/* Audit status */}
      {post.auditStatus === 'PENDING' && isAuthor && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-2 rounded-lg mb-4">
          你的帖子正在审核中，审核通过后将对所有人可见
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        {post.board && (
          <Link to={`/board/${post.board.slug || post.board.id}`} className="hover:text-primary-500">
            {post.board.name}
          </Link>
        )}
        {post.tags.length > 0 && (
          <>
            <span>›</span>
            <div className="flex items-center gap-1.5">
              {post.tags.map((tag) => (
                <TagBadge key={tag.id} className="text-xs">
                  {tag.name}
                </TagBadge>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Author header */}
      <div className="flex items-center gap-3 mb-4">
        <Link to={`/u/${post.author.username}`}>
          <Avatar
            src={post.author.avatar || undefined}
            name={post.author.username}
            size={48}
          />
        </Link>
        <div>
          <Link to={`/u/${post.author.username}`} className="text-base font-medium text-gray-900 hover:text-primary-500">
            {post.author.username}
          </Link>
          <LevelBadge level={level} className="ml-2" />
          <div className="text-sm text-gray-400 mt-0.5">
            发布于 {formatRelativeTime(post.createdAt)}
            {post.lastEditedAt && (
              <span> · 最后编辑于 {formatRelativeTime(post.lastEditedAt)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Title + Badges */}
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{post.title}</h1>
        {post.isPinned && (
          <span className="inline-flex items-center rounded-sm px-1.5 py-px text-[11px] font-medium text-blue-500 bg-blue-50 flex-shrink-0">
            置顶
          </span>
        )}
        {post.isEssence && (
          <span className="inline-flex items-center rounded-sm px-1.5 py-px text-[11px] font-medium text-essence bg-amber-50 flex-shrink-0">
            精
          </span>
        )}
        {post.auditStatus === 'PENDING' && (
          <span className="inline-flex items-center rounded-sm px-1.5 py-px text-[11px] font-medium text-amber-800 bg-amber-50 flex-shrink-0">
            审核中
          </span>
        )}
      </div>

      {/* Content */}
      <div className="prose max-w-none mb-6 prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-primary-500 prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-img:rounded-lg prose-img:max-w-full prose-blockquote:border-l-primary-500 prose-blockquote:text-gray-500 prose-table:border prose-th:bg-gray-50 prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {post.contentMarkdown || post.content}
        </ReactMarkdown>
      </div>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-400">标签：</span>
          {post.tags.map((tag) => (
            <Link
              key={tag.id}
              to={`/board/${post.board?.slug || post.board?.id}?tag=${tag.id}`}
              className="tag-chip inline-flex items-center rounded px-2 py-px text-xs text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors duration-150"
            >
              {tag.name}
            </Link>
          ))}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-6 py-4 border-t border-gray-100">
        {isAuthenticated ? (
          <>
            <LikeButton
              targetType="post"
              targetId={post.id}
              initialLiked={post.isLiked}
              initialCount={post.likeCount}
            />
            <CollectButton
              postId={post.id}
              initialCollected={post.isCollected}
              initialCount={post.collectCount}
            />
            <SharePanel url={postUrl} title={post.title} />
          </>
        ) : (
          <>
            <span className="inline-flex items-center gap-1 text-sm text-gray-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" strokeWidth="2" />
              </svg>
              {post.likeCount}
            </span>
            <span className="inline-flex items-center gap-1 text-sm text-gray-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="currentColor" strokeWidth="2" />
              </svg>
              {post.collectCount}
            </span>
          </>
        )}

        <div className="flex-1" />

        {/* Stats */}
        <span className="text-sm text-gray-400">
          {post.viewCount} 次浏览 · {post.replyCount} 条回复
        </span>
      </div>

      {/* Mod/Admin action bar */}
      {canManage && (
        <div className="flex items-center gap-3 py-3 border-t border-gray-100">
          {isAuthor && (
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-gray-500 hover:text-primary-500 transition-colors duration-150"
            >
              编辑
            </button>
          )}
          {canManage && (
            <>
              <button
                onClick={handleEssenceToggle}
                disabled={essenceLoading}
                className={`text-sm transition-colors duration-150 ${
                  post.isEssence
                    ? 'text-essence font-medium'
                    : 'text-gray-500 hover:text-essence'
                }`}
              >
                {essenceLoading ? '处理中...' : post.isEssence ? '已加精' : '加精'}
              </button>
              <button
                onClick={() => setPinOpen(!pinOpen)}
                disabled={pinLoading}
                className={`text-sm transition-colors duration-150 ${
                  post.isPinned ? 'text-blue-500 font-medium' : 'text-gray-500 hover:text-blue-500'
                }`}
              >
                {pinLoading ? '处理中...' : post.isPinned ? '已置顶' : '置顶'}
              </button>
              <button
                onClick={() => setDeleteOpen(true)}
                className="text-sm text-gray-500 hover:text-red-500 transition-colors duration-150"
              >
                删除
              </button>
            </>
          )}
        </div>
      )}

      {/* Pin type selector */}
      {pinOpen && (
        <div className="flex items-center gap-2 py-2 px-4 bg-blue-50 rounded-md mb-4">
          <span className="text-sm text-blue-700">选择置顶类型：</span>
          <button
            onClick={() => handlePin('board')}
            className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-100 transition-colors"
          >
            版块置顶
          </button>
          <button
            onClick={() => handlePin('global')}
            className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-100 transition-colors"
          >
            全局置顶
          </button>
          <button
            onClick={() => setPinOpen(false)}
            className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
          >
            取消
          </button>
        </div>
      )}

      {/* Replies section */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <ReplyTree
          replies={replies}
          total={repliesTotal}
          page={repliesPage}
          pageSize={REPLY_PAGE_SIZE}
          loading={repliesLoading}
          error={repliesError}
          currentUserId={isAuthenticated ? user?.id : null}
          onPageChange={setRepliesPage}
          onReply={handleReplyToReply}
          onEdit={handleReplyEdit}
          onDelete={handleReplyDelete}
          onRetry={() => fetchReplies(repliesPage)}
          highlightedReplyId={highlightedReplyId}
        />

        {/* Quick reply */}
        {isAuthenticated ? (
          <div className="quick-reply-container">
            {replyToId && replyToUsername && (
              <div className="flex items-center gap-2 mt-4 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-sm">
                <span className="text-blue-700">
                  正在回复 <span className="font-medium">@{replyToUsername}</span>
                </span>
                <button
                  onClick={handleCancelReplyTo}
                  className="ml-auto text-blue-500 hover:text-blue-700 text-xs"
                >
                  取消回复
                </button>
              </div>
            )}
            <QuickReply onSubmit={handleReplySubmit} />
          </div>
        ) : (
          <div className="border-t border-gray-100 pt-4 mt-4">
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-500 bg-gray-50 rounded-lg">
              <Link to="/login" className="text-primary-500 hover:text-primary-600 font-medium">
                登录
              </Link>
              <span>后参与讨论</span>
              <Link to="/register" className="text-primary-500 hover:text-primary-600 font-medium">
                注册
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="确认删除帖子？"
        description="删除后该帖子将从版块列表中移除。其他人将无法看到该帖子。"
        confirmLabel="确认删除"
        cancelLabel="取消"
        loading={deleteLoading}
      />
    </div>
  );
}
