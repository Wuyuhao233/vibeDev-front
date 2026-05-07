import client from './client';
import type { DashboardStats } from '../types/admin';

// Dashboard stats
export async function getDashboardStats() {
  const res = await client.get<{ data: DashboardStats }>('/admin/stats');
  return res.data.data;
}

export async function getTrendData(params?: { days?: number }) {
  const res = await client.get<{ data: any[] }>('/admin/stats/trend', { params });
  return res.data.data;
}

// User management
export async function getUsers(params?: { page?: number; pageSize?: number; keyword?: string; role?: string; status?: string }) {
  const res = await client.get<{ data: { items: any[]; total: number } }>('/admin/users', { params });
  return res.data.data;
}

export async function getUserDetail(userId: number) {
  const res = await client.get<{ data: any }>(`/admin/users/${userId}`);
  return res.data.data;
}

export async function updateUser(userId: number, data: { role?: string; level?: number }) {
  const res = await client.put<{ data: any }>(`/admin/users/${userId}`, data);
  return res.data.data;
}

export async function banUser(userId: number, data: { reason?: string; duration?: number }) {
  await client.post(`/admin/users/${userId}/ban`, data);
}

export async function unbanUser(userId: number) {
  await client.post(`/admin/users/${userId}/unban`);
}

// Post management
export async function getAdminPosts(params?: { page?: number; pageSize?: number; keyword?: string; boardId?: number; status?: string; startDate?: string; endDate?: string }) {
  const res = await client.get<{ data: { items: any[]; total: number } }>('/admin/posts', { params });
  return res.data.data;
}

export async function pinPost(postId: number) {
  await client.post(`/admin/posts/${postId}/pin`);
}

export async function unpinPost(postId: number) {
  await client.post(`/admin/posts/${postId}/unpin`);
}

export async function markEssence(postId: number) {
  await client.post(`/admin/posts/${postId}/essence`);
}

export async function unmarkEssence(postId: number) {
  await client.post(`/admin/posts/${postId}/unessence`);
}

export async function adminDeletePost(postId: number) {
  await client.delete(`/admin/posts/${postId}`);
}

export async function movePost(postId: number, boardId: number) {
  await client.post(`/admin/posts/${postId}/move`, { boardId });
}

// Report management
export async function getReports(params?: { page?: number; pageSize?: number; status?: string; type?: string; boardId?: number }) {
  const res = await client.get<{ data: { items: any[]; total: number } }>('/admin/reports', { params });
  return res.data.data;
}

export async function getReportDetail(reportId: number) {
  const res = await client.get<{ data: any }>(`/admin/reports/${reportId}`);
  return res.data.data;
}

export async function handleReport(reportId: number, data: { action: 'ignore' | 'warn' | 'delete_post' | 'ban'; note: string }) {
  await client.post(`/admin/reports/${reportId}/handle`, data);
}

// Board management
export async function getAdminBoards() {
  const res = await client.get<{ data: any[] }>('/admin/boards');
  return res.data.data;
}

export async function createBoard(data: { name: string; slug: string; description?: string; icon?: string }) {
  const res = await client.post<{ data: any }>('/admin/boards', data);
  return res.data.data;
}

export async function updateBoard(boardId: number, data: { name?: string; description?: string; icon?: string; status?: string }) {
  const res = await client.put<{ data: any }>(`/admin/boards/${boardId}`, data);
  return res.data.data;
}

export async function deleteBoard(boardId: number) {
  await client.delete(`/admin/boards/${boardId}`);
}

export async function reorderBoards(boardIds: number[]) {
  await client.post('/admin/boards/reorder', { boardIds });
}

// Board tags
export async function getBoardTags(boardId: number) {
  const res = await client.get<{ data: any[] }>(`/admin/boards/${boardId}/tags`);
  return res.data.data;
}

export async function createBoardTag(boardId: number, data: { name: string; slug: string }) {
  const res = await client.post<{ data: any }>(`/admin/boards/${boardId}/tags`, data);
  return res.data.data;
}

export async function updateBoardTag(tagId: number, data: { name?: string; slug?: string; sortOrder?: number }) {
  const res = await client.put<{ data: any }>(`/admin/tags/${tagId}`, data);
  return res.data.data;
}

export async function deleteBoardTag(tagId: number) {
  await client.delete(`/admin/tags/${tagId}`);
}

// Sensitive words
export async function getSensitiveWords(params?: { page?: number; pageSize?: number; enabled?: boolean; category?: string }) {
  const res = await client.get<{ data: { items: any[]; total: number } }>('/admin/sensitive-words', { params });
  return res.data.data;
}

export async function createSensitiveWord(data: { word: string; category: string }) {
  const res = await client.post<{ data: any }>('/admin/sensitive-words', data);
  return res.data.data;
}

export async function updateSensitiveWord(wordId: number, data: { word?: string; category?: string }) {
  const res = await client.put<{ data: any }>(`/admin/sensitive-words/${wordId}`, data);
  return res.data.data;
}

export async function deleteSensitiveWord(wordId: number) {
  await client.delete(`/admin/sensitive-words/${wordId}`);
}

export async function toggleSensitiveWord(wordId: number) {
  const res = await client.post<{ data: any }>(`/admin/sensitive-words/${wordId}/toggle`);
  return res.data.data;
}

export async function batchImportSensitiveWords(formData: FormData) {
  const res = await client.post<{ data: { imported: number } }>('/admin/sensitive-words/batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

// System settings
export async function getSettings() {
  const res = await client.get<{ data: { items: any[]; total: number } }>('/admin/settings');
  return res.data.data;
}

export async function updateSetting(key: string, value: string) {
  const res = await client.put<{ data: any }>(`/admin/settings/${key}`, { value });
  return res.data.data;
}

// Review queue (V1.1)
export async function getReviewQueue(params?: { status?: string; targetType?: string; page?: number; pageSize?: number }) {
  const res = await client.get<{ data: import('../types/admin').ReviewQueueListResponse }>('/admin/review-queue', { params });
  return res.data.data;
}

export async function approveReviewItem(id: string) {
  await client.post(`/admin/review-queue/${id}/approve`);
}

export async function rejectReviewItem(id: string, reason: string) {
  await client.post(`/admin/review-queue/${id}/reject`, { reason });
}

export async function getReviewStats() {
  const res = await client.get<{ data: import('../types/admin').ReviewStatsResponse }>('/admin/review-stats');
  return res.data.data;
}

// Moderator assignment (V1.1)
export async function getModeratorList() {
  const res = await client.get<{ data: { items: any[]; total: number } }>('/admin/users', { params: { role: 'moderator', limit: '100' } });
  return res.data.data;
}

export async function updateUserRole(userId: string, role: string) {
  const res = await client.put<{ data: any }>(`/admin/users/${userId}/role`, { role });
  return res.data.data;
}
