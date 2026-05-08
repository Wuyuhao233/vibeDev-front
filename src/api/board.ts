import client from './client';
import type { FeedResult } from './feed';

export interface Board {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  postCount: number;
  sortOrder: number;
  tags?: { id: string; name: string; sortOrder: number }[];
}

export async function getBoards() {
  const res = await client.get<{ data: { boards: Board[] } }>('/boards');
  return res.data.data.boards;
}

export async function getBoard(idOrSlug: number | string) {
  const res = await client.get<{ data: Board }>(`/boards/${idOrSlug}`);
  return res.data.data;
}

export interface BoardPostsParams {
  tag?: string;
  sort?: 'hot' | 'latest' | 'trending';
  page?: number;
  limit?: number;
}

export async function getBoardPosts(idOrSlug: number | string, params?: BoardPostsParams) {
  const res = await client.get<{ data: FeedResult }>(`/boards/${idOrSlug}/posts`, { params });
  return res.data.data;
}
