import client from './client';
import type { FeedResult } from './feed';

export interface Board {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string | null;
  postCount: number;
  sortOrder: number;
  tags?: { id: number; name: string; slug: string; sortOrder: number }[];
}

export async function getBoards() {
  const res = await client.get<{ data: Board[] }>('/boards');
  return res.data.data;
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
