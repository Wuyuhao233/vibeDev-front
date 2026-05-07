import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import PointsHistory from '../components/PointsHistory';
import * as pointsApi from '../api/points';

vi.mock('../api/points');

const mockRecords = [
  { id: 1, description: '签到', points: 5, createdAt: new Date().toISOString() },
  { id: 2, description: '发布帖子', points: 10, createdAt: new Date().toISOString() },
  { id: 3, description: '违规扣分', points: -20, createdAt: new Date().toISOString() },
];

describe('PointsHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeleton initially', () => {
    vi.mocked(pointsApi.getPointsHistory).mockResolvedValue({ items: [], total: 0 });
    render(<PointsHistory username="testuser" />);
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders points history records', async () => {
    vi.mocked(pointsApi.getPointsHistory).mockResolvedValue({ items: mockRecords, total: 3 });
    render(<PointsHistory username="testuser" />);

    await waitFor(() => {
      expect(screen.getByText('签到')).toBeInTheDocument();
      expect(screen.getByText('发布帖子')).toBeInTheDocument();
      expect(screen.getByText('违规扣分')).toBeInTheDocument();
    });
  });

  it('shows positive points in green', async () => {
    vi.mocked(pointsApi.getPointsHistory).mockResolvedValue({ items: [mockRecords[0]], total: 1 });
    render(<PointsHistory username="testuser" />);

    await waitFor(() => {
      const point = screen.getByText('+5');
      expect(point.className).toContain('text-emerald-500');
    });
  });

  it('shows negative points in red', async () => {
    vi.mocked(pointsApi.getPointsHistory).mockResolvedValue({ items: [mockRecords[2]], total: 1 });
    render(<PointsHistory username="testuser" />);

    await waitFor(() => {
      const point = screen.getByText('-20');
      expect(point.className).toContain('text-red-500');
    });
  });

  it('shows empty state when no records', async () => {
    vi.mocked(pointsApi.getPointsHistory).mockResolvedValue({ items: [], total: 0 });
    render(<PointsHistory username="testuser" />);

    await waitFor(() => {
      expect(screen.getByText('暂无积分记录')).toBeInTheDocument();
    });
  });

  it('shows error state on API failure', async () => {
    vi.mocked(pointsApi.getPointsHistory).mockRejectedValue(new Error('fail'));
    render(<PointsHistory username="testuser" />);

    await waitFor(() => {
      expect(screen.getByText('积分记录加载失败')).toBeInTheDocument();
    });
  });

  it('calls API with correct username', async () => {
    vi.mocked(pointsApi.getPointsHistory).mockResolvedValue({ items: [], total: 0 });
    render(<PointsHistory username="testuser" />);

    await waitFor(() => {
      expect(pointsApi.getPointsHistory).toHaveBeenCalledWith('testuser', 1, 20);
    });
  });
});
