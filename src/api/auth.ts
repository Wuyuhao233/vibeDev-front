import client from './client';

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    username: string;
    nickname: string;
    avatarUrl: string;
    level: number;
    role: string;
  };
}

export async function login(data: LoginRequest) {
  const res = await client.post<{ data: AuthResponse }>('/auth/login', data);
  return res.data.data;
}

export async function register(data: RegisterRequest) {
  await client.post('/auth/register', data);
}

export async function refresh(refreshToken: string) {
  const res = await client.post<{ data: AuthResponse }>('/auth/refresh-token', { refreshToken });
  return res.data.data;
}

export async function logout(refreshToken?: string) {
  await client.post('/auth/logout', refreshToken ? { refreshToken } : undefined);
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

export async function casLogin(ticket: string, service: string) {
  const res = await client.get<{ data: AuthResponse }>(
    `/auth/cas-login?ticket=${encodeURIComponent(ticket)}&service=${encodeURIComponent(service)}`,
  );
  return res.data.data;
}
