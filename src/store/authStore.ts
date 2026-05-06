import { create } from 'zustand';

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
  logout: () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  login: (user, accessToken, refreshToken) =>
    set({ user, accessToken, refreshToken, isAuthenticated: true }),
  logout: () =>
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
  setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
}));
