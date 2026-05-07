import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import * as feedApi from '../api/feed';
import { useAuthStore } from '../store/authStore';

vi.mock('../api/feed');

const mockFeedResult = {
  items: [
    {
      id: 1,
      title: 'Test Post 1',
      content: 'Content 1',
      contentSummary: 'Summary 1',
      author: { id: 1, username: 'user1', avatar: null, level: 1 },
      board: { id: 1, name: 'Board 1', slug: 'board-1' },
      tags: [{ id: 1, name: 'tag1', slug: 'tag1' }],
      likeCount: 5,
      replyCount: 3,
      collectCount: 1,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      isPinned: false,
      isEssence: false,
    },
  ],
  total: 1,
};

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(feedApi.getHomeFeed).mockResolvedValue(mockFeedResult);
    // Set auth state
    useAuthStore.setState({ isAuthenticated: true, user: { id: 1, username: 'test', email: 'test@test.com', avatar: null, level: 1 }, accessToken: 'token', refreshToken: 'refresh' });
  });

  function renderHome(route = '/') {
    return render(
      <MemoryRouter initialEntries={[route]}>
        <HomePage />
      </MemoryRouter>
    );
  }

  it('renders three tabs', () => {
    renderHome();
    expect(screen.getByText('推荐')).toBeInTheDocument();
    expect(screen.getByText('关注')).toBeInTheDocument();
    expect(screen.getByText('热榜')).toBeInTheDocument();
  });

  it('defaults to recommend tab', () => {
    renderHome('/');
    expect(screen.getByText('推荐').closest('button')?.className).toContain('home-tabs__tab--active');
  });

  it('shows loading skeleton initially', () => {
    renderHome();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('loads and displays posts', async () => {
    renderHome();
    await waitFor(() => {
      expect(screen.getByText('Test Post 1')).toBeInTheDocument();
    });
  });

  it('shows empty state when no posts', async () => {
    vi.mocked(feedApi.getHomeFeed).mockResolvedValue({ items: [], total: 0 });
    renderHome('/?tab=trending');
    await waitFor(() => {
      expect(screen.getByText('暂无热门帖子')).toBeInTheDocument();
    });
  });

  it('switches tabs on click', async () => {
    vi.mocked(feedApi.getHomeFeed).mockResolvedValue({ items: [], total: 0 });
    renderHome();
    fireEvent.click(screen.getByText('热榜'));
    await waitFor(() => {
      expect(screen.getByText('热榜').closest('button')?.className).toContain('home-tabs__tab--active');
    });
  });

  it('shows error state on API failure', async () => {
    vi.mocked(feedApi.getHomeFeed).mockRejectedValue(new Error('Network error'));
    renderHome();
    await waitFor(() => {
      expect(screen.getByText('加载失败')).toBeInTheDocument();
    });
  });
});
