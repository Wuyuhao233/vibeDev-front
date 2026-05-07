import { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { getBoards, type Board } from '../api/board';

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

export default function LeftSidebar() {
  const location = useLocation();
  const params = useParams<{ id: string }>();
  const [boards, setBoards] = useState<Board[]>(loadCache() || []);
  const [loading, setLoading] = useState(!boards.length);
  const [error, setError] = useState(false);

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
    </aside>
  );
}
