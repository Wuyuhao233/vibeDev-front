import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from '../pages/admin/DashboardPage';
import { useAuthStore } from '../store/authStore';

vi.mock('../api/admin', () => ({
  getDashboardStats: vi.fn(),
  getTrendData: vi.fn(),
}));

import * as adminApi from '../api/admin';

const mockStats = {
  todayNewUsers: 12,
  todayNewPosts: 45,
  todayNewReplies: 89,
  totalUsers: 1234,
  totalPosts: 5678,
  totalReplies: 9012,
  pendingReports: 3,
};

const mockTrend = [
  { date: '2026-05-01', users: 5, posts: 10, replies: 20 },
  { date: '2026-05-02', users: 8, posts: 15, replies: 25 },
  { date: '2026-05-03', users: 3, posts: 8, replies: 12 },
];

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({
    isAuthenticated: true,
    user: { id: 1, username: 'admin', email: 'admin@test.com', avatar: null, level: 1, role: 'admin' },
    accessToken: 'token',
    refreshToken: 'refresh',
  });
  vi.mocked(adminApi.getDashboardStats).mockResolvedValue(mockStats);
  vi.mocked(adminApi.getTrendData).mockResolvedValue(mockTrend);
});

describe('DashboardPage', () => {
  it('renders loading state initially', () => {
    vi.mocked(adminApi.getDashboardStats).mockReturnValue(new Promise(() => {}));
    renderDashboard();
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('renders stats cards after data loads', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('1,234')).toBeInTheDocument();
    });
    expect(screen.getByText('今日新增用户')).toBeInTheDocument();
    expect(screen.getByText('今日新增帖子')).toBeInTheDocument();
    expect(screen.getByText('今日新增回复')).toBeInTheDocument();
    expect(screen.getByText('用户总数')).toBeInTheDocument();
    expect(screen.getByText('帖子总数')).toBeInTheDocument();
    expect(screen.getByText('回复总数')).toBeInTheDocument();
    expect(screen.getByText('待处理举报')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders trend chart SVG', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('1,234')).toBeInTheDocument();
    });
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('shows error state on API failure', async () => {
    vi.mocked(adminApi.getDashboardStats).mockRejectedValue(new Error('网络错误'));
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('加载失败')).toBeInTheDocument();
    });
  });

  it('has trend day toggle buttons', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('1,234')).toBeInTheDocument();
    });
    expect(screen.getByText('近 7 天')).toBeInTheDocument();
    expect(screen.getByText('近 30 天')).toBeInTheDocument();
  });

  it('fetches trending data with day params', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('1,234')).toBeInTheDocument();
    });
    expect(adminApi.getTrendData).toHaveBeenCalledWith({ days: 7 });

    const day30Btn = screen.getByText('近 30 天');
    await userEvent.click(day30Btn);
    await waitFor(() => {
      expect(adminApi.getTrendData).toHaveBeenCalledWith({ days: 30 });
    });
  });
});
