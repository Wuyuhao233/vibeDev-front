import { create } from 'zustand';
import { setTokens as setClientTokens, clearTokens } from '../api/client';
import * as authApi from '../api/auth';

interface User {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  level: number;
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
      await authApi.logout();
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
