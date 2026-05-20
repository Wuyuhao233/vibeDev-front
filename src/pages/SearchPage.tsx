import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import SearchInput from '../components/SearchInput';
import LevelBadge from '../components/ui/LevelBadge';
import RelativeTime from '../components/ui/RelativeTime';
import AvatarHoverCard from '../components/AvatarHoverCard';
import { formatCount } from '../utils/formatCount';
import { search, getSearchSuggestions, getTrendingSearches } from '../api/search';
import type { SearchScope, SearchResultItem } from '../api/search';
import { getBoards } from '../api/board';

const SCOPE_OPTIONS: { value: SearchScope; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'board', label: '版块' },
  { value: 'title_only', label: '标题' },
  { value: 'title_content', label: '标题+内容' },
];

const COOLDOWN_SECONDS = 3;

function escapeHtml(text: string): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (c) => map[c]);
}

function highlightHtml(text: string, keyword: string): string {
  if (!keyword.trim()) return escapeHtml(text);
  const escaped = escapeHtml(text);
  const escapedKeyword = escapeHtml(keyword.trim());
  const regex = new RegExp(
    escapedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    'gi',
  );
  return escaped.replace(regex, (match) => `<mark class="search-highlight">${match}</mark>`);
}

function renderWithHighlights(html: string) {
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const scope = (searchParams.get('scope') as SearchScope) || 'all';
  const boardId = searchParams.get('boardId') || undefined;
  const page = parseInt(searchParams.get('page') || '1') || 1;

  const [inputValue, setInputValue] = useState(query);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [total, setTotal] = useState(0);
  const [searchTime, setSearchTime] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [boards, setBoards] = useState<Awaited<ReturnType<typeof getBoards>>>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [trending, setTrending] = useState<string[]>([]);
  const [cooldown, setCooldown] = useState(0);
  const [boardDropdownOpen, setBoardDropdownOpen] = useState(false);
  const boardDropdownRef = useRef<HTMLDivElement>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval>>();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Update input value when URL query changes
  useEffect(() => {
    setInputValue(query);
  }, [query]);

  // Load boards for board scope dropdown
  useEffect(() => {
    getBoards()
      .then(setBoards)
      .catch(() => {});
  }, []);

  // Load trending searches
  useEffect(() => {
    getTrendingSearches()
      .then(setTrending)
      .catch(() => {});
  }, []);

  // Close board dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boardDropdownRef.current && !boardDropdownRef.current.contains(e.target as Node)) {
        setBoardDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch suggestions when typing (V1.2)
  useEffect(() => {
    if (!inputValue.trim() || inputValue.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      getSearchSuggestions(inputValue.trim())
        .then(setSuggestions)
        .catch(() => setSuggestions([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // Cooldown cleanup
  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const updateUrl = useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([k, v]) => {
        if (v === undefined || v === '') {
          next.delete(k);
        } else {
          next.set(k, v);
        }
        // Reset page when changing query/scope/board
        if (k !== 'page') next.delete('page');
      });
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const doSearch = useCallback(
    async (q: string, s: SearchScope, bId?: number, p = 1) => {
      if (!q.trim()) {
        setResults([]);
        setTotal(0);
        setSearchTime(undefined);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await search({ q: q.trim(), scope: s, boardId: bId, page: p, limit: 20 });
        setResults(data.items);
        setTotal(data.total);
        setSearchTime(data.searchTime);
      } catch (err: any) {
        setError(err?.message || '搜索失败，请稍后重试');
        setResults([]);
        setTotal(0);
        setSearchTime(undefined);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Execute search on mount and URL changes (debounced to prevent StrictMode double-fire)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(query, scope, boardId, page);
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, scope, boardId, page, doSearch]);

  function handleSubmit(q: string) {
    if (cooldown > 0) return;
    updateUrl({ q, scope: undefined, boardId: undefined });
    startCooldown();
  }

  function startCooldown() {
    setCooldown(COOLDOWN_SECONDS);
    let remaining = COOLDOWN_SECONDS;
    cooldownRef.current = setInterval(() => {
      remaining--;
      setCooldown(remaining);
      if (remaining <= 0) {
        if (cooldownRef.current) clearInterval(cooldownRef.current);
      }
    }, 1000);
  }

  function handleScopeChange(newScope: SearchScope) {
    updateUrl({ scope: newScope === 'all' ? undefined : newScope, boardId: undefined });
  }

  function handleBoardChange(bId: string) {
    updateUrl({ boardId: bId || undefined });
    setBoardDropdownOpen(false);
  }

  function handlePageChange(newPage: number) {
    updateUrl({ page: String(newPage) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const selectedBoard = boards.find((b) => b.id === boardId);

  // Empty state: no query
  if (!query.trim()) {
    return (
      <div className="max-w-content mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Search box */}
          <SearchInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            suggestions={suggestions}
            placeholder="搜索帖子..."
            className="mb-8"
            autoFocus
          />

          {/* Trending searches sidebar (V1.2) */}
          {trending.length > 0 && (
            <div className="mt-12">
              <h3 className="text-lg font-semibold text-foreground mb-4">热门搜索</h3>
              <div className="flex flex-wrap gap-2">
                {trending.map((keyword) => (
                  <button
                    key={keyword}
                    onClick={() => {
                      setInputValue(keyword);
                      handleSubmit(keyword);
                    }}
                    className="inline-flex items-center px-3 py-1.5 text-sm text-foreground/80 bg-muted/50 hover:bg-muted rounded-full transition-colors duration-150"
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              className="text-muted-foreground mb-4"
            >
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p className="text-base font-medium text-muted-foreground">请输入关键词搜索</p>
            <p className="text-sm text-muted-foreground mt-1">搜索帖子标题和内容</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-content mx-auto px-6 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Search box */}
        <SearchInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
          suggestions={suggestions}
          placeholder="搜索帖子..."
          className="mb-6"
        />

        {/* Filter bar: scope + board dropdown */}
        <div className="flex items-center gap-3 mb-6">
          {/* Scope switcher */}
          <div className="inline-flex border border-border rounded-md overflow-hidden">
            {SCOPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleScopeChange(opt.value)}
                className={`px-3 py-1.5 text-sm font-medium transition-all duration-200 border-r border-border last:border-r-0 ${
                  scope === opt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Board dropdown (only when scope=board) */}
          {scope === 'board' && (
            <div className="relative animate-fade-in" ref={boardDropdownRef}>
              <button
                onClick={() => setBoardDropdownOpen(!boardDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-foreground bg-card border border-border rounded-md hover:bg-muted/30 transition-colors duration-150"
              >
                <span>{selectedBoard ? selectedBoard.name : '选择版块'}</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  className={`text-muted-foreground transition-transform duration-200 ${boardDropdownOpen ? 'rotate-180' : ''}`}
                >
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              {boardDropdownOpen && (
                <div className="absolute left-0 top-full mt-1 w-48 bg-card rounded-lg shadow-modal border border-border py-1 z-dropdown animate-fade-in max-h-60 overflow-y-auto">
                  <button
                    onClick={() => handleBoardChange('')}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-muted/50 transition-colors duration-150 ${
                      !boardId ? 'text-primary bg-primary/10' : 'text-foreground'
                    }`}
                  >
                    全部版块
                  </button>
                  {boards.map((board) => (
                    <button
                      key={board.id}
                      onClick={() => handleBoardChange(String(board.id))}
                      className={`w-full text-left px-3 py-1.5 text-sm hover:bg-muted/50 transition-colors duration-150 ${
                        boardId === board.id ? 'text-primary bg-primary/10' : 'text-foreground'
                      }`}
                    >
                      {board.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cooldown indicator */}
        {cooldown > 0 && (
          <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800 animate-fade-in">
            搜索过于频繁，请 {cooldown} 秒后再试
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3" role="status" aria-label="搜索中...">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="skeleton bg-muted rounded-lg h-24 animate-shimmer"
              />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-red-400 mb-4">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p className="text-base font-medium text-red-500 mb-2">搜索失败</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() => doSearch(query, scope, boardId, page)}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors duration-150"
            >
              重试
            </button>
          </div>
        )}

        {/* Results */}
        {!loading && !error && results.length > 0 && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-sm text-muted-foreground">
                共 {total} 条结果
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded-sm px-2 py-0.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
                  <path d="M3 4h2l1 8h10l2-14H7" stroke="currentColor" strokeWidth="2" fill="none" />
                  <circle cx="8.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                按相关度排序
              </span>
              {searchTime && (
                <span className="text-xs text-muted-foreground">
                  搜索耗时 {searchTime}
                </span>
              )}
            </div>

            <div className="flex gap-6">
              {/* Results column */}
              <div className="flex-1 min-w-0 space-y-3">
                {results.map((item) => (
                  <SearchResultCard key={item.id} item={item} query={query} />
                ))}
              </div>

              {/* Trending sidebar */}
              {trending.length > 0 && (
                <div className="hidden lg:block w-56 flex-shrink-0">
                  <div className="sticky top-20">
                    <h4 className="text-sm font-semibold text-foreground mb-3">热门搜索</h4>
                    <div className="space-y-1">
                      {trending.slice(0, 8).map((keyword, i) => (
                        <button
                          key={keyword}
                          onClick={() => {
                            setInputValue(keyword);
                            handleSubmit(keyword);
                          }}
                          className="w-full text-left px-2 py-1.5 text-sm text-foreground/80 hover:bg-muted/50 rounded transition-colors duration-150 flex items-center gap-2"
                        >
                          <span className={`flex-shrink-0 w-4 text-xs font-medium ${i < 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                            {i + 1}
                          </span>
                          <span className="truncate">{keyword}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Trending on mobile (below results) */}
            {trending.length > 0 && (
              <div className="lg:hidden mt-8 pt-6 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground mb-3">热门搜索</h4>
                <div className="flex flex-wrap gap-2">
                  {trending.map((keyword) => (
                    <button
                      key={keyword}
                      onClick={() => {
                        setInputValue(keyword);
                        handleSubmit(keyword);
                      }}
                      className="inline-flex items-center px-3 py-1.5 text-sm text-foreground/80 bg-muted/50 hover:bg-muted rounded-full transition-colors duration-150"
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-sm text-foreground/80 bg-card border border-border rounded-md hover:bg-muted/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  上一页
                </button>
                {generatePages(page, totalPages).map((p, i) =>
                  p === '...' ? (
                    <span key={`dots-${i}`} className="px-2 text-sm text-muted-foreground">...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p as number)}
                      className={`w-8 h-8 text-sm rounded-md transition-colors duration-150 ${
                        page === p
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground/80 bg-card border border-border hover:bg-muted/30'
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 text-sm text-foreground/80 bg-card border border-border rounded-md hover:bg-muted/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  下一页
                </button>
                <span className="ml-4 text-sm text-muted-foreground">
                  共 {total} 条 / {totalPages} 页
                </span>
              </div>
            )}
          </>
        )}

        {/* Empty results */}
        {!loading && !error && results.length === 0 && query.trim() && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="text-muted-foreground mb-4">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p className="text-base font-medium text-muted-foreground mb-1">未找到相关内容</p>
            <p className="text-sm text-muted-foreground">换个关键词试试</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SearchResultCard({ item, query }: { item: SearchResultItem; query: string }) {
  const titleContent = item.titleHighlighted
    ? renderWithHighlights(item.titleHighlighted)
    : item.title;
  const excerptContent = item.contentExcerptHighlighted
    ? renderWithHighlights(item.contentExcerptHighlighted)
    : item.contentExcerpt
      ? (item.contentExcerpt.includes('<mark>')
          ? renderWithHighlights(item.contentExcerpt)
          : renderWithHighlights(highlightHtml(item.contentExcerpt, query)))
      : null;

  return (
    <article
      className="post-card bg-card rounded-lg p-4 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
      onClick={() => {
        window.location.href = `/post/${item.id}`;
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') window.location.href = `/post/${item.id}`;
      }}
    >
      <div className="post-card__main flex gap-4">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-2 mb-1.5">
            {item.isPinned && (
              <span className="inline-flex items-center rounded-sm px-1.5 py-px text-[11px] font-medium text-blue-500 bg-blue-50 flex-shrink-0">
                置顶
              </span>
            )}
            {item.isEssenced && (
              <span className="inline-flex items-center rounded-sm px-1.5 py-px text-[11px] font-medium text-essence bg-amber-50 flex-shrink-0">
                精
              </span>
            )}
            <h3 className="text-lg font-medium text-foreground truncate hover:text-primary transition-colors duration-150">
              {titleContent}
            </h3>
          </div>

          {/* Excerpt */}
          {excerptContent && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2 search-highlight">
              {excerptContent}
            </p>
          )}

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="flex items-center gap-1.5 mb-2">
              {item.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="tag-chip inline-flex items-center rounded px-2 py-px text-xs text-muted-foreground bg-muted/50"
                >
                  {tag.name}
                </span>
              ))}
              {item.tags.length > 3 && (
                <span className="text-xs text-muted-foreground">+{item.tags.length - 3}</span>
              )}
            </div>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <AvatarHoverCard
                username={item.author.username}
                avatarUrl={item.author.avatarUrl}
                nickname={item.author.nickname}
                level={item.author.level}
                size="sm"
                onClick={() => navigate(`/u/${item.author.username}`)}
              />
              <span className="text-sm text-foreground font-semibold hover:text-primary cursor-pointer transition-colors duration-150" onClick={() => navigate(`/u/${item.author.username}`)}>{item.author.nickname || item.author.username}</span>
              <LevelBadge level={Math.min(Math.max(item.author.level, 1), 6) as 1 | 2 | 3 | 4 | 5 | 6} />
            </div>
            <RelativeTime date={item.createdAt} className="text-xs text-muted-foreground" />
            {item.boardName && (
              <span className="text-xs text-muted-foreground">{item.boardName}</span>
            )}
            <div className="flex items-center gap-3 ml-auto">
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
                {formatCount(item.likeCount)}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
                {formatCount(item.replyCount)}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
                {formatCount(item.bookmarkCount)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function generatePages(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}
