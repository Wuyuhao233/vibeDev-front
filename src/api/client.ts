import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '../utils/error';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

let accessToken: string | null = null;
let refreshToken: string | null = null;
let onRefresh: (() => void) | null = null;

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
}

export function onTokenExpired(cb: () => void) {
  onRefresh = cb;
}

// Request interceptor: inject Authorization
client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor: handle errors
client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ errorCode?: string; message?: string }>) => {
    if (!error.response) {
      const msg = '网络连接失败，请检查网络';
      console.error(msg, error);
      return Promise.reject(new ApiError('NETWORK_ERROR', msg));
    }

    const code = error.response.data?.errorCode || `HTTP_${error.response.status}`;
    const message = error.response.data?.message;

    // Auto-refresh token on 401
    if (error.response.status === 401 && refreshToken) {
      try {
        const res = await axios.post('/api/auth/refresh', { refreshToken });
        const { accessToken: newAccess, refreshToken: newRefresh } = res.data.data;
        setTokens(newAccess, newRefresh);
        // Retry original request
        const config = error.config!;
        config.headers.Authorization = `Bearer ${newAccess}`;
        return client(config);
      } catch {
        clearTokens();
        onRefresh?.();
        return Promise.reject(new ApiError('TOKEN_EXPIRED (10002)'));
      }
    }

    return Promise.reject(new ApiError(code, message));
  },
);

export default client;
