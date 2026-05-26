import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { getNotifications, markAsRead, getNotificationCategory, getNotificationPath, type Notification } from '../api/notification';
import { toast } from './ui';
import RelativeTime from './ui/RelativeTime';

const TYPE_CONFIG: Record<string, { label: string; icon: string }> = {
  reply: { label: '帖子回复', icon: '💬' },
  like: { label: '被点赞', icon: '❤️' },
  collect: { label: '被收藏', icon: '⭐' },
  system: { label: '系统通知', icon: '📢' },
  mention: { label: '@提及', icon: '📣' },
};

const NOTIFICATION_ICONS: Record<string, string> = {
  reply: '💬',
  like: '❤️',
  collect: '⭐',
  system: '📢',
  mention: '📣',
};

export default function NotificationDropdown() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { unreadCount, setUnreadCount, startPolling, stopPolling } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      startPolling();
      return () => stopPolling();
    } else {
      stopPolling();
    }
  }, [startPolling, stopPolling, isAuthenticated]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getNotifications({ page: 1, limit: 10 })
      .then((data) => {
        setNotifications(data.items);
        setUnreadCount(data.unreadCount);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, setUnreadCount]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClickNotification = useCallback(
    async (notification: Notification) => {
      if (!notification.isRead) {
        try {
          await markAsRead(notification.id);
          setNotifications((prev) =>
            prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
          );
          useNotificationStore.getState().decrement();
        } catch {
          toast.error('标记已读失败');
        }
      }
      const path = getNotificationPath(notification);
      setOpen(false);
      if (path) navigate(path);
    },
    [navigate],
  );

  const handleViewAll = useCallback(() => {
    setOpen(false);
    navigate('/notifications');
  }, [navigate]);

  // Group notifications by category
  const grouped = notifications.reduce<Record<string, Notification[]>>((acc, n) => {
    const cat = getNotificationCategory(n.eventType);
    (acc[cat] ||= []).push(n);
    return acc;
  }, {});

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1.5 text-muted-foreground hover:text-primary hover:bg-muted/50 rounded-md transition-colors duration-150"
        aria-label="通知"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center px-1 font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-card rounded-lg shadow-modal border border-border z-dropdown animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold text-foreground">通知</span>
            <button
              onClick={handleViewAll}
              className="text-xs text-primary hover:text-primary transition-colors duration-150"
            >
              查看全部
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">暂无通知</div>
            ) : (
              Object.entries(grouped).map(([cat, items]) => (
                <div key={cat}>
                  <div className="px-4 py-2 text-xs text-muted-foreground bg-muted/30 font-medium">
                    {TYPE_CONFIG[cat]?.label || cat}
                  </div>
                  {items.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleClickNotification(n)}
                      className={`w-full text-left px-4 py-2.5 flex items-start gap-3 hover:bg-muted/30 transition-colors duration-150 ${
                        !n.isRead ? 'bg-blue-50' : ''
                      }`}
                    >
                      <span className="text-base flex-shrink-0 mt-0.5">
                        {NOTIFICATION_ICONS[getNotificationCategory(n.eventType)]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!n.isRead ? 'text-foreground font-medium' : 'text-foreground/80'}`}>
                          {n.body}
                        </p>
                        <RelativeTime date={n.createdAt} className="text-xs text-muted-foreground" />
                      </div>
                      {!n.isRead && (
                        <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
