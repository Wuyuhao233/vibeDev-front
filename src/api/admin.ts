import client from './client';
import type { DashboardStats } from '../types/admin';

// Dashboard stats
export async function getDashboardStats() {
  const res = await client.get<{ data: DashboardStats }>('/admin/dashboard');
  return res.data.data;
}

// User management
export async function getUsers(params?: { page?: number; limit?: number; search?: string; role?: string; status?: string }) {
  const res = await client.get<{ data: { items: any[]; total: number; page: number; pageSize: number } }>('/admin/users', { params });
  return res.data.data;
}

export async function getUserDetail(userId: string) {
  const res = await client.get<{ data: any }>(`/admin/users/${userId}`);
  return res.data.data;
}

export async function updateUser(userId: string, data: { role?: string; level?: number }) {
  const res = await client.put<{ data: any }>(`/admin/users/${userId}`, data);
  return res.data.data;
}

export async function banUser(userId: string, data: { reason?: string; duration?: string; boardId?: string }) {
  await client.post(`/admin/users/${userId}/ban`, data);
}

export async function unbanUser(userId: string) {
  await client.delete(`/admin/users/${userId}/ban`);
}

// Post management
export async function getAdminPosts(params?: { page?: number; limit?: number; search?: string; boardId?: string; status?: string }) {
  const res = await client.get<{ data: { items: any[]; total: number; page: number; pageSize: number } }>('/admin/posts', { params });
  return res.data.data;
}

export async function pinPost(postId: string) {
  await client.post(`/admin/posts/${postId}/pin`, { pin_type: 'board' });
}

export async function unpinPost(postId: string) {
  await client.post(`/admin/posts/${postId}/pin`, { pin_type: 'board' });
}

export async function markEssence(postId: string) {
  await client.post(`/admin/posts/${postId}/essence`);
}

export async function unmarkEssence(postId: string) {
  await client.post(`/admin/posts/${postId}/essence`);
}

export async function adminDeletePost(postId: string) {
  await client.delete(`/admin/posts/${postId}`);
}

export async function movePost(postId: string, boardId: string) {
  await client.put(`/admin/posts/${postId}/move`, { target_board_id: boardId });
}

// Report management
export async function getReports(params?: { page?: number; pageSize?: number; status?: string; targetType?: string; boardId?: string }) {
  const res = await client.get<{ data: { items: any[]; total: number } }>('/admin/reports', { params });
  return res.data.data;
}

export async function getReportDetail(reportId: string) {
  const res = await client.get<{ data: any }>(`/admin/reports/${reportId}`);
  return res.data.data;
}

export async function handleReport(reportId: string, data: { result: string; resultDescription?: string; banDuration?: string; banReason?: string }) {
  await client.put(`/admin/reports/${reportId}/handle`, data);
}

// Board management
export async function getAdminBoards() {
  const res = await client.get<{ data: any[] }>('/admin/boards');
  return res.data.data;
}

export async function createBoard(data: { name: string; icon?: string; description?: string; tags?: string[] }) {
  const res = await client.post<{ data: any }>('/admin/boards', data);
  return res.data.data;
}

export async function updateBoard(boardId: string, data: { name?: string; description?: string; icon?: string; sortOrder?: number }) {
  const res = await client.put<{ data: any }>(`/admin/boards/${boardId}`, data);
  return res.data.data;
}

export async function deleteBoard(boardId: string) {
  await client.delete(`/admin/boards/${boardId}`);
}

export async function reorderBoards(items: { id: string; sortOrder: number }[]) {
  await client.put('/admin/boards/sort', { items });
}

// Board tags
export async function getBoardTags(boardId: string) {
  const res = await client.get<{ data: any[] }>(`/admin/boards/${boardId}/tags`);
  return res.data.data;
}

export async function createBoardTag(boardId: string, data: { name: string }) {
  const res = await client.post<{ data: any }>(`/admin/boards/${boardId}/tags`, data);
  return res.data.data;
}

export async function updateBoardTag(tagId: string, data: { name?: string; sortOrder?: number }) {
  const res = await client.put<{ data: any }>(`/admin/tags/${tagId}`, data);
  return res.data.data;
}

export async function deleteBoardTag(tagId: string) {
  await client.delete(`/admin/tags/${tagId}`);
}

// Sensitive words
export async function getSensitiveWords(params?: { page?: number; limit?: number; search?: string }) {
  const res = await client.get<{ data: { items: any[]; total: number } }>('/admin/sensitive-words', { params });
  return res.data.data;
}

export async function createSensitiveWord(data: { word: string; matchType: string }) {
  const res = await client.post<{ data: any }>('/admin/sensitive-words', data);
  return res.data.data;
}

export async function updateSensitiveWord(wordId: string, data: { word?: string; matchType?: string }) {
  const res = await client.put<{ data: any }>(`/admin/sensitive-words/${wordId}`, data);
  return res.data.data;
}

export async function deleteSensitiveWord(wordId: string) {
  await client.delete(`/admin/sensitive-words/${wordId}`);
}

export async function toggleSensitiveWord(wordId: string) {
  const res = await client.put<{ data: any }>(`/admin/sensitive-words/${wordId}/toggle`);
  return res.data.data;
}

export async function batchImportSensitiveWords(words: { word: string; matchType: string }[]) {
  const res = await client.post<{ data: { imported: number } }>('/admin/sensitive-words/batch-import', { words });
  return res.data.data;
}

// System settings
export async function getSettings() {
  const res = await client.get<{ data: { settings: Record<string, string> } }>('/admin/settings');
  return res.data.data;
}

export async function updateSetting(key: string, configValue: string) {
  await client.put(`/admin/settings/${key}`, { config_value: configValue });
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

// Appeals (V1.2)
export async function getAppeals(params?: { status?: string; page?: number; pageSize?: number }) {
  const res = await client.get<{ data: import('../types/admin').AppealListResponse }>('/admin/appeals', { params });
  return res.data.data;
}

export async function approveAppeal(id: string) {
  await client.post(`/admin/appeals/${id}/approve`);
}

export async function rejectAppeal(id: string, data: { result: string; note?: string }) {
  await client.post(`/admin/appeals/${id}/reject`, data);
}

// Points recalculation (V1.2)
export async function recalculatePoints() {
  const res = await client.post<{ data: { updatedUsers: number } }>('/admin/points/recalculate');
  return res.data.data;
}

// Moderator assignment (V1.1)
export async function getModeratorList() {
  const res = await client.get<{ data: { items: any[]; total: number } }>('/admin/users', { params: { role: 'moderator', limit: 100 } });
  return res.data.data;
}

export async function assignModerator(userId: string, boardIds: string[]) {
  await client.put('/admin/assign-moderator', { user_id: userId, board_ids: boardIds });
}

export async function removeModerator(userId: string, note?: string) {
  await client.delete('/admin/assign-moderator', { data: { user_id: userId, note } });
}

export async function updateUserRole(userId: string, role: string) {
  await client.put(`/admin/users/${userId}/role`, { role });
}
