import client from './client';

export interface Reply {
  id: string;
  contentMarkdown: string;
  contentHtml: string;
  authorId: string;
  postId: string;
  parentReplyId: string | null;
  depth: number;
  author: {
    id: string;
    username: string;
    nickname: string;
    avatarUrl: string | null;
    level: number;
    role: string;
  };
  isLikedByCurrentUser: boolean;
  likeCount: number;
  auditStatus: string;
  isDeleted: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  lastEditedAt: string | null;
  childReplies: Reply[];
}

export interface GetRepliesResult {
  items: Reply[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getReplies(postId: string, params?: { page?: number; limit?: number }) {
  const res = await client.get<{ data: GetRepliesResult }>(
    `/posts/${postId}/replies`,
    { params },
  );
  return res.data.data;
}

export async function createReply(
  postId: string,
  data: { content: string; parentReplyId?: string; idempotencyKey: string },
) {
  const res = await client.post<{ data: Reply }>(`/posts/${postId}/replies`, data);
  return res.data.data;
}

export async function updateReply(replyId: string, data: { content: string; version: number }) {
  const res = await client.put<{ data: Reply }>(`/replies/${replyId}`, data);
  return res.data.data;
}

export async function deleteReply(replyId: string) {
  await client.delete(`/replies/${replyId}`);
}
