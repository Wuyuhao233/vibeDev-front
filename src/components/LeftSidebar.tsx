import { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { getBoards } from '../api/board';
import type { Board } from '../api/board';

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
      return params.id === board.id;
    }
    return false;
  };

  return (
    <aside className="board-sidebar w-sidebar flex-shrink-0 pr-6 sticky top-[5rem] self-start max-h-[calc(100vh-5rem)] overflow-y-auto">
      {/* Loading */}
      {loading && (
        <div className="board-sidebar__skeleton flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="board-nav-item--skeleton h-6 w-full animate-shimmer rounded-md bg-[var(--color-skeleton)]" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="board-sidebar__error py-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">版块列表加载失败</p>
          <button
            className="board-sidebar__retry-btn text-sm text-primary hover:text-primary/80 transition-colors duration-150"
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
                to={`/board/${board.id}`}
                className={`board-nav-item flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[15px] transition-colors duration-150 ${
                  isActive(board)
                    ? 'board-nav-item--active bg-[var(--color-bg-active)] text-primary border-l-[3px] border-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {board.icon ? (
                  <span className="board-nav-item__icon w-6 h-6 flex items-center justify-center text-lg">{board.icon}</span>
                ) : (
                  <span className="board-nav-item__icon w-6 h-6 rounded bg-[var(--color-skeleton)] flex items-center justify-center text-xs text-muted-foreground">
                    {board.name.charAt(0)}
                  </span>
                )}
                <span className="board-nav-item__name truncate flex-1">{board.name}</span>
                {board.postCount > 0 && (
                  <span className="board-nav-item__count text-[13px] text-muted-foreground">{board.postCount}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
