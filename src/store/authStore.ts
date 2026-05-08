import { create } from 'zustand';
import { setTokens as setClientTokens, clearTokens } from '../api/client';
import * as authApi from '../api/auth';

export type UserRole = 'admin' | 'moderator' | 'user';

interface User {
  id: string;
  username: string;
  nickname: string;
  avatarUrl: string;
  level: number;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  login: (user, accessToken, refreshToken) => {
    setClientTokens(accessToken, refreshToken);
    set({ user, accessToken, refreshToken, isAuthenticated: true });
  },
  logout: async () => {
    try {
      const rt = useAuthStore.getState().refreshToken;
      if (rt) await authApi.logout(rt);
    } catch {
      // Ignore logout API errors
    }
    clearTokens();
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },
  setTokens: (accessToken, refreshToken) => {
    setClientTokens(accessToken, refreshToken);
    set({ accessToken, refreshToken });
  },
}));

// E2E helper: expose store to Playwright scripts
if (typeof window !== 'undefined') {
  (window as any).__authStore = useAuthStore;
}
