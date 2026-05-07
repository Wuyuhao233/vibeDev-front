import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import CheckInButton from '../components/CheckInButton';
import * as pointsApi from '../api/points';
import { useAuthStore } from '../store/authStore';

vi.mock('../api/points');

function setAuth(authed: boolean) {
  if (authed) {
    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: 1, username: 'testuser', email: 'test@test.com', avatar: null, level: 3 },
      accessToken: 'token',
      refreshToken: 'refresh',
    });
  } else {
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
    });
  }
}

describe('CheckInButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    setAuth(false);
  });

  function renderButton() {
    return render(
      <MemoryRouter>
        <CheckInButton />
      </MemoryRouter>,
    );
  }

  it('renders nothing when not authenticated', () => {
    const { container } = renderButton();
    expect(container.textContent).toBe('');
  });

  it('renders check-in button when authenticated', () => {
    setAuth(true);
    renderButton();
    expect(screen.getByText('签到')).toBeInTheDocument();
  });

  it('shows "已签到" when already checked in today', () => {
    setAuth(true);
    const today = new Date().toISOString().slice(0, 10);
    sessionStorage.setItem(`vibeDev:checkin:${today}`, 'true');
    renderButton();
    expect(screen.getByText('已签到')).toBeInTheDocument();
  });

  it('button is disabled after check-in', () => {
    setAuth(true);
    const today = new Date().toISOString().slice(0, 10);
    sessionStorage.setItem(`vibeDev:checkin:${today}`, 'true');
    renderButton();
    expect(screen.getByText('已签到').closest('button')).toBeDisabled();
  });

  it('calls signIn API on click and shows success toast', async () => {
    setAuth(true);
    vi.mocked(pointsApi.signIn).mockResolvedValue({ points: 5, consecutiveDays: 3 });
    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByText('签到'));

    await waitFor(() => {
      expect(pointsApi.signIn).toHaveBeenCalledWith('testuser');
      expect(screen.getByText('已签到')).toBeInTheDocument();
    });
  });

  it('shows bonus message for consecutive days >= 7', async () => {
    setAuth(true);
    vi.mocked(pointsApi.signIn).mockResolvedValue({ points: 10, consecutiveDays: 7 });
    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByText('签到'));

    await waitFor(() => {
      expect(screen.getByText('已签到')).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    setAuth(true);
    vi.mocked(pointsApi.signIn).mockRejectedValue(new Error('fail'));
    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByText('签到'));

    await waitFor(() => {
      expect(screen.getByText('签到')).toBeInTheDocument();
    });
  });
});
