import client from './client';

export interface FeedItem {
  id: string;
  title: string;
  content?: string;
  contentSummary?: string;
  coverImageUrl?: string | null;
  author: {
    username: string;
    nickname?: string;
    avatarUrl: string | null;
    level: number;
  };
  boardId?: string;
  boardName?: string;
  tags: { id: string; name: string }[];
  likeCount: number;
  replyCount: number;
  collectCount: number;
  createdAt: string;
  isPinned: boolean;
  isEssence: boolean;
  isLiked: boolean;
  isCollected: boolean;
}

export interface FeedResult {
  items: FeedItem[];
  total: number;
}

export async function getHomeFeed(params?: {
  tab?: string;
  page?: number;
  limit?: number;
}) {
  const res = await client.get<{ data: FeedResult }>('/posts', { params });
  return res.data.data;
}
