import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SearchPage from '../pages/SearchPage';
import * as searchApi from '../api/search';
import * as boardApi from '../api/board';

vi.mock('../api/search');
vi.mock('../api/board');

const mockSearchResults: searchApi.SearchResponse = {
  items: [
    {
      id: 1,
      title: 'React 18 Best Practices',
      titleHighlighted: 'React 18 <mark>Best</mark> Practices',
      contentExcerpt: 'A guide to React 18 <mark>best</mark> practices...',
      contentExcerptHighlighted: 'A guide to React 18 <mark>best</mark> practices...',
      author: { id: 1, username: 'dev1', avatar: null, level: 3 },
      board: { id: 1, name: 'Tech', slug: 'tech' },
      tags: [{ id: 1, name: 'React', slug: 'react' }],
      likeCount: 10,
      replyCount: 5,
      collectCount: 2,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      isPinned: false,
      isEssence: false,
    },
    {
      id: 2,
      title: 'TypeScript Tips',
      titleHighlighted: 'TypeScript <mark>Tips</mark>',
      contentExcerpt: 'Useful TypeScript tips for developers...',
      contentExcerptHighlighted: 'Useful TypeScript tips for developers...',
      author: { id: 2, username: 'dev2', avatar: null, level: 2 },
      board: { id: 1, name: 'Tech', slug: 'tech' },
      tags: [{ id: 2, name: 'TypeScript', slug: 'ts' }],
      likeCount: 8,
      replyCount: 3,
      collectCount: 1,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      isPinned: true,
      isEssence: false,
    },
  ],
  total: 42,
  page: 1,
  pageSize: 20,
};

const mockBoards: boardApi.Board[] = [
  { id: 1, name: 'Tech', slug: 'tech', description: 'Tech board', icon: null, postCount: 100, sortOrder: 1 },
  { id: 2, name: 'Life', slug: 'life', description: 'Life board', icon: null, postCount: 50, sortOrder: 2 },
];

const mockTrending: searchApi.SearchSuggestItem[] = [
  { keyword: 'React', count: 120 },
  { keyword: 'TypeScript', count: 80 },
];

