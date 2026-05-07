import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  type Notification,
} from '../api/notification';
import { useNotificationStore } from '../store/notificationStore';
import { toast } from '../components/ui/Toast';
import Pagination from '../components/ui/Pagination';
import RelativeTime from '../components/ui/RelativeTime';
import EmptyState from '../components/ui/EmptyState';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const NOTIFICATION_ICONS: Record<Notification['type'], string> = {
  reply: '💬',
  like: '❤️',
  collect: '⭐',
  system: '📢',
  mention: '📣',
};

const TABS: { key: Notification['type'] | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'reply', label: '帖子回复' },
  { key: 'like', label: '被点赞' },
  { key: 'collect', label: '被收藏' },
  { key: 'system', label: '系统通知' },
];

function getTargetPath(type: Notification['type'], targetId: number | null): string | null {
  if (!targetId) return null;
  if (type === 'reply' || type === 'like' || type === 'collect' || type === 'mention') {
    return `/post/${targetId}`;
  }
  return null;
}

export default function NotificationPage() {
  const navigate = useNavigate();
  const { unreadCount, setUnreadCount, decrement } = useNotificationStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [typeFilter, setTypeFilter] = useState<Notification['type'] | 'all'>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const mountedRef = useRef(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getNotifications({
        page,
        pageSize,
      });
      if (!mountedRef.current) return;
      setNotifications(data.items);
      setTotal(data.total);
      setUnreadCount(data.unreadCount);
    } catch (err: any) {
      if (!mountedRef.current) return;
      setError(err?.message || '加载失败，请重试');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [page, pageSize, setUnreadCount]);

  useEffect(() => {
    mountedRef.current = true;
    fetchNotifications();
    return () => { mountedRef.current = false; };
  }, [fetchNotifications]);

  // Client-side filtering (backend may not support all filter params)
  const filtered = notifications.filter((n) => {
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    if (readFilter === 'unread' && n.isRead) return false;
    if (readFilter === 'read' && !n.isRead) return false;
    return true;
  });

  const handleMarkRead = useCallback(
    async (id: number) => {
      try {
        await markAsRead(id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        );
        decrement();
      } catch {
        toast.error('标记已读失败');
      }
    },
    [decrement],
  );

  const handleDelete = useCallback(async (id: number) => {
    try {
      await deleteNotification(id);
      const wasUnread = notifications.find((n) => n.id === id)?.isRead === false;
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setTotal((t) => t - 1);
      if (wasUnread) decrement();
    } catch {
      toast.error('删除失败');
    }
  }, [notifications, decrement]);

  const handleMarkAllRead = useCallback(async () => {
    setMarkingAll(true);
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('已全部标记为已读');
    } catch {
      toast.error('操作失败');
    } finally {
      setMarkingAll(false);
    }
  }, [setUnreadCount]);

  const handleClickNotification = useCallback(
    async (notification: Notification) => {
      if (!notification.isRead) {
        await handleMarkRead(notification.id);
      }
      const path = getTargetPath(notification.type, notification.targetId);
      if (path) navigate(path);
    },
    [handleMarkRead, navigate],
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">通知中心</h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="text-sm text-primary-500 hover:text-primary-600 disabled:opacity-50 transition-colors duration-150"
          >
            {markingAll ? '处理中...' : '全部已读'}
          </button>
        )}
      </div>

      {/* Type filter tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTypeFilter(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors duration-150 border-b-2 -mb-[1px] ${
              typeFilter === tab.key
                ? 'text-primary-500 border-primary-500'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Read/unread filter */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-gray-500">筛选：</span>
        {([
          { key: 'all', label: '全部' },
          { key: 'unread', label: '未读' },
          { key: 'read', label: '已读' },
        ] as const).map((opt) => (
          <button
            key={opt.key}
            onClick={() => setReadFilter(opt.key)}
            className={`px-3 py-1 text-xs rounded-full transition-colors duration-150 ${
              readFilter === opt.key
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      {error ? (
        <div className="flex flex-col items-center py-16">
          <p className="text-sm text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchNotifications}
            className="px-4 py-2 text-sm text-primary-500 border border-primary-500 rounded-md hover:bg-primary-50 transition-colors duration-150"
          >
            重试
          </button>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="暂无通知"
          description={notifications.length === 0 ? '你还没有收到任何通知' : '没有符合条件的通知'}
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {filtered.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-4 px-5 py-4 border-b border-gray-100 last:border-b-0 transition-colors duration-150 ${
                !n.isRead ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <button
                onClick={() => handleClickNotification(n)}
                className="flex items-start gap-4 flex-1 text-left min-w-0"
              >
                <span className="text-lg flex-shrink-0 mt-0.5">
                  {NOTIFICATION_ICONS[n.type]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.isRead ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                    {n.message}
                  </p>
                  <RelativeTime date={n.createdAt} className="text-xs text-gray-400 mt-0.5" />
                </div>
              </button>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!n.isRead && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkRead(n.id);
                    }}
                    className="px-2 py-1 text-xs text-primary-500 hover:bg-primary-50 rounded transition-colors duration-150"
                  >
                    标记已读
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(n.id);
                  }}
                  className="px-2 py-1 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors duration-150"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination
        current={page}
        total={total}
        pageSize={pageSize}
        onChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
    </div>
  );
}
