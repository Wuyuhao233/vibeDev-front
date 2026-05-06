import client from './client';

export interface PostDetail {
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
  viewCount: number;
  isLiked: boolean;
  isCollected: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostData {
  boardId: number;
  title: string;
  content: string;
  tags?: string[];
}

export async function getPost(id: number) {
  const res = await client.get<{ data: PostDetail }>(`/posts/${id}`);
  return res.data.data;
}

export async function createPost(data: CreatePostData) {
  const res = await client.post<{ data: PostDetail }>('/posts', data);
  return res.data.data;
}

export async function updatePost(id: number, data: Partial<CreatePostData>) {
  const res = await client.patch<{ data: PostDetail }>(`/posts/${id}`, data);
  return res.data.data;
}

export async function deletePost(id: number) {
  await client.delete(`/posts/${id}`);
}
