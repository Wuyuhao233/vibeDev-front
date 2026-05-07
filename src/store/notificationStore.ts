import { create } from 'zustand';
import { getUnreadCount } from '../api/notification';

interface NotificationState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  startPolling: () => void;
  stopPolling: () => void;
}

let pollTimer: ReturnType<typeof setInterval> | null = null;

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  increment: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
  decrement: () => set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),
  reset: () => set({ unreadCount: 0 }),
  startPolling: () => {
    if (pollTimer) return;
    getUnreadCount()
      .then((count) => set({ unreadCount: count }))
      .catch(() => {});
    pollTimer = setInterval(() => {
      getUnreadCount()
        .then((count) => set({ unreadCount: count }))
        .catch(() => {});
    }, 30000);
  },
  stopPolling: () => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  },
}));
