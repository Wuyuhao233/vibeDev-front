import client from './client';

export interface Reply {
  id: number;
  content: string;
  author: {
    id: number;
    username: string;
    avatar: string | null;
    level: number;
  };
  parentId: number | null;
  likeCount: number;
  isLiked: boolean;
  createdAt: string;
}

export async function getReplies(postId: number, params?: { page?: number; pageSize?: number }) {
  const res = await client.get<{ data: { items: Reply[]; total: number } }>(
    `/posts/${postId}/replies`,
    { params },
  );
  return res.data.data;
}

export async function createReply(postId: number, data: { content: string; parentId?: number }) {
  const res = await client.post<{ data: Reply }>(`/posts/${postId}/replies`, data);
  return res.data.data;
}

export async function deleteReply(replyId: number) {
  await client.delete(`/replies/${replyId}`);
}
