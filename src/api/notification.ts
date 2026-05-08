import client from './client';

// --- Types (aligned with backend NotificationItem DTO) ---

export interface Notification {
  id: string;
  eventType: string;
  title: string;
  body: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

// Maps backend event_type to frontend display category
export function getNotificationCategory(eventType: string): string {
  const map: Record<string, string> = {
    post_replied: 'reply',
    received_like: 'like',
    post_collected: 'collect',
    reply_quoted: 'mention',
    post_essenced: 'system',
    post_pinned: 'system',
    user_banned: 'system',
  };
  return map[eventType] || 'system';
}

// Extracts navigation path from notification link
export function getNotificationPath(notification: Notification): string | null {
  return notification.link || null;
}

// --- API ---

export async function getNotifications(params?: { page?: number; limit?: number }) {
  const res = await client.get<{
    data: { items: Notification[]; unreadCount: number; total: number };
  }>('/notifications', { params });
  return res.data.data;
}

export async function markAsRead(id: string) {
  await client.put(`/notifications/${id}/read`);
}

export async function markAllAsRead() {
  await client.put('/notifications/read-all');
}

export async function getUnreadCount() {
  const res = await client.get<{ data: { unreadCount: number } }>('/notifications/unread-count');
  return res.data.data.unreadCount;
}

export async function deleteNotification(id: string) {
  await client.delete(`/notifications/${id}`);
}

// ---- Notification Preferences ----

interface BackendPreference {
  eventType: string;
  channel: string;
}

export interface NotificationPreference {
  eventType: string;
  site: boolean;
  email: boolean;
}

let cachedRawPreferences: BackendPreference[] = [];
let mandatoryEvents: string[] = [];

export async function getNotificationPreferences(): Promise<NotificationPreference[]> {
  const res = await client.get<{
    data: { preferences: BackendPreference[]; mandatoryEvents: string[] };
  }>('/users/notify-settings');
  const raw = res.data.data;
  cachedRawPreferences = raw.preferences;
  mandatoryEvents = raw.mandatoryEvents;

  // Transform [{eventType, channel}] → [{eventType, site, email}]
  const map = new Map<string, { site: boolean; email: boolean }>();
  for (const p of raw.preferences) {
    if (!map.has(p.eventType)) map.set(p.eventType, { site: false, email: false });
    map.get(p.eventType)![p.channel as 'site' | 'email'] = true;
  }
  return Array.from(map.entries()).map(([eventType, channels]) => ({
    eventType,
    ...channels,
  }));
}

export async function updateNotificationPreference(
  eventType: string,
  channel: 'site' | 'email',
  enabled: boolean,
): Promise<void> {
  if (enabled) {
    if (!cachedRawPreferences.find((p) => p.eventType === eventType && p.channel === channel)) {
      cachedRawPreferences.push({ eventType, channel });
    }
  } else {
    cachedRawPreferences = cachedRawPreferences.filter(
      (p) => !(p.eventType === eventType && p.channel === channel),
    );
  }

  await client.put('/users/notify-settings', {
    preferences: cachedRawPreferences,
  });
}

export function getMandatoryEvents(): string[] {
  return mandatoryEvents;
}
