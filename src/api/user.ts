import client from './client';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  level: number;
  points: number;
  postCount: number;
  replyCount: number;
  createdAt: string;
}

export async function getProfile(username: string) {
  const res = await client.get<{ data: UserProfile }>(`/users/${username}`);
  return res.data.data;
}

export async function updateProfile(data: Partial<Pick<UserProfile, 'bio' | 'avatar'>>) {
  const res = await client.patch<{ data: UserProfile }>('/users/me', data);
  return res.data.data;
}

export async function uploadAvatar(file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await client.post<{ data: { url: string } }>('/users/me/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

export async function getUserPosts(username: string, page: number, limit: number) {
  const res = await client.get<{ data: { items: any[]; total: number } }>(
    `/users/${username}/posts?page=${page}&limit=${limit}`,
  );
  return res.data.data;
}

export async function getUserReplies(username: string, page: number, limit: number) {
  const res = await client.get<{ data: { items: any[]; total: number } }>(
    `/users/${username}/replies?page=${page}&limit=${limit}`,
  );
  return res.data.data;
}

export async function getCollections(username: string, page: number, limit: number) {
  const res = await client.get<{ data: { items: any[]; total: number } }>(
    `/users/${username}/collections?page=${page}&limit=${limit}`,
  );
  return res.data.data;
}

export async function getBrowseHistory(page: number, limit: number) {
  const res = await client.get<{ data: { items: any[]; total: number } }>(
    `/users/me/browse-history?page=${page}&limit=${limit}`,
  );
  return res.data.data;
}

export async function getMyProfile() {
  const res = await client.get<{ data: UserProfile }>('/users/me');
  return res.data.data;
}

export async function changePassword(oldPassword: string, newPassword: string) {
  const res = await client.put<{ data: any }>('/users/me/password', { oldPassword, newPassword });
  return res.data.data;
}

export async function getLoginHistory(page: number, limit: number) {
  const res = await client.get<{ data: { items: any[]; total: number } }>(
    `/users/me/login-history?page=${page}&limit=${limit}`,
  );
  return res.data.data;
}

export async function deactivateAccount(password: string) {
  const res = await client.post<{ data: any }>('/users/me/deactivate', { password });
  return res.data.data;
}

export async function recoverAccount(email: string, password: string) {
  const res = await client.post<{ data: any }>('/users/recover', { email, password });
  return res.data.data;
}

export async function exportData(scope: string) {
  const res = await client.post<{ data: any }>('/users/me/export-data', { scope });
  return res.data.data;
}

export async function getExportStatus(taskId: string) {
  const res = await client.get<{ data: any }>(`/users/me/export-data/${taskId}`);
  return res.data.data;
}
