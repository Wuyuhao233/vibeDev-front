import client from './client';

// Dashboard stats
export async function getDashboardStats() {
  const res = await client.get<{ data: Record<string, number> }>('/admin/stats');
  return res.data.data;
}

// User management
export async function getUsers(params?: { page?: number; pageSize?: number; keyword?: string }) {
  const res = await client.get<{ data: { items: any[]; total: number } }>('/admin/users', { params });
  return res.data.data;
}

export async function banUser(userId: number, reason?: string) {
  await client.post(`/admin/users/${userId}/ban`, { reason });
}

export async function unbanUser(userId: number) {
  await client.post(`/admin/users/${userId}/unban`);
}

// Post management
export async function getAdminPosts(params?: { page?: number; pageSize?: number; keyword?: string }) {
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

// Report management
export async function getReports(params?: { page?: number; pageSize?: number }) {
  const res = await client.get<{ data: { items: any[]; total: number } }>('/admin/reports', {
    params,
  });
  return res.data.data;
}

export async function handleReport(reportId: number, action: 'accept' | 'reject') {
  await client.post(`/admin/reports/${reportId}/handle`, { action });
}
