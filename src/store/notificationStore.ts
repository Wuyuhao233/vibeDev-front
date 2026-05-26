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
    pollTimer = setInterval(() => {
      getUnreadCount()
        .then((count) => set({ unreadCount: count }))
        .catch((err) => {
          // Stop polling if 401/403 (not authenticated)
          if (err?.response?.status === 401 || err?.response?.status === 403) {
            stopPolling();
          }
        });
    }, 30000);
    // Initial fetch
    getUnreadCount()
      .then((count) => set({ unreadCount: count }))
      .catch((err) => {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          stopPolling();
        }
      });
  },
  stopPolling: () => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  },
}));
