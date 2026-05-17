import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { useAuthStore } from '../store/authStore';

beforeEach(() => {
  vi.clearAllMocks();
});

function renderLayout(role: 'admin' | 'moderator') {
  useAuthStore.setState({
    isAuthenticated: true,
    user: { id: 1, username: 'testuser', email: 'test@test.com', avatar: null, level: 1, role },
    accessToken: 'token',
    refreshToken: 'refresh',
  });
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <AdminLayout />
    </MemoryRouter>
  );
}

describe('AdminLayout', () => {
  it('renders sidebar with logo', () => {
    renderLayout('admin');
    expect(screen.getByText('vibeDev')).toBeInTheDocument();
    expect(screen.getByText('管理后台')).toBeInTheDocument();
  });

  it('shows admin nav items for admin role', () => {
    renderLayout('admin');
    expect(screen.getByText('仪表盘')).toBeInTheDocument();
    expect(screen.getByText('版块管理')).toBeInTheDocument();
    expect(screen.getByText('用户管理')).toBeInTheDocument();
    expect(screen.getByText('帖子管理')).toBeInTheDocument();
    expect(screen.getByText('审核队列')).toBeInTheDocument();
    expect(screen.getByText('举报管理')).toBeInTheDocument();
    expect(screen.getByText('敏感词库')).toBeInTheDocument();
    expect(screen.getByText('系统设置')).toBeInTheDocument();
  });

  it('hides admin-only items for moderator role', () => {
    renderLayout('moderator');
    expect(screen.getByText('仪表盘')).toBeInTheDocument();
    expect(screen.getByText('审核队列')).toBeInTheDocument();
    expect(screen.getByText('举报管理')).toBeInTheDocument();
    expect(screen.queryByText('版块管理')).not.toBeInTheDocument();
    expect(screen.queryByText('用户管理')).not.toBeInTheDocument();
    expect(screen.queryByText('敏感词库')).not.toBeInTheDocument();
    expect(screen.queryByText('系统设置')).not.toBeInTheDocument();
  });

  it('shows current user info in sidebar footer', () => {
    renderLayout('admin');
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('退出')).toBeInTheDocument();
  });

  it('has back to frontend link', () => {
    renderLayout('admin');
    expect(screen.getByText('← 返回前台')).toBeInTheDocument();
  });

  it('highlights active nav item', () => {
    renderLayout('admin');
    const dashboardLink = screen.getByText('仪表盘').closest('a');
    expect(dashboardLink?.className).toContain('bg-primary/10');
    expect(dashboardLink?.className).toContain('text-primary');
  });
});
