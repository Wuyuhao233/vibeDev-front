import client from './client';

export interface PostDetail {
  id: string;
  title: string;
  contentMarkdown: string;
  contentHtml: string;
  authorId: string;
  boardId: string;
  boardName: string;
  tags: { id: string; name: string; boardId: string; sortOrder: number; postCount: number }[];
  coverImageUrl: string | null;
  author: {
    id: string;
    username: string;
    nickname: string;
    avatarUrl: string | null;
    level: number;
    role: string;
  };
  isCollectedByCurrentUser: boolean;
  isLikedByCurrentUser: boolean;
  likeCount: number;
  replyCount: number;
  collectCount: number;
  shareCount: number;
  isPinned: boolean;
  pinType: string;
  isEssence: boolean;
  auditStatus: string;
  isDeleted: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  lastEditedAt: string | null;
}

export interface CreatePostData {
  boardId: string;
  tagIds: string[];
  title: string;
  content: string;
  coverImageUrl?: string;
  idempotencyKey: string;
}

export interface UpdatePostData {
  title?: string;
  content?: string;
  tagIds?: string[];
  coverImageUrl?: string;
  version: number;
}

export async function getPost(id: string) {
  const res = await client.get<{ data: PostDetail }>(`/posts/${id}`);
  return res.data.data;
}

export async function createPost(data: CreatePostData) {
  const res = await client.post<{ data: PostDetail }>('/posts', data);
  return res.data.data;
}

export async function updatePost(id: string, data: UpdatePostData) {
  const res = await client.put<{ data: PostDetail }>(`/posts/${id}`, data);
  return res.data.data;
}

export async function deletePost(id: string) {
  await client.delete(`/posts/${id}`);
}

export async function recordPostView(id: string) {
  try {
    await client.post(`/posts/${id}/view`);
  } catch {
    // silently fail for view recording
  }
}

export async function collectPost(id: string, folderId?: string) {
  const res = await client.post<{ data: { collected: boolean; newCount: number } }>(
    `/posts/${id}/collect`,
    folderId ? { folderId } : {},
  );
  return res.data.data;
}

export async function uncollectPost(id: string) {
  const res = await client.delete<{ data: { collected: boolean; newCount: number } }>(
    `/posts/${id}/collect`,
  );
  return res.data.data;
}

export async function pinPost(id: string, pinType: 'board' | 'global') {
  const res = await client.post<{ data: { isPinned: boolean; pinType: string } }>(`/posts/${id}/pin`, { pinType });
  return res.data.data;
}

export async function unpinPost(id: string) {
  await client.delete(`/posts/${id}/pin`);
}

export async function toggleEssence(id: string) {
  const res = await client.post<{ data: { isEssence: boolean } }>(`/posts/${id}/essence`);
  return res.data.data;
}

export async function unEssence(id: string) {
  await client.delete(`/posts/${id}/essence`);
}

export async function getShareCard(id: string) {
  const res = await client.get<{ data: { title: string; description: string; coverUrl: string | null; authorName: string; url: string } }>(`/posts/${id}/share-card`);
  return res.data.data;
}

export async function generateShareCard(id: string) {
  const res = await client.post<{ data: { imageUrl: string; width: number; height: number } }>(`/posts/${id}/share-card/generate`);
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
