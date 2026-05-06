import client from './client';

export async function getLikes(params?: { page?: number; pageSize?: number }) {
  const res = await client.get<{ data: { items: any[]; total: number } }>('/likes', { params });
  return res.data.data;
}

export async function addLike(targetType: 'post' | 'reply', targetId: number) {
  const res = await client.post<{ data: { success: boolean } }>(`/likes`, { targetType, targetId });
  return res.data.data;
}

export async function removeLike(targetType: 'post' | 'reply', targetId: number) {
  await client.delete(`/likes/${targetType}/${targetId}`);
}
