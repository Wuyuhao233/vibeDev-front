import client from './client';

export interface ReportData {
  targetType: 'post' | 'reply' | 'user';
  targetId: number;
  reason: string;
  description?: string;
}

export async function submitReport(data: ReportData) {
  const res = await client.post<{ data: { success: boolean } }>('/reports', data);
  return res.data.data;
}

export interface AppealData {
  reason: string;
}

export interface AppealResult {
  success: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export async function submitAppeal(postId: number, data: AppealData) {
  const res = await client.post<{ data: AppealResult }>(`/posts/${postId}/appeal`, data);
  return res.data.data;
}
