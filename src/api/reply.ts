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
  floorNumber: number;
  likeCount: number;
  isLiked: boolean;
  isDeleted?: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface GetRepliesResult {
  items: Reply[];
  total: number;
}

export async function getReplies(postId: number, params?: { page?: number; pageSize?: number }) {
  const res = await client.get<{ data: GetRepliesResult }>(
    `/posts/${postId}/replies`,
    { params },
  );
  return res.data.data;
}

export async function createReply(postId: number, data: { content: string; parentId?: number }) {
  const res = await client.post<{ data: Reply }>(`/posts/${postId}/replies`, data);
  return res.data.data;
}

export async function updateReply(replyId: number, data: { content: string; version: number }) {
  const res = await client.put<{ data: Reply }>(`/replies/${replyId}`, data);
  return res.data.data;
}

export async function deleteReply(replyId: number) {
  await client.delete(`/replies/${replyId}`);
}
