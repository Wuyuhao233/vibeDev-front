import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import { toast } from '../components/ui/Toast';

const mockLoginApi = vi.fn();
const mockCasLogin = vi.fn();

vi.mock('../api/auth', () => ({
  login: (...args: any[]) => mockLoginApi(...args),
  casLogin: (...args: any[]) => mockCasLogin(...args),
}));

vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn((selector?: (s: any) => any) => {
    const state = {
      login: vi.fn(),
      isAuthenticated: false,
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('../components/ui/Toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

const renderLoginPage = (route = '/login') => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <LoginPage />
    </MemoryRouter>,
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoginApi.mockRejectedValue(new Error('test'));
  });

  it('renders login form', () => {
    renderLoginPage();
    expect(screen.getByRole('heading', { name: '登录' })).toBeTruthy();
    expect(screen.getByPlaceholderText('请输入用户名或邮箱')).toBeTruthy();
    expect(screen.getByPlaceholderText('请输入密码')).toBeTruthy();
    expect(screen.getByText('记住我')).toBeTruthy();
  });

  it('shows validation error for empty username', async () => {
    renderLoginPage();
    const submitBtn = screen.getByRole('button', { name: '登录' });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('请输入用户名或邮箱')).toBeTruthy();
    });
  });

  it('has link to register page', () => {
    renderLoginPage();
    expect(screen.getByText('还没有账号？')).toBeTruthy();
  });

  it('has forgot password link', () => {
    renderLoginPage();
    const link = screen.getByText('忘记密码？');
    expect(link.closest('a')?.getAttribute('href')).toBe('/forgot-password');
  });

  // ─── CAS login button ───

  it('renders CAS login button', () => {
    renderLoginPage();
    expect(screen.getByRole('button', { name: 'CAS 登录' })).toBeTruthy();
  });

  it('renders divider above CAS button', () => {
    renderLoginPage();
    expect(screen.getByText('或')).toBeTruthy();
  });

  it('CAS button redirects on click', async () => {
    // Mock window.location as non-writable
    const originalLocation = window.location;
    // @ts-expect-error: delete for mock
    delete (window as any).location;
    (window as any).location = { href: '' };

    renderLoginPage();
    const casBtn = screen.getByRole('button', { name: 'CAS 登录' });
    await userEvent.click(casBtn);

    expect(window.location.href).toContain('/api/v1/auth/cas/authorize?redirect=');

    // Restore
    (window as any).location = originalLocation;
  });

  // ─── CAS ticket callback ───

  it('handles CAS ticket callback — success', async () => {
    const mockLogin = vi.fn();
    const mockStore = vi.fn((selector?: (s: any) => any) => {
      const state = { login: mockLogin, isAuthenticated: false };
      return selector ? selector(state) : state;
    });
    vi.mocked(
      (await import('../store/authStore')).useAuthStore,
    ).mockImplementation(mockStore);

    mockCasLogin.mockResolvedValueOnce({
      accessToken: 'at',
      refreshToken: 'rt',
      user: { id: 1, username: 'test', email: 't@t.com', avatar: null, level: 1 },
    });

    renderLoginPage('/login?ticket=ST-123&service=https://example.com/login');
    await waitFor(() => {
      expect(mockCasLogin).toHaveBeenCalledWith('ST-123', 'https://example.com/login');
    });
  });

  it('handles CAS ticket callback — error', async () => {
    mockCasLogin.mockRejectedValueOnce(new Error('CAS failed'));

    renderLoginPage('/login?ticket=ST-bad&service=https://example.com/login');
    await waitFor(() => {
      expect(mockCasLogin).toHaveBeenCalledWith('ST-bad', 'https://example.com/login');
    });
  });
});
