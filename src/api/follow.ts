import client from './client';
import type { UserProfile } from './user';

export async function followUser(username: string) {
  const res = await client.post<{ data: { following: boolean } }>(`/users/${username}/follow`);
  return res.data.data;
}

export async function unfollowUser(username: string) {
  const res = await client.delete<{ data: { following: boolean } }>(`/users/${username}/follow`);
  return res.data.data;
}

export async function checkFollowing(username: string) {
  const res = await client.get<{ data: { following: boolean } }>(`/users/${username}/follow-status`);
  return res.data.data;
}

export async function getUserBrief(username: string) {
  const res = await client.get<{ data: UserProfile }>(`/users/${username}`);
  return res.data.data;
}
