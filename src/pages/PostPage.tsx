import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getPost, deletePost, recordPostView, pinPost, unpinPost, toggleEssence, type PostDetail } from '../api/post';
import { getReplies, createReply, deleteReply, type Reply } from '../api/reply';
import { useAuthStore } from '../store/authStore';
import { Avatar, LevelBadge, TagBadge, Empty, ErrorState, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui';
import { toast } from '../components/ui';
import PostDetailSkeleton from '../components/PostDetailSkeleton';
import LikeButton from '../components/LikeButton';
import CollectButton from '../components/CollectButton';
import SharePanel from '../components/SharePanel';
import ReportDialog from '../components/ReportDialog';
import AppealDialog from '../components/AppealDialog';
// import type { ShareCardData } from '../components/ShareCard';
import ReplyTree from '../components/ReplyTree';
import QuickReply from '../components/QuickReply';
import { formatRelativeTime } from '../utils/relativeTime';

const REPLY_PAGE_SIZE = 20;

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const postId = id || '';
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
  const [_deleteLoading, setDeleteLoading] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [essenceLoading, setEssenceLoading] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [appealOpen, setAppealOpen] = useState(false);
  const [_editing, setEditing] = useState(false);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyToUsername, setReplyToUsername] = useState<string | null>(null);
  const [highlightedReplyId, setHighlightedReplyId] = useState<string | null>(null);

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
        const replyId = hash.slice(7);
        if (replyId) {
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
      navigate(post?.boardId ? `/board/${post.boardId}` : '/', { replace: true });
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
      await createReply(postId, { content, parentReplyId: replyToId ?? undefined, idempotencyKey: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 9)}` });
      toast.success('回复已发布');
      setReplyToId(null);
      setReplyToUsername(null);
      fetchReplies(repliesPage);
    },
    [postId, replyToId, repliesPage, fetchReplies],
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
    // V1.1 will implement inline editing
    toast.info('编辑功能将在后续版本上线');
  }, []);

  const handleReplyToReply = useCallback(
    (replyId: string) => {
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
    return <ErrorState description={error} onRetry={fetchPost} />;
  }

  // Not found
  if (notFound) {
    return (
      <Empty
        icon={
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="text-gray-300">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M16 16s-1.5-2-4-2-4 2-4 2M9 9h.01M15 9h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        }
       
       
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

      {/* Audit status — PENDING */}
      {post.auditStatus === 'PENDING' && isAuthor && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-2 rounded-lg mb-4">
          你的帖子正在审核中，审核通过后将对所有人可见
        </div>
      )}

      {/* Audit status — REJECTED */}
      {post.auditStatus === 'REJECTED' && isAuthor && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-red-600 bg-red-100 px-1.5 py-px rounded-sm">已驳回</span>
            <span className="text-sm text-red-700 font-medium">原因：{post.auditReason || '内容违规'}</span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => navigate(`/post/edit/${post.id}`)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-150"
            >
              修改重发
            </button>
            <button
              onClick={() => setAppealOpen(true)}
              className="text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors duration-150"
            >
              申诉
            </button>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        {post.boardName && (
          <Link to={`/board/${post.boardId}`} className="hover:text-primary-500">
            {post.boardName}
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
            src={post.author.avatarUrl || undefined}
            name={post.author.username}
            size="default"
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
        {post.auditStatus === 'REJECTED' && (
          <span className="inline-flex items-center rounded-sm px-1.5 py-px text-[11px] font-medium text-red-600 bg-red-50 flex-shrink-0">
            已驳回
          </span>
        )}
      </div>

      {/* Content */}
      <div
        className={`prose max-w-none mb-6 prose-headings:text-gray-900 prose-a:text-primary-500 prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-img:rounded-lg prose-img:max-w-full prose-blockquote:border-l-primary-500 prose-blockquote:text-gray-500 prose-table:border prose-th:bg-gray-50 prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2 ${
          post.auditStatus === 'REJECTED'
            ? 'text-gray-400 line-through prose-p:text-gray-400'
            : 'prose-p:text-gray-700 prose-p:leading-relaxed'
        }`}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {post.contentMarkdown}
        </ReactMarkdown>
      </div>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-400">标签：</span>
          {post.tags.map((tag) => (
            <Link
              key={tag.id}
              to={`/board/${post.boardId}?tag=${tag.id}`}
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
              initialLiked={post.isLikedByCurrentUser}
              initialCount={post.likeCount}
            />
            <CollectButton
              postId={post.id}
              initialCollected={post.isCollectedByCurrentUser}
              initialCount={post.collectCount}
            />
            <SharePanel
              url={postUrl}
              title={post.title}
              cardData={{
                title: post.title,
                authorName: post.author.username,
                authorAvatar: post.author.avatarUrl,
                boardName: post.boardName,
                excerpt: post.contentMarkdown
                  ? post.contentMarkdown.replace(/[#*`>\-\[\]!()|~]/g, '').slice(0, 120)
                  : '',
                createdAt: post.createdAt,
                replyCount: post.replyCount,
                likeCount: post.likeCount,
              }}
            />
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

        {/* Report button (non-author only) */}
        {isAuthenticated && !isAuthor && (
          <button
            onClick={() => setReportOpen(true)}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors duration-150"
          >
            举报
          </button>
        )}

        {/* Stats */}
        <span className="text-sm text-gray-400">
          {post.shareCount} 次分享 · {post.replyCount} 条回复
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
          postId={post.id}
          currentUserId={isAuthenticated ? user?.id : null}
          onPageChange={setRepliesPage}
          onReply={handleReplyToReply}
          onEdit={handleReplyEdit}
          onDelete={handleReplyDelete}
          onRetry={() => fetchReplies(repliesPage)}
          highlightedReplyId={highlightedReplyId}
        />

        {/* Quick reply — disabled for PENDING, hidden for REJECTED */}
        {post.auditStatus === 'PENDING' && isAuthor ? (
          <div className="border-t border-gray-100 pt-4 mt-4">
            <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-lg">
              审核中的内容暂不支持回复
            </p>
          </div>
        ) : post.auditStatus === 'REJECTED' ? null : (
          isAuthenticated ? (
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
        ))}
      </div>

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={(o) => !o && setDeleteOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>确定要删除这篇帖子吗？该操作不可撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report dialog */}
      <ReportDialog
        open={reportOpen}
        targetType="post"
        targetId={post.id}
        onClose={() => setReportOpen(false)}
      />

      {/* Appeal dialog */}
      <AppealDialog
        open={appealOpen}
        postId={post.id}
        initialStatus={post.appealStatus ?? null}
        onClose={() => setAppealOpen(false)}
      />
    </div>
  );
}
