import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SettingsPage from '../pages/SettingsPage';

const mockGetMyProfile = vi.fn().mockResolvedValue({
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
});
const mockUpdateProfile = vi.fn().mockResolvedValue({});
const mockUploadAvatar = vi.fn().mockResolvedValue({ url: '/avatar.png' });
const mockChangePassword = vi.fn().mockResolvedValue({});
const mockGetLoginHistory = vi.fn().mockResolvedValue({ items: [], total: 0 });
const mockDeactivateAccount = vi.fn().mockResolvedValue({});
const mockGetCasBinding = vi.fn().mockResolvedValue({ is_bound: false, cas_username: null, bound_at: null });
const mockBindCas = vi.fn().mockResolvedValue({});
const mockUnbindCas = vi.fn().mockResolvedValue({});

vi.mock('../api/user', () => ({
  getMyProfile: (...args: any[]) => mockGetMyProfile(...args),
  updateProfile: (...args: any[]) => mockUpdateProfile(...args),
  uploadAvatar: (...args: any[]) => mockUploadAvatar(...args),
  changePassword: (...args: any[]) => mockChangePassword(...args),
  getLoginHistory: (...args: any[]) => mockGetLoginHistory(...args),
  deactivateAccount: (...args: any[]) => mockDeactivateAccount(...args),
  getCasBinding: (...args: any[]) => mockGetCasBinding(...args),
  bindCas: (...args: any[]) => mockBindCas(...args),
  unbindCas: (...args: any[]) => mockUnbindCas(...args),
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

vi.mock('../api/notification', () => ({
  getNotificationPreferences: vi.fn().mockResolvedValue([]),
  updateNotificationPreference: vi.fn(),
}));

const renderPage = (route = '/settings') => {
  return render(
    <MemoryRouter initialEntries={[route]}>
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
    expect(screen.getByText('通知设置')).toBeTruthy();
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

  // ─── CAS binding tests ───

  it('shows CAS binding section in security tab', async () => {
    renderPage();
    await userEvent.click(screen.getByText('安全设置'));

    await waitFor(() => {
      expect(screen.getByText('CAS 账号绑定')).toBeTruthy();
    });
  });

  it('shows bind button when CAS is not bound', async () => {
    mockGetCasBinding.mockResolvedValue({ is_bound: false, cas_username: null, bound_at: null });
    renderPage();
    await userEvent.click(screen.getByText('安全设置'));

    await waitFor(() => {
      expect(screen.getByText('绑定 CAS 账号')).toBeTruthy();
    });
  });

  it('shows bound state with CAS username', async () => {
    mockGetCasBinding.mockResolvedValue({
      is_bound: true,
      cas_username: 'cas_user',
      bound_at: '2026-01-15T10:30:00Z',
    });
    renderPage();
    await userEvent.click(screen.getByText('安全设置'));

    await waitFor(() => {
      expect(screen.getByText('cas_user')).toBeTruthy();
    });
    expect(screen.getByText('解绑')).toBeTruthy();
  });

  it('opens unbind confirm dialog', async () => {
    mockGetCasBinding.mockResolvedValue({
      is_bound: true,
      cas_username: 'cas_user',
      bound_at: '2026-01-15T10:30:00Z',
    });
    renderPage();
    await userEvent.click(screen.getByText('安全设置'));

    await waitFor(() => {
      expect(screen.getByText('解绑')).toBeTruthy();
    });

    await userEvent.click(screen.getByText('解绑'));

    await waitFor(() => {
      expect(screen.getByText('确认解绑 CAS')).toBeTruthy();
    });
  });
});
