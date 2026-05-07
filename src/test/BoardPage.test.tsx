import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import BoardPage from '../pages/BoardPage';
import * as boardApi from '../api/board';
import * as tagApi from '../api/tag';
import { useAuthStore } from '../store/authStore';

vi.mock('../api/board');
vi.mock('../api/tag');

const mockBoard: boardApi.Board = {
  id: 1,
  name: 'General',
  slug: 'general',
  description: 'General discussion board',
  icon: null,
  postCount: 10,
  sortOrder: 1,
  tags: [
    { id: 1, name: 'React', slug: 'react', sortOrder: 1 },
    { id: 2, name: 'TypeScript', slug: 'typescript', sortOrder: 2 },
  ],
};

const mockPostsResult = {
  items: [
    {
      id: 1,
      title: 'Board Post 1',
      content: 'Content',
      author: { id: 1, username: 'user1', avatar: null, level: 2 },
      board: { id: 1, name: 'General', slug: 'general' },
      tags: [{ id: 1, name: 'React', slug: 'react' }],
      likeCount: 3,
      replyCount: 2,
      collectCount: 0,
      createdAt: new Date().toISOString(),
      isPinned: false,
      isEssence: false,
    },
  ],
  total: 1,
};

describe('BoardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ isAuthenticated: false, user: null, accessToken: null, refreshToken: null });
    vi.mocked(boardApi.getBoard).mockResolvedValue(mockBoard);
    vi.mocked(boardApi.getBoardPosts).mockResolvedValue(mockPostsResult);
    vi.mocked(tagApi.getFollowedTags).mockResolvedValue([]);
  });

  function renderBoard(route = '/board/general') {
    return render(
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/board/:id" element={<BoardPage />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('renders board name', async () => {
    renderBoard();
    await waitFor(() => {
      expect(screen.getByText('General')).toBeInTheDocument();
    });
  });

  it('renders board description', async () => {
    renderBoard();
    await waitFor(() => {
      expect(screen.getByText('General discussion board')).toBeInTheDocument();
    });
  });

  it('renders sort switcher with trending option (V1.1)', async () => {
    renderBoard();
    await waitFor(() => {
      expect(screen.getByText('热门')).toBeInTheDocument();
      expect(screen.getByText('最新')).toBeInTheDocument();
      expect(screen.getByText('热榜')).toBeInTheDocument();
    });
  });

  it('renders tag filter bar', async () => {
    renderBoard();
    await waitFor(() => {
      expect(screen.getByText('全部')).toBeInTheDocument();
    });
    const reactButtons = screen.getAllByText('React');
    expect(reactButtons.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('renders posts', async () => {
    renderBoard();
    await waitFor(() => {
      expect(screen.getByText('Board Post 1')).toBeInTheDocument();
    });
  });

  it('shows 404 for non-existent board', async () => {
    vi.mocked(boardApi.getBoard).mockRejectedValue({ message: 'NOT_FOUND (30001)', code: 'NOT_FOUND (30001)' });
    renderBoard();
    await waitFor(() => {
      expect(screen.getByText('版块不存在')).toBeInTheDocument();
    });
  });

  it('shows empty state when no posts', async () => {
    vi.mocked(boardApi.getBoardPosts).mockResolvedValue({ items: [], total: 0 });
    renderBoard();
    await waitFor(() => {
      expect(screen.getByText('该版块暂无帖子')).toBeInTheDocument();
    });
  });

  it('shows tag empty state with return button', async () => {
    vi.mocked(boardApi.getBoardPosts).mockResolvedValue({ items: [], total: 0 });
    renderBoard('/board/general?tag=1');
    await waitFor(() => {
      expect(screen.getByText('该标签下暂无帖子')).toBeInTheDocument();
      expect(screen.getByText('返回全部')).toBeInTheDocument();
    });
  });

  it('updates sort on sort switcher click', async () => {
    renderBoard();
    await waitFor(() => screen.getByText('最新'));
    fireEvent.click(screen.getByText('最新'));
    await waitFor(() => {
      expect(boardApi.getBoardPosts).toHaveBeenCalledWith(
        'general',
        expect.objectContaining({ sort: 'latest' })
      );
    });
  });

  describe('V1.1 followed tags in BoardPage', () => {
    it('fetches followed tags when authenticated', async () => {
      useAuthStore.setState({ isAuthenticated: true, user: { id: 1, username: 'test', email: 'test@test.com', avatar: null, level: 1 }, accessToken: 'token', refreshToken: 'refresh' });
      renderBoard();
      await waitFor(() => {
        expect(tagApi.getFollowedTags).toHaveBeenCalled();
      });
    });

    it('does not fetch followed tags when not authenticated', () => {
      renderBoard();
      expect(tagApi.getFollowedTags).not.toHaveBeenCalled();
    });
  });
});
