import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VerifyEmailPage from '../pages/auth/VerifyEmailPage';

vi.mock('../api/auth', () => ({
  verifyEmail: vi.fn().mockResolvedValue({ success: true }),
}));

const renderVerifyEmailPage = (token?: string) => {
  const initialEntries = token ? [`/verify-email?token=${token}`] : ['/verify-email'];
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <VerifyEmailPage />
    </MemoryRouter>,
  );
};

describe('VerifyEmailPage', () => {
  it('shows loading state initially', () => {
    renderVerifyEmailPage('test-token');
    expect(screen.getByText('正在验证邮箱...')).toBeTruthy();
  });

  it('shows error state when no token', () => {
    renderVerifyEmailPage();
    expect(screen.getByText('验证失败')).toBeTruthy();
  });

  it('shows success state after verification', async () => {
    renderVerifyEmailPage('valid-token');
    await waitFor(() => {
      expect(screen.getByText('邮箱验证成功')).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('has a link to login page on success', async () => {
    renderVerifyEmailPage('valid-token');
    await waitFor(() => {
      expect(screen.getByText('立即登录')).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('has link to register on error when no token', () => {
    renderVerifyEmailPage();
    expect(screen.getByText('重新注册')).toBeTruthy();
  });
});
