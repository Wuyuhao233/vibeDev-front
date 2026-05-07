import client from './client';

export interface Notification {
  id: number;
  type: 'reply' | 'like' | 'collect' | 'system' | 'mention';
  message: string;
  targetId: number | null;
  isRead: boolean;
  createdAt: string;
}

export async function getNotifications(params?: { page?: number; pageSize?: number }) {
  const res = await client.get<{ data: { items: Notification[]; total: number; unreadCount: number } }>(
    '/notifications',
    { params },
  );
  return res.data.data;
}

export async function markAsRead(id: number) {
  await client.patch(`/notifications/${id}/read`);
}

export async function markAllAsRead() {
  await client.patch('/notifications/read-all');
}

export async function getUnreadCount() {
  const res = await client.get<{ data: { count: number } }>('/notifications/unread-count');
  return res.data.data.count;
}

export async function deleteNotification(id: number) {
  await client.delete(`/notifications/${id}`);
}

// ---- Notification Preferences ----

export interface NotificationPreference {
  eventType: string;
  site: boolean;
  email: boolean;
}

export async function getNotificationPreferences() {
  const res = await client.get<{ data: { preferences: NotificationPreference[] } }>(
    '/users/me/notification-preferences',
  );
  return res.data.data.preferences;
}

export async function updateNotificationPreference(eventType: string, channel: 'site' | 'email', enabled: boolean) {
  await client.patch(`/users/me/notification-preferences/${eventType}`, { channel, enabled });
}
