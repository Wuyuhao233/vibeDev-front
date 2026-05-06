import { describe, it, expect, beforeEach, vi } from 'vitest';

// Must mock client before importing the store
vi.mock('../api/client', () => ({
  setTokens: vi.fn(),
  clearTokens: vi.fn(),
  default: { post: vi.fn().mockResolvedValue({}), get: vi.fn() },
}));

vi.mock('../api/auth', () => ({
  logout: vi.fn().mockResolvedValue({}),
}));

import { useAuthStore } from '../store/authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  });

  it('initial state is unauthenticated', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
  });

  it('login sets user and tokens', () => {
    const user = { id: 1, username: 'test', email: 'test@test.com', avatar: null, level: 1 };
    useAuthStore.getState().login(user, 'access', 'refresh');

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(user);
    expect(state.accessToken).toBe('access');
    expect(state.refreshToken).toBe('refresh');
  });

  it('logout clears state', async () => {
    const user = { id: 1, username: 'test', email: 'test@test.com', avatar: null, level: 1 };
    useAuthStore.getState().login(user, 'access', 'refresh');
    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
  });

  it('setTokens updates tokens only', () => {
    useAuthStore.getState().setTokens('new-access', 'new-refresh');

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('new-access');
    expect(state.refreshToken).toBe('new-refresh');
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });
});
