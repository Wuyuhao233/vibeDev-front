import client from './client';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    username: string;
    email: string;
    avatar: string | null;
    level: number;
  };
}

export async function login(data: LoginRequest) {
  const res = await client.post<{ data: AuthResponse }>('/auth/login', data);
  return res.data.data;
}

export async function register(data: RegisterRequest) {
  const res = await client.post<{ data: AuthResponse }>('/auth/register', data);
  return res.data.data;
}

export async function refresh(refreshToken: string) {
  const res = await client.post<{ data: AuthResponse }>('/auth/refresh', { refreshToken });
  return res.data.data;
}

export async function logout() {
  await client.post('/auth/logout');
}

export async function verifyEmail(token: string) {
  const res = await client.post<{ data: { success: boolean } }>('/auth/verify-email', { token });
  return res.data.data;
}

export async function forgotPassword(email: string) {
  const res = await client.post<{ data: { success: boolean } }>('/auth/forgot-password', { email });
  return res.data.data;
}

export async function checkUsername(username: string) {
  const res = await client.get<{ data: { available: boolean } }>(
    `/auth/check-username?username=${encodeURIComponent(username)}`,
  );
  return res.data.data;
}

export async function resetPassword(token: string, newPassword: string) {
  const res = await client.post<{ data: { success: boolean } }>(
    '/auth/reset-password',
    { token, newPassword },
  );
  return res.data.data;
}
