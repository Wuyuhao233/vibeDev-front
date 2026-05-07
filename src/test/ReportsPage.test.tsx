import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ReportsPage from '../pages/admin/ReportsPage';
import { useAuthStore } from '../store/authStore';

vi.mock('../api/admin', () => ({
  getReports: vi.fn(),
  handleReport: vi.fn(),
}));

vi.mock('../api/board', () => ({
  getBoards: vi.fn(),
}));

import * as adminApi from '../api/admin';
import * as boardApi from '../api/board';

const mockReports = [
  { id: 1, type: 'post' as const, targetId: 10, reason: '违规内容', description: '内容不适当', reporter: { id: 5, username: 'reporter' }, targetContent: '一些违规内容...', status: 'pending' as const, boardId: 1, boardName: '综合讨论', createdAt: '2026-05-01' },
  { id: 2, type: 'reply' as const, targetId: 20, reason: '垃圾广告', description: '', reporter: { id: 6, username: 'user2' }, targetContent: '广告回复内容...', status: 'handled' as const, boardId: null, boardName: null, createdAt: '2026-05-02' },
];

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({
    isAuthenticated: true,
    user: { id: 1, username: 'admin', email: 'admin@test.com', avatar: null, level: 1, role: 'admin' },
    accessToken: 'token',
    refreshToken: 'refresh',
  });
  vi.mocked(adminApi.getReports).mockResolvedValue({ items: mockReports, total: 2 });
  vi.mocked(boardApi.getBoards).mockResolvedValue([]);
});

function renderReports() {
  return render(
    <MemoryRouter>
      <ReportsPage />
    </MemoryRouter>
  );
}

describe('ReportsPage', () => {
  it('renders report table', async () => {
    renderReports();
    await waitFor(() => {
      expect(screen.getByText('违规内容')).toBeInTheDocument();
      expect(screen.getByText('垃圾广告')).toBeInTheDocument();
    });
  });

  it('shows report type badges', async () => {
    renderReports();
    await waitFor(() => {
      expect(screen.getByText('违规内容')).toBeInTheDocument();
    });
    // "帖子" and "回复" appear in both filter dropdown and table badges
    const postMatches = screen.getAllByText('帖子');
    const replyMatches = screen.getAllByText('回复');
    expect(postMatches.length).toBeGreaterThanOrEqual(1);
    expect(replyMatches.length).toBeGreaterThanOrEqual(1);
  });

  it('shows pending and handled status', async () => {
    renderReports();
    await waitFor(() => {
      expect(screen.getByText('违规内容')).toBeInTheDocument();
    });
    // "待处理" and "已处理" appear in both filter dropdown and table
    const pendingMatches = screen.getAllByText('待处理');
    const handledMatches = screen.getAllByText('已处理');
    expect(pendingMatches.length).toBeGreaterThanOrEqual(1);
    expect(handledMatches.length).toBeGreaterThanOrEqual(1);
  });

  it('shows filter controls', async () => {
    renderReports();
    await waitFor(() => {
      expect(screen.getByText('违规内容')).toBeInTheDocument();
    });
    const selects = document.querySelectorAll('select');
    expect(selects.length).toBeGreaterThanOrEqual(3);
  });

  it('has detail links for each report', async () => {
    renderReports();
    await waitFor(() => {
      expect(screen.getByText('违规内容')).toBeInTheDocument();
    });
    const detailBtns = screen.getAllByText('详情');
    expect(detailBtns.length).toBe(2);
  });

  it('shows empty state when no reports', async () => {
    vi.mocked(adminApi.getReports).mockResolvedValue({ items: [], total: 0 });
    renderReports();
    await waitFor(() => {
      expect(screen.getByText('暂无举报')).toBeInTheDocument();
    });
  });

  it('shows error state on API failure', async () => {
    vi.mocked(adminApi.getReports).mockRejectedValue(new Error('网络错误'));
    renderReports();
    await waitFor(() => {
      expect(screen.getByText('加载失败')).toBeInTheDocument();
    });
  });
});
