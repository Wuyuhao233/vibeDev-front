import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ReviewStatsPage from '../pages/admin/ReviewStatsPage';

vi.mock('../api/admin', () => ({
  getReviewStats: vi.fn(),
}));

import * as adminApi from '../api/admin';

const mockStats = {
  queue: {
    pendingCount: 15,
    appealCount: 2,
    todayApproved: 42,
    todayRejected: 8,
  },
  reports: {
    pendingCount: 5,
    todayResolved: 12,
  },
  quality: {
    passRate: 0.85,
    blockRate: 0.12,
    manualPassRate: 0.03,
    falsePositiveRate: 0.05,
    missRate: 0.02,
  },
  cost: {
    monthlyBudget: 500,
    monthlyCost: 123.45,
    dailyApiCalls: 1567,
    isBudgetExceeded: false,
  },
};

function renderComponent() {
  return render(
    <MemoryRouter>
      <ReviewStatsPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(adminApi.getReviewStats).mockResolvedValue(mockStats);
});

describe('ReviewStatsPage', () => {
  it('renders loading state initially', () => {
    vi.mocked(adminApi.getReviewStats).mockReturnValue(new Promise(() => {}));
    renderComponent();
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('renders all stat sections after data loads', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('审核统计看板')).toBeInTheDocument();
    });
    expect(screen.getByText('审核队列')).toBeInTheDocument();
    expect(screen.getByText('AI 准确率')).toBeInTheDocument();
    expect(screen.getByText('举报处理')).toBeInTheDocument();
    expect(screen.getByText('AI 调用成本')).toBeInTheDocument();
  });

  it('displays queue stats correctly', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('审核队列')).toBeInTheDocument();
    });
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('displays quality stats as percentages', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('AI 准确率')).toBeInTheDocument();
    });
    expect(screen.getByText('85.0%')).toBeInTheDocument();
    expect(screen.getByText('12.0%')).toBeInTheDocument();
    expect(screen.getByText('3.0%')).toBeInTheDocument();
    expect(screen.getByText('5.0%')).toBeInTheDocument();
    expect(screen.getByText('2.0%')).toBeInTheDocument();
  });

  it('displays cost stats correctly', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('AI 调用成本')).toBeInTheDocument();
    });
    expect(screen.getByText('¥500')).toBeInTheDocument();
    expect(screen.getByText('¥123.45')).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('1567'))).toBeInTheDocument();
    expect(screen.getByText('正常')).toBeInTheDocument();
  });

  it('shows exceeded budget warning', async () => {
    vi.mocked(adminApi.getReviewStats).mockResolvedValue({
      ...mockStats,
      cost: { ...mockStats.cost, isBudgetExceeded: true },
    });
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('AI 调用成本')).toBeInTheDocument();
    });
    expect(screen.getByText('已超预算')).toBeInTheDocument();
  });

  it('shows error state on API failure', async () => {
    vi.mocked(adminApi.getReviewStats).mockRejectedValue(new Error('网络错误'));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('加载失败')).toBeInTheDocument();
    });
  });

  it('renders donut chart SVG elements', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('AI 准确率')).toBeInTheDocument();
    });
    const svgElements = document.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });
});
