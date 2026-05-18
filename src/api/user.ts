import client from './client';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  nickname: string;
  signature: string | null;
  avatarUrl: string;
  role: string;
  level: number;
  levelTitle: string;
  points: number;
  isActivated: boolean;
  isBanned: boolean;
  bannedUntil: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

export async function getProfile(username: string) {
  const res = await client.get<{ data: UserProfile }>(`/users/${username}`);
  return res.data.data;
}

export async function getMyProfile() {
  // Backend has no /users/me; use getProfile with current username
  const { useAuthStore } = await import('../store/authStore');
  const username = useAuthStore.getState().user?.username;
  if (!username) throw new Error('Not authenticated');
  return getProfile(username);
}

export async function updateProfile(data: { nickname?: string; signature?: string; avatarUrl?: string }) {
  const res = await client.patch<{ data: UserProfile }>('/users/profile', data);
  return res.data.data;
}

export async function uploadAvatar(file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await client.post<{ data: { avatarUrl: string } }>('/users/me/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

export async function getUserPosts(username: string, page: number, pageSize: number) {
  const res = await client.get<{ data: { items: any[]; total: number } }>(
    `/users/${username}/posts?page=${page}&pageSize=${pageSize}`,
  );
  return res.data.data;
}

export async function getUserReplies(username: string, page: number, pageSize: number) {
  const res = await client.get<{ data: { items: any[]; total: number } }>(
    `/users/${username}/replies?page=${page}&pageSize=${pageSize}`,
  );
  return res.data.data;
}

export async function getFavorites(username: string, page: number, pageSize: number) {
  const res = await client.get<{ data: { items: any[]; total: number } }>(
    `/users/${username}/favorites?page=${page}&pageSize=${pageSize}`,
  );
  return res.data.data;
}

export async function getBrowseHistory(username: string, page: number, pageSize: number) {
  const res = await client.get<{ data: { items: any[]; total: number } }>(
    `/users/${username}/history?page=${page}&pageSize=${pageSize}`,
  );
  return res.data.data;
}

export async function changePassword(oldPassword: string, newPassword: string) {
  const res = await client.put<{ data: any }>('/users/password', { oldPassword, newPassword });
  return res.data.data;
}

export async function getLoginHistory(page: number, pageSize: number) {
  const res = await client.get<{ data: { items: any[]; total: number } }>(
    `/users/login-history?page=${page}&pageSize=${pageSize}`,
  );
  return res.data.data;
}

export async function deactivateAccount(username: string, password: string) {
  const res = await client.post<{ data: any }>(`/users/${username}/deactivate`, { password });
  return res.data.data;
}

export async function recoverAccount(username: string, email: string, password: string) {
  const res = await client.post<{ data: any }>(`/users/${username}/recover`, { email, password });
  return res.data.data;
}

export async function exportData(username: string, scope: string) {
  const res = await client.post<{ data: any }>(`/users/${username}/export-data`, { scope });
  return res.data.data;
}

export async function getExportStatus(username: string, taskId: string) {
  const res = await client.get<{ data: any }>(`/users/${username}/export-data/${taskId}`);
  return res.data.data;
}

export interface CasBindingInfo {
  isBound: boolean;
  casUsername: string | null;
  boundAt: string | null;
}

export async function bindCas(code: string, redirectUri: string) {
  const res = await client.post<{ data: any }>('/users/bind-cas', { code, redirectUri });
  return res.data.data;
}

export async function unbindCas() {
  await client.delete('/users/unbind-cas');
}
