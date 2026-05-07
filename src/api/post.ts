import client from './client';

export interface PostDetail {
  id: number;
  title: string;
  content: string;
  contentMarkdown?: string;
  coverImageUrl?: string | null;
  author: {
    id: number;
    username: string;
    avatar: string | null;
    level: number;
  };
  board: { id: number; name: string; slug?: string };
  tags: { id: number; name: string; slug: string }[];
  likeCount: number;
  replyCount: number;
  collectCount: number;
  viewCount: number;
  isLiked: boolean;
  isCollected: boolean;
  isPinned: boolean;
  isEssence: boolean;
  auditStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  auditReason?: string | null;
  appealStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  isDeleted?: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  lastEditedAt?: string | null;
}

export interface CreatePostData {
  boardId: number;
  title: string;
  content: string;
  tags?: number[];
  coverImageUrl?: string;
  idempotencyKey?: string;
}

export interface UpdatePostData {
  title?: string;
  content?: string;
  tags?: number[];
  coverImageUrl?: string;
  version: number;
}

export async function getPost(id: number) {
  const res = await client.get<{ data: PostDetail }>(`/posts/${id}`);
  return res.data.data;
}

export async function createPost(data: CreatePostData) {
  const res = await client.post<{ data: PostDetail }>('/posts', data);
  return res.data.data;
}

export async function updatePost(id: number, data: UpdatePostData) {
  const res = await client.put<{ data: PostDetail }>(`/posts/${id}`, data);
  return res.data.data;
}

export async function deletePost(id: number) {
  await client.delete(`/posts/${id}`);
}

export async function recordPostView(id: number) {
  try {
    await client.post(`/posts/${id}/view`);
  } catch {
    // silently fail for view recording
  }
}

export async function pinPost(id: number, pinType: 'board' | 'global') {
  const res = await client.post<{ data: { success: boolean } }>(`/posts/${id}/pin`, { pinType });
  return res.data.data;
}

export async function unpinPost(id: number) {
  await client.delete(`/posts/${id}/pin`);
}

export async function toggleEssence(id: number) {
  const res = await client.post<{ data: { success: boolean; isEssence: boolean } }>(`/posts/${id}/essence`);
  return res.data.data;
}

export async function getSensitiveWords() {
  const res = await client.get<{ data: string[] }>('/sensitive-words');
  return res.data.data;
}

export async function checkSensitiveWords(text: string) {
  const res = await client.post<{ data: { hits: string[] } }>('/sensitive-words/check', { text });
  return res.data.data;
}
