import client from './client';

export interface FollowedTag {
  id: number;
  name: string;
  slug: string;
}

export async function getFollowedTags() {
  const res = await client.get<{ data: FollowedTag[] }>('/user/followed-tags');
  return res.data.data;
}

export async function followTag(tagId: number) {
  await client.post(`/tags/${tagId}/follow`);
}

export async function unfollowTag(tagId: number) {
  await client.delete(`/tags/${tagId}/follow`);
}
