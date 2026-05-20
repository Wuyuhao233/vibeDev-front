import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '../utils/error';

// camelCase ↔ snake_case key transformation
function toSnakeCase(key: string): string {
  return key.replace(/([A-Z])/g, '_$1').toLowerCase();
}

function toCamelCase(key: string): string {
  return key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function transformKeys(obj: unknown, transform: (key: string) => string): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((v) => transformKeys(v, transform));
  if (typeof obj === 'object' && !(obj instanceof FormData) && !(obj instanceof File) && !(obj instanceof Blob)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[transform(key)] = transformKeys(value, transform);
    }
    return result;
  }
  return obj;
}

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
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

/** Restore tokens from persisted state (called on app startup) */
export function initTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
}

export function onTokenExpired(cb: () => void) {
  onRefresh = cb;
}

// Request interceptor: convert camelCase → snake_case + inject Authorization
client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (config.data && !(config.data instanceof FormData) && !(config.data instanceof File) && !(config.data instanceof Blob)) {
    config.data = transformKeys(config.data, toSnakeCase);
  }
  // When sending FormData/File/Blob, remove default Content-Type so browser sets multipart boundary
  if (config.data instanceof FormData || config.data instanceof File || config.data instanceof Blob) {
    delete config.headers['Content-Type'];
  }
  if (config.params) {
    config.params = transformKeys(config.params, toSnakeCase);
  }
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor: snake_case → camelCase + handle errors + business error rejection
client.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = transformKeys(response.data, toCamelCase);
    }
    // Reject business errors returned with HTTP 200 but non-zero code
    if (response.data && typeof response.data.code === 'number' && response.data.code !== 0) {
      const errorCode = String(response.data.code);
      const message = response.data.message || '请求失败';
      return Promise.reject(new ApiError(errorCode, message));
    }
    return response;
  },
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
        const res = await axios.post('/api/v1/auth/refresh-token', { refresh_token: refreshToken });
        const { access_token: newAccess, refresh_token: newRefresh } = res.data.data;
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
