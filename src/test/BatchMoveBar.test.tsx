import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BatchMoveBar from '../components/BatchMoveBar';

const { mockGetFolders } = vi.hoisted(() => ({
  mockGetFolders: vi.fn(),
}));

vi.mock('../api/collection', () => ({
  getFolders: (...args: any[]) => mockGetFolders(...args),
}));

const baseFolders = [
  { id: 1, name: '技术文章', itemCount: 5, createdAt: '2026-01-01' },
  { id: 2, name: '设计资源', itemCount: 3, createdAt: '2026-02-01' },
];

describe('BatchMoveBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders selected count', async () => {
    mockGetFolders.mockResolvedValue([]);
    render(<BatchMoveBar selectedCount={3} onMove={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('已选 3 项')).toBeInTheDocument();
  });

  it('shows folder selector dropdown', async () => {
    mockGetFolders.mockResolvedValue(baseFolders);
    render(<BatchMoveBar selectedCount={2} onMove={vi.fn()} onCancel={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('选择收藏夹')).toBeInTheDocument();
    });
  });

  it('toggles folder list on click', async () => {
    mockGetFolders.mockResolvedValue(baseFolders);
    render(<BatchMoveBar selectedCount={2} onMove={vi.fn()} onCancel={vi.fn()} />);

    // Click to open
    fireEvent.click(screen.getByText('选择收藏夹'));
    await waitFor(() => {
      expect(screen.getByText('技术文章')).toBeInTheDocument();
      expect(screen.getByText('设计资源')).toBeInTheDocument();
    });
  });

  it('confirm button is disabled until folder selected', async () => {
    mockGetFolders.mockResolvedValue(baseFolders);
    render(<BatchMoveBar selectedCount={2} onMove={vi.fn()} onCancel={vi.fn()} />);

    const confirmBtn = screen.getByText('确定');
    expect(confirmBtn).toBeDisabled();
  });

  it('selects folder and enables confirm', async () => {
    mockGetFolders.mockResolvedValue(baseFolders);
    render(<BatchMoveBar selectedCount={2} onMove={vi.fn()} onCancel={vi.fn()} />);

    // Open dropdown
    fireEvent.click(screen.getByText('选择收藏夹'));

    await waitFor(() => {
      expect(screen.getByText('技术文章')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('技术文章'));

    await waitFor(() => {
      expect(screen.getByText('技术文章')).toBeInTheDocument(); // now shown as selected
      expect(screen.getByText('确定')).not.toBeDisabled();
    });
  });

  it('calls onMove when confirm clicked after selection', async () => {
    mockGetFolders.mockResolvedValue(baseFolders);
    const onMove = vi.fn();
    render(<BatchMoveBar selectedCount={2} onMove={onMove} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByText('选择收藏夹'));

    await waitFor(() => {
      expect(screen.getByText('技术文章')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('技术文章'));

    await waitFor(() => {
      expect(screen.getByText('确定')).not.toBeDisabled();
    });

    fireEvent.click(screen.getByText('确定'));
    expect(onMove).toHaveBeenCalledWith(1);
  });

  it('calls onCancel when cancel clicked', async () => {
    mockGetFolders.mockResolvedValue([]);
    const onCancel = vi.fn();
    render(<BatchMoveBar selectedCount={1} onMove={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('取消'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows empty state when no folders', async () => {
    mockGetFolders.mockResolvedValue([]);
    render(<BatchMoveBar selectedCount={1} onMove={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByText('选择收藏夹'));

    await waitFor(() => {
      expect(screen.getByText('暂无收藏夹')).toBeInTheDocument();
    });
  });
});
