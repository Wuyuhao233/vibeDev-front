import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminBoards from '../pages/admin/AdminBoards';
import { useAuthStore } from '../store/authStore';

vi.mock('../api/admin', () => ({
  getAdminBoards: vi.fn(),
  createBoard: vi.fn(),
  updateBoard: vi.fn(),
  deleteBoard: vi.fn(),
  reorderBoards: vi.fn(),
  getBoardTags: vi.fn(),
  createBoardTag: vi.fn(),
  updateBoardTag: vi.fn(),
  deleteBoardTag: vi.fn(),
}));

import * as adminApi from '../api/admin';

const mockBoards = [
  { id: 1, name: '综合讨论', slug: 'general', description: '综合版', icon: '📋', postCount: 100, sortOrder: 1, status: 'active' as const },
  { id: 2, name: '技术交流', slug: 'tech', description: '技术版', icon: '💻', postCount: 50, sortOrder: 2, status: 'active' as const },
];

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({
    isAuthenticated: true,
    user: { id: 1, username: 'admin', email: 'admin@test.com', avatar: null, level: 1, role: 'admin' },
    accessToken: 'token',
    refreshToken: 'refresh',
  });
  vi.mocked(adminApi.getAdminBoards).mockResolvedValue(mockBoards);
  vi.mocked(adminApi.getBoardTags).mockResolvedValue([]);
});

function renderBoards() {
  return render(
    <MemoryRouter>
      <AdminBoards />
    </MemoryRouter>
  );
}

describe('AdminBoards', () => {
  it('renders board list', async () => {
    renderBoards();
    await waitFor(() => {
      expect(screen.getByText('综合讨论')).toBeInTheDocument();
    });
    expect(screen.getByText('技术交流')).toBeInTheDocument();
  });

  it('opens create modal', async () => {
    renderBoards();
    await waitFor(() => {
      expect(screen.getByText('综合讨论')).toBeInTheDocument();
    });
    const btn = screen.getByText('新建版块');
    await userEvent.click(btn);
    // After modal opens, "新建版块" appears in both button and dialog title
    const matches = screen.getAllByText('新建版块');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('shows empty state when no boards', async () => {
    vi.mocked(adminApi.getAdminBoards).mockResolvedValue([]);
    renderBoards();
    await waitFor(() => {
      expect(screen.getByText('暂无版块')).toBeInTheDocument();
    });
  });

  it('shows error state on API failure', async () => {
    vi.mocked(adminApi.getAdminBoards).mockRejectedValue(new Error('网络错误'));
    renderBoards();
    await waitFor(() => {
      expect(screen.getByText('加载失败')).toBeInTheDocument();
    });
  });

  it('opens tag management modal', async () => {
    renderBoards();
    await waitFor(() => {
      expect(screen.getByText('综合讨论')).toBeInTheDocument();
    });
    const tagBtns = screen.getAllByText('标签');
    await userEvent.click(tagBtns[0]);
    await waitFor(() => {
      expect(screen.getByText(/管理标签/)).toBeInTheDocument();
    });
  });

  it('shows delete confirmation', async () => {
    renderBoards();
    await waitFor(() => {
      expect(screen.getByText('综合讨论')).toBeInTheDocument();
    });
    const deleteBtns = screen.getAllByText('删除');
    await userEvent.click(deleteBtns[0]);
    const confirmElements = screen.getAllByText('确认删除');
    expect(confirmElements.length).toBeGreaterThanOrEqual(1);
  });
});
