import client from './client';

export interface LikeToggleResponse {
  liked: boolean;
  newCount: number;
}

export async function addLike(targetType: 'post' | 'reply', targetId: string) {
  const res = await client.post<{ data: LikeToggleResponse }>(
    `/${targetType}s/${targetId}/like`,
  );
  return res.data.data;
}

export async function removeLike(targetType: 'post' | 'reply', targetId: string) {
  const res = await client.delete<{ data: LikeToggleResponse }>(
    `/${targetType}s/${targetId}/like`,
  );
  return res.data.data;
}
