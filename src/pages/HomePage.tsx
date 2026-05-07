import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getHomeFeed, type FeedItem } from '../api/feed';
import { getFollowedTags } from '../api/tag';
import PostCard from '../components/PostCard';
import { EmptyState, ErrorState } from '../components/ui';
import { toast } from '../components/ui/Toast';
import type { PostCardData } from '../types/board';

type HomeTab = 'recommend' | 'following' | 'trending';

const TABS: { key: HomeTab; label: string }[] = [
  { key: 'recommend', label: '推荐' },
  { key: 'following', label: '关注' },
  { key: 'trending', label: '热榜' },
];

const PAGE_SIZE = 20;

function toPostCardData(item: FeedItem): PostCardData {
  return {
    ...item,
    contentSummary: item.contentSummary || item.content,
  };
}

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const rawTab = searchParams.get('tab') || 'recommend';
  const activeTab: HomeTab = (['recommend', 'following', 'trending'].includes(rawTab) ? rawTab : 'recommend') as HomeTab;

  const [posts, setPosts] = useState<PostCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [hasFollowedTags, setHasFollowedTags] = useState<boolean | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const initialLoadRef = useRef(false);

  const switchTab = (tab: HomeTab) => {
    if (tab === activeTab) return;
    setSearchParams({ tab }, { replace: true });
  };

  const fetchPosts = useCallback(async (pageNum: number, append: boolean) => {
    try {
      if (!append) setLoading(true);
      setError(null);

      const result = await getHomeFeed({
        tab: activeTab,
        page: pageNum,
        limit: PAGE_SIZE,
      });

      const mapped = result.items.map(toPostCardData);
      if (append) {
        setPosts((prev) => [...prev, ...mapped]);
      } else {
        setPosts(mapped);
      }
      setTotal(result.total);
      setHasMore(pageNum * PAGE_SIZE < result.total);
    } catch (err: any) {
      if (!append) setError(err?.message || '加载失败');
      else toast.error('加载更多失败，点击重试');
      if (!append) setPosts([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeTab]);

  // Initial fetch and tab change
  useEffect(() => {
    initialLoadRef.current = true;
    setPage(1);
    setPosts([]);
    fetchPosts(1, false);
  }, [fetchPosts]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !loadingMore && hasMore) {
          setLoadingMore(true);
          const nextPage = page + 1;
          setPage(nextPage);
          fetchPosts(nextPage, true);
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loading, loadingMore, hasMore, page, fetchPosts]);

  // Redirect to login for following tab
  useEffect(() => {
    if (activeTab === 'following' && !isAuthenticated) {
      toast.info('请先登录后查看关注内容');
      navigate('/login');
    }
  }, [activeTab, isAuthenticated, navigate]);

  // Check followed tags when on following tab
  useEffect(() => {
    if (activeTab === 'following' && isAuthenticated) {
      getFollowedTags()
        .then((tags) => setHasFollowedTags(tags.length > 0))
        .catch(() => setHasFollowedTags(false));
    } else {
      setHasFollowedTags(null);
    }
  }, [activeTab, isAuthenticated]);

  const renderContent = () => {
    if (loading) {
      return (
        <div role="status" aria-label="加载中">
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
        </div>
      );
    }

    if (error) {
      return (
        <ErrorState
          title="加载失败"
          description={error}
          onRetry={() => fetchPosts(1, false)}
        />
      );
    }

    if (posts.length === 0) {
      if (activeTab === 'following') {
        if (hasFollowedTags === false) {
          return (
            <EmptyState
              title="你还没有关注的标签"
              description="去版块页面关注感兴趣的标签吧"
              action={
                <Link
                  to="/board/1"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors duration-150"
                >
                  去看看
                </Link>
              }
            />
          );
        }
        return (
          <EmptyState
            title="关注标签下暂无帖子"
            description="关注感兴趣的标签，这里会展示你关注的标签下的帖子"
            action={
              <Link
                to="/board/1"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors duration-150"
              >
                去逛逛
              </Link>
            }
          />
        );
      }
      if (activeTab === 'trending' || activeTab === 'recommend') {
        return (
          <EmptyState
            title="暂无热门帖子"
            description="快去发第一个帖子吧"
            action={
              <Link
                to="/post/new"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors duration-150"
              >
                发布帖子
              </Link>
            }
          />
        );
      }
      return <EmptyState title="暂无内容" />;
    }

    return (
      <div className="post-list flex flex-col gap-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} showBoard />
        ))}
      </div>
    );
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">首页</h1>

      {/* Tab Navigation */}
      <nav className="home-tabs__nav flex border-b border-gray-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => switchTab(tab.key)}
            className={`home-tabs__tab relative px-5 py-2.5 text-sm font-medium transition-colors duration-200 ${
              activeTab === tab.key
                ? 'home-tabs__tab--active text-primary-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-500 rounded-full" />
            )}
          </button>
        ))}
      </nav>

      {/* Content */}
      {renderContent()}

      {/* Scroll sentinel for infinite loading */}
      <div ref={sentinelRef} className="post-list__sentinel h-1" />

      {/* Load more indicator */}
      {loadingMore && (
        <div className="post-list__loading-more flex items-center justify-center gap-2 py-6 text-sm text-gray-400">
          <svg className="w-4 h-4 animate-spin-slow" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          加载中...
        </div>
      )}

      {!hasMore && posts.length > 0 && !loading && (
        <div className="post-list__no-more text-center py-6 text-sm text-gray-400">
          —— 已经到底了 ——
        </div>
      )}
    </div>
  );
}
