import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from '../pages/auth/RegisterPage';

vi.mock('../api/auth', () => ({
  register: vi.fn().mockRejectedValue(new Error('test')),
  checkUsername: vi.fn().mockResolvedValue({ available: true }),
}));

const renderRegisterPage = () => {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <RegisterPage />
    </MemoryRouter>,
  );
};

describe('RegisterPage', () => {
  it('renders registration form heading', () => {
    renderRegisterPage();
    expect(screen.getByRole('heading', { name: '注册' })).toBeTruthy();
  });

  it('renders form fields', () => {
    renderRegisterPage();
    expect(screen.getByPlaceholderText(/3-20/)).toBeTruthy();
    expect(screen.getByPlaceholderText('example@email.com')).toBeTruthy();
    expect(screen.getByPlaceholderText(/至少 8 位/)).toBeTruthy();
    expect(screen.getByPlaceholderText('请再次输入密码')).toBeTruthy();
  });

  it('shows agreement checkbox', () => {
    renderRegisterPage();
    expect(screen.getByText(/用户协议/)).toBeTruthy();
  });

  it('has link to login page', () => {
    renderRegisterPage();
    expect(screen.getByText('已有账号？')).toBeTruthy();
  });

  it('validates email format', async () => {
    renderRegisterPage();
    const emailInput = screen.getByPlaceholderText('example@email.com');
    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.tab();

    await waitFor(() => {
      expect(screen.getByText('邮箱格式不正确')).toBeTruthy();
    });
  });

  it('validates password length', async () => {
    renderRegisterPage();
    const passwordInput = screen.getByPlaceholderText(/至少 8 位/);
    await userEvent.type(passwordInput, 'short');
    await userEvent.tab();

    expect(screen.getByText('密码至少 8 位')).toBeTruthy();
  });

  it('validates confirm password mismatch', async () => {
    renderRegisterPage();
    const passwordInput = screen.getByPlaceholderText(/至少 8 位/);
    const confirmInput = screen.getByPlaceholderText('请再次输入密码');

    await userEvent.type(passwordInput, 'Test1234pass');
    await userEvent.type(confirmInput, 'Different1234');
    await userEvent.tab();

    await waitFor(() => {
      expect(screen.getByText('两次输入的密码不一致')).toBeTruthy();
    });
  });

  it('shows password strength indicator for valid password', async () => {
    renderRegisterPage();
    const passwordInput = screen.getByPlaceholderText(/至少 8 位/);
    await userEvent.type(passwordInput, 'Test1234password');

    await waitFor(() => {
      expect(screen.getByText(/密码强度/)).toBeTruthy();
    });
  });
});
