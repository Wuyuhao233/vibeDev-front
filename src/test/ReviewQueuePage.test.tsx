import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ReviewQueuePage from '../pages/admin/ReviewQueuePage';

vi.mock('../api/admin', () => ({
  getReviewQueue: vi.fn(),
  approveReviewItem: vi.fn(),
  rejectReviewItem: vi.fn(),
}));

import * as adminApi from '../api/admin';

const mockItems = [
  {
    id: '1',
    targetType: 'post' as const,
    targetId: '101',
    targetTitle: '如何看待人工智能发展',
    contentExcerpt: '最近AI发展很快，大家怎么看...',
    author: { id: '1', username: 'user1', avatarUrl: null },
    boardName: 'AI',
    aiScore: 72,
    aiCategory: 'political',
    aiDegraded: false,
    status: 'pending' as const,
    priority: 1,
    createdAt: '2026-05-07T10:00:00Z',
  },
  {
    id: '2',
    targetType: 'reply' as const,
    targetId: '202',
    targetTitle: 'Re: 低价代购',
    contentExcerpt: '加我微信低价代购...',
    author: { id: '2', username: 'spammer', avatarUrl: null },
    boardName: '综合',
    aiScore: 85,
    aiCategory: 'spam',
    aiDegraded: true,
    status: 'pending' as const,
    priority: 2,
    createdAt: '2026-05-07T09:30:00Z',
  },
];

const mockStats = {
  pendingCount: 2,
  todayApproved: 10,
  todayRejected: 3,
};

const mockResponse = {
  items: mockItems,
  stats: mockStats,
  total: 2,
  page: 1,
  pageSize: 20,
};

function renderComponent() {
  return render(
    <MemoryRouter>
      <ReviewQueuePage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(adminApi.getReviewQueue).mockResolvedValue(mockResponse);
  vi.mocked(adminApi.approveReviewItem).mockResolvedValue(undefined);
  vi.mocked(adminApi.rejectReviewItem).mockResolvedValue(undefined);
});

describe('ReviewQueuePage', () => {
  it('renders loading state initially', () => {
    vi.mocked(adminApi.getReviewQueue).mockReturnValue(new Promise(() => {}));
    renderComponent();
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('renders review queue items after data loads', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('如何看待人工智能发展')).toBeInTheDocument();
    });
    expect(screen.getByText('Re: 低价代购')).toBeInTheDocument();
  });

  it('displays AI scores with correct colors', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('如何看待人工智能发展')).toBeInTheDocument();
    });
    const score72 = screen.getByText('72');
    const score85 = screen.getByText('85');
    expect(score72.className).toContain('amber');
    expect(score85.className).toContain('red');
  });

  it('shows category labels', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('如何看待人工智能发展')).toBeInTheDocument();
    });
    expect(screen.getByText('涉政')).toBeInTheDocument();
    expect(screen.getByText('垃圾广告')).toBeInTheDocument();
  });

  it('shows approve and reject buttons for pending items', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('如何看待人工智能发展')).toBeInTheDocument();
    });
    const approveBtns = screen.getAllByText('放行');
    const rejectBtns = screen.getAllByText('驳回');
    expect(approveBtns.length).toBe(2);
    expect(rejectBtns.length).toBe(2);
  });

  it('calls approve API when approve button clicked', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('如何看待人工智能发展')).toBeInTheDocument();
    });
    const approveBtns = screen.getAllByText('放行');
    await userEvent.click(approveBtns[0]);
    await waitFor(() => {
      expect(adminApi.approveReviewItem).toHaveBeenCalledWith('1');
    });
  });

  it('shows reject modal when reject button clicked', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('如何看待人工智能发展')).toBeInTheDocument();
    });
    const rejectBtns = screen.getAllByText('驳回');
    await userEvent.click(rejectBtns[0]);
    await waitFor(() => {
      expect(screen.getByText('驳回审核')).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText('请输入驳回原因（至少 5 个字符）')).toBeInTheDocument();
  });

  it('reject confirm button is disabled when reason is too short', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('如何看待人工智能发展')).toBeInTheDocument();
    });
    await userEvent.click(screen.getAllByText('驳回')[0]);
    await waitFor(() => {
      expect(screen.getByText('驳回审核')).toBeInTheDocument();
    });
    const confirmBtn = screen.getByText('确认驳回');
    expect(confirmBtn).toBeDisabled();
  });

  it('calls reject API when reason is filled and confirmed', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('如何看待人工智能发展')).toBeInTheDocument();
    });
    await userEvent.click(screen.getAllByText('驳回')[0]);
    await waitFor(() => {
      expect(screen.getByText('驳回审核')).toBeInTheDocument();
    });
    const textarea = screen.getByPlaceholderText('请输入驳回原因（至少 5 个字符）');
    await userEvent.type(textarea, '内容涉及违规，需要驳回处理');
    await userEvent.click(screen.getByText('确认驳回'));
    await waitFor(() => {
      expect(adminApi.rejectReviewItem).toHaveBeenCalledWith('1', '内容涉及违规，需要驳回处理');
    });
  });

  it('shows error state on API failure', async () => {
    vi.mocked(adminApi.getReviewQueue).mockRejectedValue(new Error('网络错误'));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('加载失败')).toBeInTheDocument();
    });
  });

  it('renders empty state when no items', async () => {
    vi.mocked(adminApi.getReviewQueue).mockResolvedValue({
      items: [],
      stats: mockStats,
      total: 0,
      page: 1,
      pageSize: 20,
    });
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('暂无审核内容')).toBeInTheDocument();
    });
  });

  it('displays stats summary in header', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('如何看待人工智能发展')).toBeInTheDocument();
    });
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
