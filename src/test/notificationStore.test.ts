import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';

const mockGetUnreadCount = vi.fn();

vi.mock('../api/notification', () => ({
  getUnreadCount: () => mockGetUnreadCount(),
}));

import { useNotificationStore } from '../store/notificationStore';

describe('notificationStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUnreadCount.mockResolvedValue(0);
    useNotificationStore.setState({ unreadCount: 0 });
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    useNotificationStore.getState().stopPolling();
    vi.useRealTimers();
  });

  it('initializes with unreadCount 0', () => {
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it('setUnreadCount updates count', () => {
    act(() => useNotificationStore.getState().setUnreadCount(10));
    expect(useNotificationStore.getState().unreadCount).toBe(10);
  });

  it('increment increases count by 1', () => {
    useNotificationStore.getState().setUnreadCount(5);
    act(() => useNotificationStore.getState().increment());
    expect(useNotificationStore.getState().unreadCount).toBe(6);
  });

  it('decrement decreases count by 1', () => {
    useNotificationStore.getState().setUnreadCount(5);
    act(() => useNotificationStore.getState().decrement());
    expect(useNotificationStore.getState().unreadCount).toBe(4);
  });

  it('decrement floors at 0', () => {
    useNotificationStore.getState().setUnreadCount(0);
    act(() => useNotificationStore.getState().decrement());
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it('reset sets count to 0', () => {
    useNotificationStore.getState().setUnreadCount(10);
    act(() => useNotificationStore.getState().reset());
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it('startPolling fetches unread count immediately', async () => {
    mockGetUnreadCount.mockResolvedValue(7);
    act(() => useNotificationStore.getState().startPolling());
    await vi.advanceTimersByTimeAsync(100);
    expect(mockGetUnreadCount).toHaveBeenCalledTimes(1);
    expect(useNotificationStore.getState().unreadCount).toBe(7);
  });

  it('startPolling polls every 30s', async () => {
    mockGetUnreadCount.mockResolvedValue(3);
    act(() => useNotificationStore.getState().startPolling());
    await vi.advanceTimersByTimeAsync(100);
    expect(mockGetUnreadCount).toHaveBeenCalledTimes(1);

    await act(() => vi.advanceTimersByTimeAsync(30000));
    expect(mockGetUnreadCount).toHaveBeenCalledTimes(2);
  });

  it('startPolling does not start duplicate intervals', async () => {
    act(() => useNotificationStore.getState().startPolling());
    act(() => useNotificationStore.getState().startPolling());
    await vi.advanceTimersByTimeAsync(100);
    expect(mockGetUnreadCount).toHaveBeenCalledTimes(1);
  });

  it('stopPolling stops the interval', async () => {
    act(() => useNotificationStore.getState().startPolling());
    await vi.advanceTimersByTimeAsync(100);
    expect(mockGetUnreadCount).toHaveBeenCalledTimes(1);

    act(() => useNotificationStore.getState().stopPolling());
    await act(() => vi.advanceTimersByTimeAsync(60000));
    expect(mockGetUnreadCount).toHaveBeenCalledTimes(1);
  });

  it('handles API error gracefully in polling', async () => {
    mockGetUnreadCount.mockRejectedValue(new Error('Network error'));
    act(() => useNotificationStore.getState().startPolling());
    await vi.advanceTimersByTimeAsync(100);
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });
});
