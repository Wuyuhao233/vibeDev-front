import client from './client';

export interface Board {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string | null;
  postCount: number;
  sortOrder: number;
}

export async function getBoards() {
  const res = await client.get<{ data: Board[] }>('/boards');
  return res.data.data;
}

export async function getBoard(idOrSlug: number | string) {
  const res = await client.get<{ data: Board }>(`/boards/${idOrSlug}`);
  return res.data.data;
}
