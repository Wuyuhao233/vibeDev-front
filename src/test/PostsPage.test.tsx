import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import PostsPage from '../pages/admin/PostsPage';
import { useAuthStore } from '../store/authStore';

vi.mock('../api/admin', () => ({
  getAdminPosts: vi.fn(),
  pinPost: vi.fn(),
  unpinPost: vi.fn(),
  markEssence: vi.fn(),
  unmarkEssence: vi.fn(),
  adminDeletePost: vi.fn(),
  movePost: vi.fn(),
}));

vi.mock('../api/board', () => ({
  getBoards: vi.fn(),
}));

import * as adminApi from '../api/admin';
import * as boardApi from '../api/board';

const mockPosts = [
  { id: 1, title: '测试帖子一', author: { id: 1, username: 'alice', avatar: null }, board: { id: 1, name: '综合讨论' }, status: 'published' as const, isPinned: true, isEssence: false, createdAt: '2026-05-01' },
  { id: 2, title: '测试帖子二', author: { id: 2, username: 'bob', avatar: null }, board: null, status: 'published' as const, isPinned: false, isEssence: true, createdAt: '2026-05-02' },
];

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({
    isAuthenticated: true,
    user: { id: 1, username: 'admin', email: 'admin@test.com', avatar: null, level: 1, role: 'admin' },
    accessToken: 'token',
    refreshToken: 'refresh',
  });
  vi.mocked(adminApi.getAdminPosts).mockResolvedValue({ items: mockPosts, total: 2 });
  vi.mocked(boardApi.getBoards).mockResolvedValue([{ id: 1, name: '综合讨论', slug: 'general', description: '', icon: null, postCount: 10, sortOrder: 1 }]);
});

function renderPosts() {
  return render(
    <MemoryRouter>
      <PostsPage />
    </MemoryRouter>
  );
}

describe('PostsPage', () => {
  it('renders post table', async () => {
    renderPosts();
    await waitFor(() => {
      expect(screen.getByText('测试帖子一')).toBeInTheDocument();
    });
    expect(screen.getByText('测试帖子二')).toBeInTheDocument();
  });

  it('shows pinned and essence badges', async () => {
    renderPosts();
    await waitFor(() => {
      expect(screen.getByText('[置顶]')).toBeInTheDocument();
      expect(screen.getByText('[精]')).toBeInTheDocument();
    });
  });

  it('shows search and filter controls', async () => {
    renderPosts();
    await waitFor(() => {
      expect(screen.getByText('测试帖子一')).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText('搜索标题...')).toBeInTheDocument();
  });

  it('shows empty state when no posts', async () => {
    vi.mocked(adminApi.getAdminPosts).mockResolvedValue({ items: [], total: 0 });
    renderPosts();
    await waitFor(() => {
      expect(screen.getByText('暂无帖子')).toBeInTheDocument();
    });
  });

  it('shows error state on API failure', async () => {
    vi.mocked(adminApi.getAdminPosts).mockRejectedValue(new Error('网络错误'));
    renderPosts();
    await waitFor(() => {
      expect(screen.getByText('加载失败')).toBeInTheDocument();
    });
  });

  it('opens delete confirmation on delete click', async () => {
    renderPosts();
    await waitFor(() => {
      expect(screen.getByText('测试帖子一')).toBeInTheDocument();
    });
    const deleteBtns = screen.getAllByText('删除');
    await userEvent.click(deleteBtns[0]);
    expect(screen.getByText('强制删除帖子')).toBeInTheDocument();
  });
});
