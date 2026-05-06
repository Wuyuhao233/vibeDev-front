import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';

vi.mock('../api/auth', () => ({
  forgotPassword: vi.fn().mockResolvedValue({ success: true }),
}));

const renderPage = () => {
  return render(
    <MemoryRouter initialEntries={['/forgot-password']}>
      <ForgotPasswordPage />
    </MemoryRouter>,
  );
};

describe('ForgotPasswordPage', () => {
  it('renders forgot password form', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: '找回密码' })).toBeTruthy();
    expect(screen.getByPlaceholderText('example@email.com')).toBeTruthy();
    expect(screen.getByRole('button', { name: '发送重置邮件' })).toBeTruthy();
  });

  it('validates empty email on submit', () => {
    renderPage();
    const form = document.querySelector('form')!;
    fireEvent.submit(form);

    expect(screen.getByText('请输入邮箱')).toBeTruthy();
  });

  it('validates email format on submit', () => {
    renderPage();
    const input = screen.getByPlaceholderText('example@email.com');
    fireEvent.change(input, { target: { value: 'not-an-email' } });
    const form = document.querySelector('form')!;
    fireEvent.submit(form);

    expect(screen.getByText('邮箱格式不正确')).toBeTruthy();
  });

  it('shows success message after valid submit', async () => {
    renderPage();
    const input = screen.getByPlaceholderText('example@email.com');
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    const form = document.querySelector('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('邮件已发送')).toBeTruthy();
    });
  });

  it('has link back to login', () => {
    renderPage();
    const link = screen.getByText('返回登录');
    expect(link.closest('a')?.getAttribute('href')).toBe('/login');
  });
});
