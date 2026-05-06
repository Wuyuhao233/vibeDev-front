import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';

vi.mock('../api/auth', () => ({
  resetPassword: vi.fn().mockResolvedValue({ success: true }),
}));

const renderPage = (token?: string) => {
  const initialEntries = token ? [`/reset-password?token=${token}`] : ['/reset-password'];
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ResetPasswordPage />
    </MemoryRouter>,
  );
};

describe('ResetPasswordPage', () => {
  it('shows error when no token', () => {
    renderPage();
    expect(screen.getByText('无效的重置链接')).toBeTruthy();
    expect(screen.getByText('重新发起')).toBeTruthy();
  });

  it('renders form when token present', () => {
    renderPage('valid-reset-token');
    expect(screen.getByRole('heading', { name: '重置密码' })).toBeTruthy();
    expect(screen.getByPlaceholderText(/至少 8 位/)).toBeTruthy();
    expect(screen.getByPlaceholderText('请再次输入新密码')).toBeTruthy();
  });

  it('validates password length', async () => {
    renderPage('valid-reset-token');
    const input = screen.getByPlaceholderText(/至少 8 位/);
    await userEvent.type(input, 'short');
    await userEvent.tab();

    await waitFor(() => {
      expect(screen.getByText('密码至少 8 位')).toBeTruthy();
    });
  });

  it('validates password pattern', async () => {
    renderPage('valid-reset-token');
    const input = screen.getByPlaceholderText(/至少 8 位/);
    await userEvent.type(input, 'withoutupperornumber');
    await userEvent.tab();

    await waitFor(() => {
      expect(screen.getByText('密码需包含大小写字母和数字')).toBeTruthy();
    });
  });

  it('validates confirm password match', async () => {
    renderPage('valid-reset-token');
    const passwordInput = screen.getByPlaceholderText(/至少 8 位/);
    const confirmInput = screen.getByPlaceholderText('请再次输入新密码');

    await userEvent.type(passwordInput, 'TestPass1234');
    await userEvent.type(confirmInput, 'Different1234');
    await userEvent.tab();

    await waitFor(() => {
      expect(screen.getByText('两次输入的密码不一致')).toBeTruthy();
    });
  });
});
