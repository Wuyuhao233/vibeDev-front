import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';

vi.mock('../api/auth', () => ({
  login: vi.fn().mockRejectedValue(new Error('test')),
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

const renderLoginPage = () => {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <LoginPage />
    </MemoryRouter>,
  );
};

describe('LoginPage', () => {
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
});
