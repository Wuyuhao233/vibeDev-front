import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotificationDropdown from '../components/NotificationDropdown';
import { useNotificationStore } from '../store/notificationStore';

const {
  mockGetNotifications,
  mockMarkAsRead,
  mockGetUnreadCount,
} = vi.hoisted(() => ({
  mockGetNotifications: vi.fn(),
  mockMarkAsRead: vi.fn(),
  mockGetUnreadCount: vi.fn(),
}));

vi.mock('../api/notification', () => ({
  getNotifications: (...args: any[]) => mockGetNotifications(...args),
  markAsRead: (...args: any[]) => mockMarkAsRead(...args),
  getUnreadCount: (...args: any[]) => mockGetUnreadCount(...args),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderDropdown() {
  return render(
    <MemoryRouter>
      <NotificationDropdown />
    </MemoryRouter>,
  );
}

describe('NotificationDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetNotifications.mockResolvedValue({
      items: [],
      total: 0,
      unreadCount: 0,
    });
    mockMarkAsRead.mockResolvedValue(undefined);
    mockGetUnreadCount.mockResolvedValue(0);
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    useNotificationStore.getState().stopPolling();
    vi.useRealTimers();
  });

  it('renders bell button', () => {
    renderDropdown();
    expect(screen.getByLabelText('通知')).toBeInTheDocument();
  });

  it('shows unread count badge when count > 0', async () => {
    mockGetNotifications.mockResolvedValue({
      items: [],
      total: 0,
      unreadCount: 5,
    });
    renderDropdown();
    fireEvent.click(screen.getByLabelText('通知'));
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('shows 99+ badge when count > 99', async () => {
    mockGetNotifications.mockResolvedValue({
      items: [],
      total: 0,
      unreadCount: 120,
    });
    renderDropdown();
    fireEvent.click(screen.getByLabelText('通知'));
    await waitFor(() => {
      expect(screen.getByText('99+')).toBeInTheDocument();
    });
  });

  it('opens dropdown on click and fetches notifications', async () => {
    mockGetNotifications.mockResolvedValue({
      items: [
        { id: 1, type: 'reply', message: '有人回复了你', targetId: 10, isRead: false, createdAt: new Date().toISOString() },
      ],
      total: 1,
      unreadCount: 1,
    });
    renderDropdown();
    fireEvent.click(screen.getByLabelText('通知'));
    await waitFor(() => {
      expect(screen.getByText('有人回复了你')).toBeInTheDocument();
    });
  });

  it('shows empty state when no notifications', async () => {
    renderDropdown();
    fireEvent.click(screen.getByLabelText('通知'));
    await waitFor(() => {
      expect(screen.getByText('暂无通知')).toBeInTheDocument();
    });
  });

  it('applies blue-50 background to unread items', async () => {
    mockGetNotifications.mockResolvedValue({
      items: [
        { id: 1, type: 'reply', message: '新回复', targetId: 10, isRead: false, createdAt: new Date().toISOString() },
        { id: 2, type: 'like', message: '有人点赞', targetId: 20, isRead: true, createdAt: new Date().toISOString() },
      ],
      total: 2,
      unreadCount: 1,
    });
    renderDropdown();
    fireEvent.click(screen.getByLabelText('通知'));
    await waitFor(() => {
      const unreadBtn = screen.getByText('新回复').closest('button');
      expect(unreadBtn).toHaveClass('bg-blue-50');
    });
  });

  it('shows blue dot for unread notifications', async () => {
    mockGetNotifications.mockResolvedValue({
      items: [
        { id: 1, type: 'reply', message: '新回复', targetId: 10, isRead: false, createdAt: new Date().toISOString() },
      ],
      total: 1,
      unreadCount: 1,
    });
    renderDropdown();
    fireEvent.click(screen.getByLabelText('通知'));
    await waitFor(() => {
      const dot = document.querySelector('.bg-primary.rounded-full');
      expect(dot).toBeTruthy();
    });
  });

  it('marks notification as read and decrements on click', async () => {
    mockGetNotifications.mockResolvedValue({
      items: [
        { id: 1, type: 'reply', message: '新回复', targetId: 10, isRead: false, createdAt: new Date().toISOString() },
      ],
      total: 1,
      unreadCount: 1,
    });
    renderDropdown();
    fireEvent.click(screen.getByLabelText('通知'));
    await waitFor(() => {
      expect(screen.getByText('新回复')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('新回复'));
    await waitFor(() => {
      expect(mockMarkAsRead).toHaveBeenCalledWith(1);
    });
  });

  it('does not call markAsRead for already read notifications', async () => {
    mockGetNotifications.mockResolvedValue({
      items: [
        { id: 2, type: 'like', message: '已读消息', targetId: 20, isRead: true, createdAt: new Date().toISOString() },
      ],
      total: 1,
      unreadCount: 0,
    });
    renderDropdown();
    fireEvent.click(screen.getByLabelText('通知'));
    await waitFor(() => {
      expect(screen.getByText('已读消息')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('已读消息'));
    expect(mockMarkAsRead).not.toHaveBeenCalled();
  });

  it('navigates to target on notification click', async () => {
    mockGetNotifications.mockResolvedValue({
      items: [
        { id: 1, type: 'reply', message: '新回复', targetId: 99, isRead: false, createdAt: new Date().toISOString() },
      ],
      total: 1,
      unreadCount: 1,
    });
    renderDropdown();
    fireEvent.click(screen.getByLabelText('通知'));
    await waitFor(() => {
      expect(screen.getByText('新回复')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('新回复'));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/post/99');
    });
  });

  it('navigates to /notifications on "查看全部" click', async () => {
    renderDropdown();
    fireEvent.click(screen.getByLabelText('通知'));
    await waitFor(() => {
      expect(screen.getByText('查看全部')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('查看全部'));
    expect(mockNavigate).toHaveBeenCalledWith('/notifications');
  });

  it('groups notifications by type', async () => {
    mockGetNotifications.mockResolvedValue({
      items: [
        { id: 1, type: 'reply', message: '回复1', targetId: 1, isRead: false, createdAt: new Date().toISOString() },
        { id: 2, type: 'like', message: '点赞1', targetId: 2, isRead: false, createdAt: new Date().toISOString() },
      ],
      total: 2,
      unreadCount: 2,
    });
    renderDropdown();
    fireEvent.click(screen.getByLabelText('通知'));
    await waitFor(() => {
      expect(screen.getByText('帖子回复')).toBeInTheDocument();
      expect(screen.getByText('被点赞')).toBeInTheDocument();
    });
  });

  it('closes dropdown on outside click', async () => {
    renderDropdown();
    fireEvent.click(screen.getByLabelText('通知'));
    await waitFor(() => {
      expect(screen.getByText('暂无通知')).toBeInTheDocument();
    });
    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(screen.queryByText('暂无通知')).not.toBeInTheDocument();
    });
  });

  it('starts polling on mount', async () => {
    renderDropdown();
    await act(() => vi.advanceTimersByTimeAsync(30000));
    expect(mockGetUnreadCount).toHaveBeenCalled();
  });
});
