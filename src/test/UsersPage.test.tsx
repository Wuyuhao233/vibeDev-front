import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import UsersPage from '../pages/admin/UsersPage';
import { useAuthStore } from '../store/authStore';

vi.mock('../api/admin', () => ({
  getUsers: vi.fn(),
  updateUser: vi.fn(),
  banUser: vi.fn(),
  unbanUser: vi.fn(),
  getDashboardStats: vi.fn(),
  getTrendData: vi.fn(),
  getAdminPosts: vi.fn(),
  pinPost: vi.fn(),
  unpinPost: vi.fn(),
  markEssence: vi.fn(),
  unmarkEssence: vi.fn(),
  adminDeletePost: vi.fn(),
  movePost: vi.fn(),
  getReports: vi.fn(),
  getReportDetail: vi.fn(),
  handleReport: vi.fn(),
  getAdminBoards: vi.fn(),
  createBoard: vi.fn(),
  updateBoard: vi.fn(),
  deleteBoard: vi.fn(),
  reorderBoards: vi.fn(),
  getBoardTags: vi.fn(),
  createBoardTag: vi.fn(),
  updateBoardTag: vi.fn(),
  deleteBoardTag: vi.fn(),
  getSensitiveWords: vi.fn(),
  createSensitiveWord: vi.fn(),
  updateSensitiveWord: vi.fn(),
  deleteSensitiveWord: vi.fn(),
  toggleSensitiveWord: vi.fn(),
  batchImportSensitiveWords: vi.fn(),
  getSettings: vi.fn(),
  updateSetting: vi.fn(),
  getUserDetail: vi.fn(),
}));

import * as adminApi from '../api/admin';

const mockUsers = [
  { id: 1, username: 'alice', email: 'alice@test.com', avatar: null, role: 'admin' as const, level: 5, points: 1000, status: 'active' as const, bannedUntil: null, createdAt: '2026-01-01' },
  { id: 2, username: 'bob', email: 'bob@test.com', avatar: null, role: 'user' as const, level: 2, points: 200, status: 'active' as const, bannedUntil: null, createdAt: '2026-02-01' },
  { id: 3, username: 'charlie', email: 'charlie@test.com', avatar: null, role: 'user' as const, level: 1, points: 50, status: 'muted' as const, bannedUntil: '2026-06-01', createdAt: '2026-03-01' },
];

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({
    isAuthenticated: true,
    user: { id: 1, username: 'admin', email: 'admin@test.com', avatar: null, level: 1, role: 'admin' },
    accessToken: 'token',
    refreshToken: 'refresh',
  });
  vi.mocked(adminApi.getUsers).mockResolvedValue({ items: mockUsers, total: 3, page: 1, pageSize: 10 });
});

function renderUsers() {
  return render(
    <MemoryRouter>
      <UsersPage />
    </MemoryRouter>
  );
}

describe('UsersPage', () => {
  it('renders user table', async () => {
    renderUsers();
    await waitFor(() => {
      expect(screen.getByText('alice')).toBeInTheDocument();
    });
    expect(screen.getByText('bob')).toBeInTheDocument();
    expect(screen.getByText('charlie')).toBeInTheDocument();
  });

  it('shows user roles', async () => {
    renderUsers();
    await waitFor(() => {
      expect(screen.getByText('管理员')).toBeInTheDocument();
    });
  });

  it('shows user status badges', async () => {
    renderUsers();
    await waitFor(() => {
      expect(screen.getByText('禁言')).toBeInTheDocument();
    });
  });

  it('has search input', async () => {
    renderUsers();
    await waitFor(() => {
      expect(screen.getByText('alice')).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText('搜索用户名/邮箱...')).toBeInTheDocument();
  });

  it('has role and status filter dropdowns', async () => {
    renderUsers();
    await waitFor(() => {
      expect(screen.getByText('alice')).toBeInTheDocument();
    });
    const selects = document.querySelectorAll('select');
    expect(selects.length).toBeGreaterThanOrEqual(2);
  });

  it('opens edit modal on edit click', async () => {
    renderUsers();
    await waitFor(() => {
      expect(screen.getByText('alice')).toBeInTheDocument();
    });
    const editBtns = screen.getAllByText('编辑');
    await userEvent.click(editBtns[0]);
    expect(screen.getByText(/编辑用户/)).toBeInTheDocument();
  });

  it('shows empty state when no users', async () => {
    vi.mocked(adminApi.getUsers).mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 10 });
    renderUsers();
    await waitFor(() => {
      expect(screen.getByText('暂无用户')).toBeInTheDocument();
    });
  });

  it('shows error state on API failure', async () => {
    vi.mocked(adminApi.getUsers).mockRejectedValue(new Error('网络错误'));
    renderUsers();
    await waitFor(() => {
      expect(screen.getByText('加载失败')).toBeInTheDocument();
    });
  });
});
