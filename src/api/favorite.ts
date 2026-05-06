import client from './client';

export async function getFavorites(params?: { page?: number; pageSize?: number }) {
  const res = await client.get<{ data: { items: any[]; total: number } }>('/favorites', { params });
  return res.data.data;
}

export async function addFavorite(postId: number) {
  const res = await client.post<{ data: { success: boolean } }>(`/favorites/${postId}`);
  return res.data.data;
}

export async function removeFavorite(postId: number) {
  await client.delete(`/favorites/${postId}`);
}
