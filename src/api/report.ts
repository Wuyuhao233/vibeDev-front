import client from './client';

export interface ReportData {
  targetType: 'post' | 'reply';
  targetId: string;
  reasonType: string;
  description?: string;
}

export async function submitReport(data: ReportData) {
  const res = await client.post<{ data: { success: boolean } }>('/reports', data);
  return res.data.data;
}

export interface CreateAppealData {
  reason: string;
}

export interface AppealResult {
  success: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export async function submitAppeal(reportId: string, data: CreateAppealData) {
  const res = await client.post<{ data: AppealResult }>(`/reports/${reportId}/appeal`, data);
  return res.data.data;
}
