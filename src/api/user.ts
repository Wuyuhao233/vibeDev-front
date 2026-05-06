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
