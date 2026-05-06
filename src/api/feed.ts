import client from './client';

export interface FeedItem {
  id: number;
  title: string;
  content: string;
  author: {
    id: number;
    username: string;
    avatar: string | null;
    level: number;
  };
  board: { id: number; name: string };
  tags: string[];
  likeCount: number;
  replyCount: number;
  collectCount: number;
  createdAt: string;
  isPinned: boolean;
  isEssence: boolean;
}

export interface FeedParams {
  page?: number;
  pageSize?: number;
  sort?: 'latest' | 'hot' | 'essence';
  tag?: string;
}

export async function getFeed(params?: FeedParams) {
  const res = await client.get<{ data: { items: FeedItem[]; total: number } }>('/feed', { params });
  return res.data.data;
}
