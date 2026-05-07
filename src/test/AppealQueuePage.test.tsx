import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AppealQueuePage from '../pages/admin/AppealQueuePage';

vi.mock('../api/admin', () => ({
  getAppeals: vi.fn(),
  approveAppeal: vi.fn(),
  rejectAppeal: vi.fn(),
}));

import * as adminApi from '../api/admin';

const mockItems = [
  {
    id: 'appeal-1',
    reportId: 'report-101',
    appellantId: 'user-1',
    reason: '我的帖子内容正常，没有违规，请复审',
    status: 'pending' as const,
    handlerId: null,
    handlerNote: null,
    createdAt: '2026-05-07T10:00:00Z',
    processedAt: null,
  },
  {
    id: 'appeal-2',
    reportId: 'report-202',
    appellantId: 'user-2',
    reason: '禁言处罚过重，申请解除禁言',
    status: 'pending' as const,
    handlerId: null,
    handlerNote: null,
    createdAt: '2026-05-07T09:30:00Z',
    processedAt: null,
  },
];

const mockResponse = {
  items: mockItems,
  total: 2,
  page: 1,
  pageSize: 20,
};

function renderComponent() {
  return render(
    <MemoryRouter>
      <AppealQueuePage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(adminApi.getAppeals).mockResolvedValue(mockResponse);
  vi.mocked(adminApi.approveAppeal).mockResolvedValue(undefined);
  vi.mocked(adminApi.rejectAppeal).mockResolvedValue(undefined);
});

describe('AppealQueuePage', () => {
  it('renders loading state initially', () => {
    vi.mocked(adminApi.getAppeals).mockReturnValue(new Promise(() => {}));
    renderComponent();
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('renders appeal items after data loads', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('我的帖子内容正常，没有违规，请复审')).toBeInTheDocument();
    });
    expect(screen.getByText('禁言处罚过重，申请解除禁言')).toBeInTheDocument();
  });

  it('shows page title', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('申诉复审')).toBeInTheDocument();
    });
  });

  it('displays filter tabs', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('申诉复审')).toBeInTheDocument();
    });
    // Use getAllByText since "待处理" also appears as a status badge
    const pendingTabs = screen.getAllByText('待处理');
    expect(pendingTabs.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('已通过')).toBeInTheDocument();
    expect(screen.getByText('已驳回')).toBeInTheDocument();
  });

  it('shows approve and reject buttons for pending items', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('我的帖子内容正常，没有违规，请复审')).toBeInTheDocument();
    });
    const approveBtns = screen.getAllByText('通过');
    const rejectBtns = screen.getAllByText('驳回');
    expect(approveBtns.length).toBe(2);
    expect(rejectBtns.length).toBe(2);
  });

  it('shows report IDs in table', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('我的帖子内容正常，没有违规，请复审')).toBeInTheDocument();
    });
    expect(screen.getByText('report-101')).toBeInTheDocument();
    expect(screen.getByText('report-202')).toBeInTheDocument();
  });

  it('calls approve API when approve button clicked', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('我的帖子内容正常，没有违规，请复审')).toBeInTheDocument();
    });
    const approveBtns = screen.getAllByText('通过');
    await userEvent.click(approveBtns[0]);
    await waitFor(() => {
      expect(adminApi.approveAppeal).toHaveBeenCalledWith('appeal-1');
    });
  });

  it('shows reject modal when reject button clicked', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('我的帖子内容正常，没有违规，请复审')).toBeInTheDocument();
    });
    const rejectBtns = screen.getAllByText('驳回');
    await userEvent.click(rejectBtns[0]);
    await waitFor(() => {
      expect(screen.getByText('驳回申诉')).toBeInTheDocument();
    });
  });

  it('reject confirm button is disabled when note is too short', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('我的帖子内容正常，没有违规，请复审')).toBeInTheDocument();
    });
    await userEvent.click(screen.getAllByText('驳回')[0]);
    await waitFor(() => {
      expect(screen.getByText('驳回申诉')).toBeInTheDocument();
    });
    const confirmBtn = screen.getByText('确认驳回');
    expect(confirmBtn).toBeDisabled();
  });

  it('calls reject API when note is filled and confirmed', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('我的帖子内容正常，没有违规，请复审')).toBeInTheDocument();
    });
    await userEvent.click(screen.getAllByText('驳回')[0]);
    await waitFor(() => {
      expect(screen.getByText('驳回申诉')).toBeInTheDocument();
    });
    const textarea = screen.getByPlaceholderText('请输入驳回说明（至少 5 个字符）');
    await userEvent.type(textarea, '申诉理由不充分，维持原判');
    await userEvent.click(screen.getByText('确认驳回'));
    await waitFor(() => {
      expect(adminApi.rejectAppeal).toHaveBeenCalledWith('appeal-1', {
        result: 'rejected',
        note: '申诉理由不充分，维持原判',
      });
    });
  });

  it('shows error state on API failure', async () => {
    vi.mocked(adminApi.getAppeals).mockRejectedValue(new Error('网络错误'));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('加载失败')).toBeInTheDocument();
    });
  });

  it('renders empty state when no items', async () => {
    vi.mocked(adminApi.getAppeals).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    });
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('暂无申诉记录')).toBeInTheDocument();
    });
  });
});
