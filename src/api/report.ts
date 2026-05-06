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
