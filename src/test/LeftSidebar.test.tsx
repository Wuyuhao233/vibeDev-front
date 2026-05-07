import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LeftSidebar from '../components/LeftSidebar';
import * as boardApi from '../api/board';
import * as tagApi from '../api/tag';
import { useAuthStore } from '../store/authStore';
import userEvent from '@testing-library/user-event';

vi.mock('../api/board');
vi.mock('../api/tag');

const mockBoards: boardApi.Board[] = [
  { id: 1, name: 'General', slug: 'general', description: '', icon: null, postCount: 10, sortOrder: 1 },
  { id: 2, name: 'Announcements', slug: 'announcements', description: '', icon: null, postCount: 5, sortOrder: 0 },
];

function setAuth(auth: boolean) {
  if (auth) {
    useAuthStore.setState({ isAuthenticated: true, user: { id: 1, username: 'test', email: 'test@test.com', avatar: null, level: 1 }, accessToken: 'token', refreshToken: 'refresh' });
  } else {
    useAuthStore.setState({ isAuthenticated: false, user: null, accessToken: null, refreshToken: null });
  }
}

describe('LeftSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    setAuth(false);
    vi.mocked(boardApi.getBoards).mockResolvedValue(mockBoards);
    vi.mocked(tagApi.getFollowedTags).mockResolvedValue([]);
  });

  function renderSidebar(route = '/') {
    return render(
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="*" element={<LeftSidebar />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('renders navigation header', () => {
    renderSidebar();
    expect(screen.getByText('版块导航')).toBeInTheDocument();
  });

  it('renders board list after loading', async () => {
    renderSidebar();
    await waitFor(() => {
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Announcements')).toBeInTheDocument();
    });
  });

  it('shows post counts', async () => {
    renderSidebar();
    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('renders "我的关注" section with placeholder when not authenticated', () => {
    renderSidebar();
    expect(screen.getByText('我的关注')).toBeInTheDocument();
    expect(screen.getByText('关注感兴趣的标签')).toBeInTheDocument();
  });

  it('highlights active board', async () => {
    render(
      <MemoryRouter initialEntries={['/board/general']}>
        <Routes>
          <Route path="/board/:id" element={<LeftSidebar />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const link = screen.getByText('General').closest('a');
      expect(link).toBeInTheDocument();
      expect(link?.className).toContain('board-nav-item--active');
    });
  });

  it('shows error state when API fails', async () => {
    vi.mocked(boardApi.getBoards).mockRejectedValue(new Error('Network error'));
    renderSidebar();
    await waitFor(() => {
      expect(screen.getByText('版块列表加载失败')).toBeInTheDocument();
    });
  });

  it('loads from localStorage cache', async () => {
    const cached = JSON.stringify({ boards: mockBoards, timestamp: Date.now() });
    localStorage.setItem('vibeDev:sidebar:boards', cached);
    renderSidebar();
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Announcements')).toBeInTheDocument();
  });

  describe('V1.1 followed tags', () => {
    const mockTags = [
      { id: 1, name: 'React', slug: 'react' },
      { id: 2, name: 'TypeScript', slug: 'typescript' },
    ];

    it('shows followed tags list when authenticated and has tags', async () => {
      setAuth(true);
      vi.mocked(tagApi.getFollowedTags).mockResolvedValue(mockTags);
      renderSidebar();

      await waitFor(() => {
        expect(screen.getByText('React')).toBeInTheDocument();
        expect(screen.getByText('TypeScript')).toBeInTheDocument();
      });
    });

    it('shows empty message when authenticated but no followed tags', async () => {
      setAuth(true);
      vi.mocked(tagApi.getFollowedTags).mockResolvedValue([]);
      renderSidebar();

      await waitFor(() => {
        expect(screen.getByText('你还没有关注的标签，去版块页面关注感兴趣的标签吧')).toBeInTheDocument();
      });
    });

    it('unfollow button appears on hover and removes tag', async () => {
      setAuth(true);
      vi.mocked(tagApi.getFollowedTags).mockResolvedValue(mockTags);
      vi.mocked(tagApi.unfollowTag).mockResolvedValue(undefined);
      const user = userEvent.setup();
      renderSidebar();

      await waitFor(() => {
        expect(screen.getByText('React')).toBeInTheDocument();
      });

      const reactItem = screen.getByText('React').closest('li')!;
      await user.hover(reactItem);

      const unfollowBtn = reactItem.querySelector('.followed-tag__unfollow')!;
      expect(unfollowBtn).toBeInTheDocument();
      await user.click(unfollowBtn);

      await waitFor(() => {
        expect(screen.queryByText('React')).not.toBeInTheDocument();
        expect(tagApi.unfollowTag).toHaveBeenCalledWith(1);
      });
    });

    it('handles unfollow failure by restoring tag', async () => {
      setAuth(true);
      vi.mocked(tagApi.getFollowedTags).mockResolvedValue(mockTags);
      vi.mocked(tagApi.unfollowTag).mockRejectedValue(new Error('fail'));
      const user = userEvent.setup();
      renderSidebar();

      await waitFor(() => {
        expect(screen.getByText('React')).toBeInTheDocument();
      });

      const reactItem = screen.getByText('React').closest('li')!;
      await user.hover(reactItem);
      const unfollowBtn = reactItem.querySelector('.followed-tag__unfollow')!;
      await user.click(unfollowBtn);

      await waitFor(() => {
        expect(screen.getByText('React')).toBeInTheDocument();
      });
    });

    it('collapses and expands followed section', async () => {
      setAuth(true);
      vi.mocked(tagApi.getFollowedTags).mockResolvedValue(mockTags);
      const user = userEvent.setup();
      renderSidebar();

      await waitFor(() => {
        expect(screen.getByText('React')).toBeInTheDocument();
      });

      const header = screen.getByText('我的关注');
      await user.click(header);

      await waitFor(() => {
        expect(screen.queryByText('React')).not.toBeInTheDocument();
      });

      await user.click(header);

      await waitFor(() => {
        expect(screen.getByText('React')).toBeInTheDocument();
      });
    });
  });
});
