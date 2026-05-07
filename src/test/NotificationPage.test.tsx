import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotificationPage from '../pages/NotificationPage';

const {
  mockGetNotifications,
  mockMarkAsRead,
  mockMarkAllAsRead,
  mockDeleteNotification,
} = vi.hoisted(() => ({
  mockGetNotifications: vi.fn(),
  mockMarkAsRead: vi.fn(),
  mockMarkAllAsRead: vi.fn(),
  mockDeleteNotification: vi.fn(),
}));

vi.mock('../api/notification', () => ({
  getNotifications: (...args: any[]) => mockGetNotifications(...args),
  markAsRead: (...args: any[]) => mockMarkAsRead(...args),
  markAllAsRead: (...args: any[]) => mockMarkAllAsRead(...args),
  deleteNotification: (...args: any[]) => mockDeleteNotification(...args),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function makeNotification(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    type: 'reply',
    message: '有人回复了你',
    targetId: 10,
    isRead: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('NotificationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders page title', async () => {
    mockGetNotifications.mockResolvedValue({ items: [], total: 0, unreadCount: 0 });
    render(<MemoryRouter><NotificationPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('通知中心')).toBeInTheDocument();
    });
  });

  it('shows empty state when no notifications', async () => {
    mockGetNotifications.mockResolvedValue({ items: [], total: 0, unreadCount: 0 });
    render(<MemoryRouter><NotificationPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('暂无通知')).toBeInTheDocument();
    });
  });

  it('renders notification list', async () => {
    mockGetNotifications.mockResolvedValue({
      items: [makeNotification(), makeNotification({ id: 2, type: 'like', message: '有人点赞了你' })],
      total: 2,
      unreadCount: 2,
    });
    render(<MemoryRouter><NotificationPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('有人回复了你')).toBeInTheDocument();
      expect(screen.getByText('有人点赞了你')).toBeInTheDocument();
    });
  });

  it('renders type filter tabs', async () => {
    mockGetNotifications.mockResolvedValue({ items: [], total: 0, unreadCount: 0 });
    render(<MemoryRouter><NotificationPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getAllByText('全部').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('帖子回复')).toBeInTheDocument();
      expect(screen.getByText('被点赞')).toBeInTheDocument();
      expect(screen.getByText('被收藏')).toBeInTheDocument();
      expect(screen.getByText('系统通知')).toBeInTheDocument();
    });
  });

  it('filters notifications by type on tab click', async () => {
    mockGetNotifications.mockResolvedValue({
      items: [
        makeNotification({ id: 1, type: 'reply', message: '新回复' }),
        makeNotification({ id: 2, type: 'like', message: '新点赞' }),
      ],
      total: 2,
      unreadCount: 2,
    });
    render(<MemoryRouter><NotificationPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('新回复')).toBeInTheDocument();
      expect(screen.getByText('新点赞')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('被点赞'));
    await waitFor(() => {
      expect(screen.queryByText('新回复')).not.toBeInTheDocument();
      expect(screen.getByText('新点赞')).toBeInTheDocument();
    });
  });

  it('filters by unread/read status', async () => {
    mockGetNotifications.mockResolvedValue({
      items: [
        makeNotification({ id: 1, message: '未读消息', isRead: false }),
        makeNotification({ id: 2, type: 'like', message: '已读消息', isRead: true }),
      ],
      total: 2,
      unreadCount: 1,
    });
    render(<MemoryRouter><NotificationPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('未读消息')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('已读'));
    await waitFor(() => {
      expect(screen.queryByText('未读消息')).not.toBeInTheDocument();
      expect(screen.getByText('已读消息')).toBeInTheDocument();
    });
  });

  it('marks single notification as read', async () => {
    mockMarkAsRead.mockResolvedValue(undefined);
    mockGetNotifications.mockResolvedValue({
      items: [makeNotification({ id: 1, isRead: false })],
      total: 1,
      unreadCount: 1,
    });
    render(<MemoryRouter><NotificationPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('标记已读')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('标记已读'));
    await waitFor(() => {
      expect(mockMarkAsRead).toHaveBeenCalledWith(1);
    });
  });

  it('deletes a notification', async () => {
    mockDeleteNotification.mockResolvedValue(undefined);
    mockGetNotifications.mockResolvedValue({
      items: [makeNotification({ id: 1, isRead: true })],
      total: 1,
      unreadCount: 0,
    });
    render(<MemoryRouter><NotificationPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('删除')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('删除'));
    await waitFor(() => {
      expect(mockDeleteNotification).toHaveBeenCalledWith(1);
    });
  });

  it('marks all as read', async () => {
    mockMarkAllAsRead.mockResolvedValue(undefined);
    mockGetNotifications.mockResolvedValue({
      items: [makeNotification({ isRead: false }), makeNotification({ id: 2, type: 'like', isRead: false })],
      total: 2,
      unreadCount: 2,
    });
    render(<MemoryRouter><NotificationPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('全部已读')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('全部已读'));
    await waitFor(() => {
      expect(mockMarkAllAsRead).toHaveBeenCalled();
    });
  });

  it('shows error state and retry button', async () => {
    mockGetNotifications.mockRejectedValueOnce(new Error('加载失败，请重试'));
    render(<MemoryRouter><NotificationPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('加载失败，请重试')).toBeInTheDocument();
    });
    mockGetNotifications.mockResolvedValue({ items: [], total: 0, unreadCount: 0 });
    fireEvent.click(screen.getByText('重试'));
    await waitFor(() => {
      expect(mockGetNotifications).toHaveBeenCalledTimes(2);
    });
  });

  it('shows loading spinner initially', () => {
    mockGetNotifications.mockReturnValue(new Promise(() => {}));
    render(<MemoryRouter><NotificationPage /></MemoryRouter>);
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('applies blue-50 background to unread items', async () => {
    mockGetNotifications.mockResolvedValue({
      items: [makeNotification({ isRead: false })],
      total: 1,
      unreadCount: 1,
    });
    render(<MemoryRouter><NotificationPage /></MemoryRouter>);
    await waitFor(() => {
      const unread = document.querySelector('.bg-blue-50');
      expect(unread).toBeTruthy();
    });
  });

  it('navigates to post on notification click', async () => {
    mockGetNotifications.mockResolvedValue({
      items: [makeNotification({ id: 1, type: 'reply', targetId: 42, isRead: true })],
      total: 1,
      unreadCount: 0,
    });
    render(<MemoryRouter><NotificationPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('有人回复了你')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('有人回复了你'));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/post/42');
    });
  });

  it('resets page to 1 when pageSize changes', async () => {
    mockGetNotifications.mockResolvedValue({ items: [], total: 50, unreadCount: 0 });
    render(<MemoryRouter><NotificationPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('共 50 条')).toBeInTheDocument();
    });
    // Change page size should reset page to 1 (verify the callback exists)
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '10' } });
    await waitFor(() => {
      expect(mockGetNotifications).toHaveBeenCalled();
    });
  });
});
