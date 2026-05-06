import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SettingsPage from '../pages/SettingsPage';

vi.mock('../api/user', () => ({
  getMyProfile: vi.fn().mockResolvedValue({
    id: 1,
    username: 'testuser',
    email: 'test@test.com',
    avatar: null,
    bio: 'My bio',
    level: 3,
    points: 100,
    postCount: 5,
    replyCount: 10,
    createdAt: '2025-01-01T00:00:00Z',
  }),
  updateProfile: vi.fn().mockResolvedValue({}),
  uploadAvatar: vi.fn().mockResolvedValue({ url: '/avatar.png' }),
  changePassword: vi.fn().mockResolvedValue({}),
  getLoginHistory: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  deactivateAccount: vi.fn().mockResolvedValue({}),
  exportData: vi.fn().mockResolvedValue({ status: 'processing', taskId: 'task-1' }),
  getExportStatus: vi.fn().mockResolvedValue({ status: 'processing' }),
}));

const mockLogout = vi.fn().mockResolvedValue(undefined);

vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn((selector?: (s: any) => any) => {
    const state = {
      user: { id: 1, username: 'testuser', email: 'test@test.com', avatar: null, level: 3 },
      accessToken: 'token',
      refreshToken: 'refresh',
      isAuthenticated: true,
      login: vi.fn(),
      logout: mockLogout,
      setTokens: vi.fn(),
      getState: () => state,
    };
    return selector ? selector(state) : state;
  }),
}));

const renderPage = () => {
  return render(
    <MemoryRouter initialEntries={['/settings']}>
      <SettingsPage />
    </MemoryRouter>,
  );
};

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sidebar navigation', () => {
    renderPage();
    expect(screen.getByText('设置')).toBeTruthy();
    expect(screen.getByText('个人信息')).toBeTruthy();
    expect(screen.getByText('安全设置')).toBeTruthy();
    expect(screen.getByText('数据管理')).toBeTruthy();
  });

  it('shows profile fields after loading', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByDisplayValue('testuser')).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('shows avatar upload button', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('更换头像')).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('switches to security section', async () => {
    renderPage();
    const securityBtn = screen.getByText('安全设置');
    await userEvent.click(securityBtn);

    await waitFor(() => {
      expect(screen.getByText('修改密码')).toBeTruthy();
    });
  });

  it('switches to data section', async () => {
    renderPage();
    const dataBtn = screen.getByText('数据管理');
    await userEvent.click(dataBtn);

    await waitFor(() => {
      expect(screen.getByText('数据导出')).toBeTruthy();
    });
  });

  it('shows deactivate button in security section', async () => {
    renderPage();
    await userEvent.click(screen.getByText('安全设置'));

    await waitFor(() => {
      expect(screen.getByText('注销账号')).toBeTruthy();
    });
  });

  it('shows password change form inputs', async () => {
    renderPage();
    await userEvent.click(screen.getByText('安全设置'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('请输入当前密码')).toBeTruthy();
    });
  });
});
