import { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { getBoards } from '../api/board';
import type { Board } from '../api/board';
import { getFollowedTags, unfollowTag, type FollowedTag } from '../api/tag';
import { useAuthStore } from '../store/authStore';
import { toast } from '../components/ui';

interface CachedBoards {
  boards: Board[];
  timestamp: number;
}

const CACHE_KEY = 'vibeDev:sidebar:boards';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function loadCache(): Board[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedBoards = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return cached.boards;
  } catch {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

function saveCache(boards: Board[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ boards, timestamp: Date.now() }));
  } catch { /* storage full */ }
}

const COLLAPSED_KEY = 'vibeDev:sidebar:followed-collapsed';

export default function LeftSidebar() {
  const location = useLocation();
  const params = useParams<{ id: string }>();
  const { isAuthenticated } = useAuthStore();
  const [boards, setBoards] = useState<Board[]>(loadCache() || []);
  const [loading, setLoading] = useState(!boards.length);
  const [error, setError] = useState(false);
  const [followedTags, setFollowedTags] = useState<FollowedTag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagsError, setTagsError] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const data = await getBoards();
        const active = data.filter((b: any) => b.status !== 'archived');
        setBoards(active);
        saveCache(active);
        setError(false);
      } catch {
        if (!boards.length) setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchBoards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setFollowedTags([]);
      return;
    }
    setTagsLoading(true);
    setTagsError(false);
    getFollowedTags()
      .then((tags) => {
        setFollowedTags(tags);
        setTagsLoading(false);
      })
      .catch(() => {
        if (isAuthenticated) setTagsError(true);
        setTagsLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleUnfollow = async (tag: FollowedTag) => {
    const prev = followedTags;
    setFollowedTags((tags) => tags.filter((t) => t.id !== tag.id));
    try {
      await unfollowTag(tag.id);
    } catch {
      setFollowedTags(prev);
      toast.error('取消关注失败，请重试');
    }
  };

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSED_KEY, String(next));
    } catch { /* storage full */ }
  };

  const isActive = (board: Board) => {
    if (location.pathname.startsWith('/board/')) {
      return params.id === board.slug;
    }
    return false;
  };

  return (
    <aside className="board-sidebar w-sidebar flex-shrink-0 pr-6">
      <h3 className="board-sidebar__header text-sm font-semibold text-gray-900 mb-3">
        版块导航
      </h3>

      {/* Loading */}
      {loading && (
        <div className="board-sidebar__skeleton flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="board-nav-item--skeleton h-6 w-full animate-shimmer rounded-md bg-gray-200" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="board-sidebar__error py-4 text-center">
          <p className="text-sm text-gray-500 mb-2">版块列表加载失败</p>
          <button
            className="board-sidebar__retry-btn text-sm text-primary-500 hover:text-primary-600 transition-colors duration-150"
            onClick={() => { setLoading(true); setError(false); }}
          >
            重新加载
          </button>
        </div>
      )}

      {/* Board List */}
      {!loading && !error && (
        <ul className="board-sidebar__board-list flex flex-col gap-0.5">
          {boards.map((board) => (
            <li key={board.id}>
              <Link
                to={`/board/${board.slug}`}
                className={`board-nav-item flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors duration-150 ${
                  isActive(board)
                    ? 'board-nav-item--active bg-primary-50 text-primary-500 border-l-[3px] border-primary-500 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {board.icon ? (
                  <img src={board.icon} alt="" className="board-nav-item__icon w-5 h-5 rounded object-cover" />
                ) : (
                  <span className="board-nav-item__icon w-5 h-5 rounded bg-gray-200 flex items-center justify-center text-[10px] text-gray-400">
                    {board.name.charAt(0)}
                  </span>
                )}
                <span className="board-nav-item__name truncate flex-1">{board.name}</span>
                {board.postCount > 0 && (
                  <span className="board-nav-item__count text-xs text-gray-400">{board.postCount}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Divider */}
      <div className="board-sidebar__divider border-t border-gray-100 my-4" />

      {/* My Follows */}
      {isAuthenticated && (
        <div className="board-sidebar__followed">
          <button
            className="board-sidebar__followed-header flex items-center gap-1 text-sm font-semibold text-gray-900 mb-2 w-full text-left"
            onClick={toggleCollapsed}
          >
            <span>我的关注</span>
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${collapsed ? '' : 'rotate-90'}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {!collapsed && (
            <div className="board-sidebar__followed-list">
              {tagsLoading && (
                <div className="flex flex-col gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-5 w-full animate-shimmer rounded bg-gray-200" />
                  ))}
                </div>
              )}

              {tagsError && !tagsLoading && (
                <p className="board-sidebar__followed-error text-sm text-gray-400">
                  加载失败
                </p>
              )}

              {!tagsLoading && !tagsError && followedTags.length === 0 && (
                <p className="board-sidebar__followed-empty text-sm text-gray-400">
                  你还没有关注的标签，去版块页面关注感兴趣的标签吧
                </p>
              )}

              {!tagsLoading && !tagsError && followedTags.length > 0 && (
                <ul className="flex flex-col gap-1">
                  {followedTags.map((tag) => (
                    <li key={tag.id} className="followed-tag group flex items-center justify-between">
                      <Link
                        to={`/board/general?tag=${tag.slug}`}
                        className="followed-tag__name text-sm text-gray-600 hover:text-primary-500 transition-colors duration-150 truncate flex-1"
                      >
                        {tag.name}
                      </Link>
                      <button
                        className="followed-tag__unfollow opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all duration-150 ml-1 flex-shrink-0"
                        onClick={(e) => {
                          e.preventDefault();
                          handleUnfollow(tag);
                        }}
                        title={`取消关注 ${tag.name}`}
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {!isAuthenticated && (
        <div className="board-sidebar__followed">
          <h4 className="board-sidebar__followed-header text-sm font-semibold text-gray-900 mb-2">
            我的关注
          </h4>
          <div className="board-sidebar__followed-list">
            <p className="board-sidebar__followed-empty text-sm text-gray-400">
              关注感兴趣的标签
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
