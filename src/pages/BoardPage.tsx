import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { getBoard, getBoardPosts, type Board } from '../api/board';
import { getFollowedTags, followTag, unfollowTag, type FollowedTag } from '../api/tag';
import { useAuthStore } from '../store/authStore';
import PostCard from '../components/PostCard';
import SortSwitcher from '../components/SortSwitcher';
import TagFilterBar from '../components/TagFilterBar';
import { Pagination, Empty, ErrorState } from '../components/ui';
import { toast } from '../components/ui';
import type { PostCardData } from '../types/board';

type SortValue = 'hot' | 'latest' | 'trending';

const PAGE_SIZE = 20;

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [board, setBoard] = useState<Board | null>(null);
  const [boardLoading, setBoardLoading] = useState(true);
  const [boardNotFound, setBoardNotFound] = useState(false);
  const [boardError, setBoardError] = useState<string | null>(null);

  const [posts, setPosts] = useState<PostCardData[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [followedTags, setFollowedTags] = useState<FollowedTag[]>([]);
  const followedTagIds = new Set(followedTags.map((t) => t.id));

  const { isAuthenticated } = useAuthStore();

  const tagParam = searchParams.get('tag');
  const sortParam = (searchParams.get('sort') || 'hot') as SortValue;
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const activeTagId = tagParam ? parseInt(tagParam, 10) : null;

  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === '' || v === '1') {
        next.delete(k);
      } else {
        next.set(k, v);
      }
    });
    setSearchParams(next, { replace: true });
  };

  // Fetch board details
  useEffect(() => {
    if (!id) return;
    setBoardLoading(true);
    setBoardNotFound(false);
    setBoardError(null);

    getBoard(id)
      .then((data) => {
        setBoard(data);
        setBoardNotFound(false);
      })
      .catch((err: any) => {
        if (err?.message?.includes('404') || err?.message?.includes('NOT_FOUND') || err?.code === 'NOT_FOUND (30001)') {
          setBoardNotFound(true);
        } else {
          setBoardError(err?.message || '加载版块信息失败');
        }
      })
      .finally(() => setBoardLoading(false));
  }, [id]);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    if (!id) return;
    setPostsLoading(true);
    setPostsError(null);

    try {
      const result = await getBoardPosts(id, {
        tag: tagParam || undefined,
        sort: sortParam,
        page: pageParam,
        limit: PAGE_SIZE,
      });

      setPosts(
        result.items.map((item) => ({
          ...item,
          contentSummary: item.contentSummary || item.content,
        }))
      );
      setTotal(result.total);
    } catch (err: any) {
      setPostsError(err?.message || '加载帖子列表失败');
      setPosts([]);
      setTotal(0);
      toast.error(err?.message || '加载帖子列表失败');
    } finally {
      setPostsLoading(false);
    }
  }, [id, tagParam, sortParam, pageParam]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (!isAuthenticated) {
      setFollowedTags([]);
      return;
    }
    getFollowedTags()
      .then(setFollowedTags)
      .catch(() => { /* silently fail, tags just won't show as followed */ });
  }, [isAuthenticated]);

  const handleToggleFollow = async (tag: { id: number; name: string; slug: string }) => {
    const isCurrentlyFollowed = followedTagIds.has(tag.id);
    const prev = followedTags;

    if (isCurrentlyFollowed) {
      setFollowedTags((tags) => tags.filter((t) => t.id !== tag.id));
      try {
        await unfollowTag(tag.id);
      } catch {
        setFollowedTags(prev);
        toast.error('取消关注失败，请重试');
      }
    } else {
      setFollowedTags((tags) => [...tags, { id: tag.id, name: tag.name, slug: tag.slug }]);
      try {
        await followTag(tag.id);
      } catch {
        setFollowedTags(prev);
        toast.error('关注失败，请重试');
      }
    }
  };

  const handleSortChange = (sort: SortValue) => {
    updateParams({ sort: sort === 'hot' ? null : sort, page: null });
  };

  const handleTagChange = (tagId: number | null) => {
    updateParams({ tag: tagId ? String(tagId) : null, page: null });
  };

  const handlePageChange = (page: number) => {
    updateParams({ page: page === 1 ? null : String(page) });
  };

  // Board not found
  if (boardNotFound) {
    return (
      <div className="board-content__not-found">
        <Empty
          icon={
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="text-gray-300">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M16 16s-1.5-2-4-2-4 2-4 2M9 9h.01M15 9h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          }
          title="版块不存在"
          description="该版块可能已被删除或归档"
          action={
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors duration-150"
            >
              返回首页
            </Link>
          }
        />
      </div>
    );
  }

  // Board error
  if (boardError && !board) {
    return (
      <ErrorState
        title="加载版块信息失败"
        description={boardError}
        onRetry={fetchPosts}
      />
    );
  }

  // Board loading
  if (boardLoading) {
    return (
      <div className="animate-shimmer space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
        <div className="h-5 w-96 bg-gray-200 rounded mb-6" />
        <div className="flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-4 shadow-card">
              <div className="w-3/5 h-4 bg-gray-200 rounded mb-3" />
              <div className="w-full h-3.5 bg-gray-200 rounded mb-2" />
              <div className="w-3/5 h-3.5 bg-gray-200 rounded mb-4" />
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-gray-200 rounded-full" />
                <div className="w-[60px] h-3.5 bg-gray-200 rounded" />
                <div className="w-[80px] h-3.5 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="board-content">
      {/* Header */}
      <div className="board-content__header mb-6">
        <h1 className="board-content__title text-3xl font-bold text-gray-900 mb-1">
          {board?.name || '加载中...'}
        </h1>
        {board?.description && (
          <p className="text-sm text-gray-500 mb-3">{board.description}</p>
        )}
        <div className="board-content__actions flex items-center justify-between">
          <span className="text-sm text-gray-400">
            共 {total} 个帖子
          </span>
          <Link
            to="/post/new"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors duration-150"
          >
            发布新帖
          </Link>
        </div>
      </div>

      {/* Tag Filter Bar */}
      {board?.tags && board.tags.length > 0 && (
        <TagFilterBar
          tags={board.tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug, sortOrder: t.sortOrder }))}
          activeTagId={activeTagId}
          onSelect={handleTagChange}
          followedTagIds={followedTagIds}
          onToggleFollow={handleToggleFollow}
        />
      )}

      {/* Sort Switcher */}
      <div className="flex items-center justify-between mb-4">
        <SortSwitcher
          value={sortParam}
          onChange={handleSortChange}
          showTrending={true}
        />
      </div>

      {/* Posts */}
      {postsLoading ? (
        <div className="post-list__skeleton flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-4 shadow-card animate-shimmer">
              <div className="w-3/5 h-4 bg-gray-200 rounded mb-3" />
              <div className="w-full h-3.5 bg-gray-200 rounded mb-2" />
              <div className="w-3/5 h-3.5 bg-gray-200 rounded mb-4" />
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-gray-200 rounded-full" />
                <div className="w-[60px] h-3.5 bg-gray-200 rounded" />
                <div className="w-[80px] h-3.5 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : postsError ? (
        <ErrorState
          title="加载帖子列表失败"
          description={postsError}
          onRetry={fetchPosts}
        />
      ) : posts.length === 0 ? (
        activeTagId ? (
          <Empty
            icon={
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="text-gray-300">
                <rect x="8" y="12" width="48" height="40" rx="4" stroke="currentColor" strokeWidth="2" />
                <path d="M20 28h24M20 36h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            }
            title="该标签下暂无帖子"
            action={
              <button
                onClick={() => handleTagChange(null)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-500 bg-white border border-primary-500 rounded-md hover:bg-primary-50 transition-colors duration-150"
              >
                返回全部
              </button>
            }
          />
        ) : (
          <Empty
            title="该版块暂无帖子"
            action={
              <Link
                to="/post/new"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors duration-150"
              >
                发布第一个帖子
              </Link>
            }
          />
        )
      ) : (
        <>
          <div className="post-list flex flex-col gap-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          <Pagination
            current={pageParam}
            total={total}
            pageSize={PAGE_SIZE}
            onChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