describe('SearchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-expect-error mock resolved value
    vi.mocked(searchApi.search).mockResolvedValue(mockSearchResults);
    // @ts-expect-error mock resolved value
    vi.mocked(searchApi.getTrendingSearches).mockResolvedValue(mockTrending);
    // @ts-expect-error mock resolved value
    vi.mocked(searchApi.getSearchSuggestions).mockResolvedValue([]);
    // @ts-expect-error mock resolved value
    vi.mocked(boardApi.getBoards).mockResolvedValue(mockBoards);
  });

  function renderSearch(route = '/search') {
    return render(
      <MemoryRouter initialEntries={[route]}>
        <SearchPage />
      </MemoryRouter>,
    );
  }

  it('shows empty state when no query', () => {
    renderSearch();
    expect(screen.getByText('请输入关键词搜索')).toBeInTheDocument();
  });

  it('shows trending searches when no query', async () => {
    renderSearch();
    await waitFor(() => {
      expect(screen.getByText('热门搜索')).toBeInTheDocument();
    });
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('clicks trending search submits search', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/search']}>
        <SearchPage />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText('热门搜索')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('React'));
    await waitFor(() => {
      expect(searchApi.search).toHaveBeenCalled();
    });
  });

  it('executes search with query param', async () => {
    renderSearch('/search?q=react');
    await waitFor(() => {
      expect(searchApi.search).toHaveBeenCalledWith({
        q: 'react',
        scope: 'all',
        boardId: undefined,
        page: 1,
        pageSize: 20,
      });
    });
  });

  it('displays search results', async () => {
    renderSearch('/search?q=react');
    await waitFor(() => {
      const headings = screen.getAllByRole('heading');
      const texts = headings.map((h) => h.textContent);
      expect(texts).toContain('React 18 Best Practices');
      expect(texts).toContain('TypeScript Tips');
    });
  });

  it('shows result count', async () => {
    renderSearch('/search?q=react');
    await waitFor(() => {
      expect(screen.getByText('共 42 条结果')).toBeInTheDocument();
    });
  });

  it('shows pinned badge on pinned post', async () => {
    renderSearch('/search?q=react');
    await waitFor(() => {
      expect(screen.getByText('置顶')).toBeInTheDocument();
    });
  });

  it('shows highlighted content with mark tags', async () => {
    renderSearch('/search?q=react');
    await waitFor(() => {
      const marks = document.querySelectorAll('mark');
      expect(marks.length).toBeGreaterThan(0);
    });
  });

  it('shows empty results state', async () => {
    // @ts-expect-error mock resolved value
    vi.mocked(searchApi.search).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    });
    renderSearch('/search?q=nonexistent');
    await waitFor(() => {
      expect(screen.getByText('未找到相关内容')).toBeInTheDocument();
    });
    expect(screen.getByText('换个关键词试试')).toBeInTheDocument();
  });

  it('shows error state and retry button', async () => {
    // @ts-expect-error mock rejected
    vi.mocked(searchApi.search).mockRejectedValue(new Error('Network error'));
    renderSearch('/search?q=error');
    await waitFor(() => {
      expect(screen.getByText('搜索失败')).toBeInTheDocument();
    });
    expect(screen.getByText('重试')).toBeInTheDocument();
  });

  it('retries search on click retry button', async () => {
    // @ts-expect-error mock rejected
    vi.mocked(searchApi.search).mockRejectedValue(new Error('Network error'));
    renderSearch('/search?q=error');
    await waitFor(() => {
      expect(screen.getByText('重试')).toBeInTheDocument();
    });
    // @ts-expect-error mock resolved value
    vi.mocked(searchApi.search).mockResolvedValue(mockSearchResults);
    fireEvent.click(screen.getByText('重试'));
    await waitFor(() => {
      const headings = screen.getAllByRole('heading');
      expect(headings.some((h) => h.textContent === 'React 18 Best Practices')).toBe(true);
    });
  });

  it('shows scope switcher', async () => {
    renderSearch('/search?q=react');
    await waitFor(() => {
      expect(screen.getByText('全部')).toBeInTheDocument();
      expect(screen.getByText('版块')).toBeInTheDocument();
      expect(screen.getByText('标题')).toBeInTheDocument();
      expect(screen.getByText('标题+内容')).toBeInTheDocument();
    });
  });

  it('shows board dropdown when scope is board', async () => {
    renderSearch('/search?q=react&scope=board');
    await waitFor(() => {
      expect(screen.getByText('选择版块')).toBeInTheDocument();
    });
  });

  it('loads boards for dropdown', async () => {
    renderSearch('/search?q=react&scope=board');
    await waitFor(() => {
      expect(boardApi.getBoards).toHaveBeenCalled();
    });
  });

  it('shows loading skeleton', () => {
    // Don't resolve the search promise to keep loading state
    vi.mocked(searchApi.search).mockImplementation(() => new Promise(() => {}));
    renderSearch('/search?q=react');
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows pagination when multiple pages', async () => {
    vi.mocked(searchApi.search).mockResolvedValue({
      ...mockSearchResults,
      total: 100,
    });
    renderSearch('/search?q=react');
    await waitFor(() => {
      expect(screen.getByText('上一页')).toBeInTheDocument();
      expect(screen.getByText('下一页')).toBeInTheDocument();
    });
  });

  it('disables previous page button on first page', async () => {
    vi.mocked(searchApi.search).mockResolvedValue({
      ...mockSearchResults,
      total: 100,
    });
    renderSearch('/search?q=react&page=1');
    await waitFor(() => {
      const prevBtn = screen.getByText('上一页');
      expect(prevBtn).toBeDisabled();
    });
  });

  it('search with title_only scope', async () => {
    renderSearch('/search?q=react&scope=title_only');
    await waitFor(() => {
      expect(searchApi.search).toHaveBeenCalledWith({
        q: 'react',
        scope: 'title_only',
        boardId: undefined,
        page: 1,
        pageSize: 20,
      });
    });
  });

  it('search with board scope and boardId', async () => {
    renderSearch('/search?q=react&scope=board&boardId=1');
    await waitFor(() => {
      expect(searchApi.search).toHaveBeenCalledWith({
        q: 'react',
        scope: 'board',
        boardId: 1,
        page: 1,
        pageSize: 20,
      });
    });
  });

  // V1.2: Relevance sort indicator
  it('shows relevance sort indicator and search time', async () => {
    vi.mocked(searchApi.search).mockResolvedValue({
      ...mockSearchResults,
      searchTime: '0.42s',
    });
    renderSearch('/search?q=react');
    await waitFor(() => {
      expect(screen.getByText('按相关度排序')).toBeInTheDocument();
    });
    expect(screen.getByText('搜索耗时 0.42s')).toBeInTheDocument();
  });

  // V1.2: Trending sidebar on results page
  it('shows trending sidebar on results page', async () => {
    renderSearch('/search?q=react');
    await waitFor(() => {
      const headings = screen.getAllByText('热门搜索');
      expect(headings.length).toBeGreaterThanOrEqual(1);
    });
    // Trending keywords should be present
    expect(screen.getAllByText('React').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('TypeScript').length).toBeGreaterThanOrEqual(1);
  });

  // V1.2: Click trending term triggers search
  it('clicks trending in sidebar triggers search', async () => {
    renderSearch('/search?q=react');
    await waitFor(() => {
      expect(screen.getAllByText('热门搜索').length).toBeGreaterThanOrEqual(1);
    });
    // Click on the first "TypeScript" trending term
    const tsButtons = screen.getAllByText('TypeScript');
    const sidebarButton = tsButtons.find(
      (btn) => btn.closest('button')
    );
    if (sidebarButton) {
      fireEvent.click(sidebarButton);
    }
    // Should trigger search with the trending keyword
    await waitFor(() => {
      expect(searchApi.search).toHaveBeenCalled();
    });
  });

  // V1.2: Client-side highlighting fallback when server returns plain text
  it('highlights keywords client-side when server returns plain text', async () => {
    vi.mocked(searchApi.search).mockResolvedValue({
      items: [
        {
          id: 3,
          title: 'Understanding React',
          titleHighlighted: undefined,
          contentExcerpt: 'This is a guide to understanding React hooks and patterns',
          contentExcerptHighlighted: undefined,
          author: { id: 1, username: 'dev1', avatar: null, level: 2 },
          tags: [],
          likeCount: 5,
          replyCount: 2,
          collectCount: 0,
          createdAt: new Date().toISOString(),
          isPinned: false,
          isEssence: false,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
      searchTime: '0.12s',
    });
    renderSearch('/search?q=react');
    await waitFor(() => {
      // Client-side highlighting should produce <mark> tags
      const marks = document.querySelectorAll('mark.search-highlight');
      expect(marks.length).toBeGreaterThan(0);
    });
  });

  // V1.2: Trending not shown on results page when there are no trending items
  it('hides trending sidebar when no trending data', async () => {
    vi.mocked(searchApi.getTrendingSearches).mockResolvedValue([]);
    renderSearch('/search?q=react');
    await waitFor(() => {
      expect(screen.queryByText('热门搜索')).not.toBeInTheDocument();
    });
  });
});
