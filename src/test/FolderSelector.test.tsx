import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FolderSelector from '../components/FolderSelector';

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

describe('FolderSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    render(
      <FolderSelector open={false} onSelect={vi.fn()} onClose={vi.fn()} />,
    );
    expect(screen.queryByText('默认收藏夹')).not.toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockGetFolders.mockReturnValue(new Promise(() => {})); // never resolves
    render(
      <FolderSelector open={true} onSelect={vi.fn()} onClose={vi.fn()} />,
    );
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('renders "默认收藏夹" always', async () => {
    mockGetFolders.mockResolvedValue([]);
    render(
      <FolderSelector open={true} onSelect={vi.fn()} onClose={vi.fn()} />,
    );
    await waitFor(() => {
      expect(screen.getByText('默认收藏夹')).toBeInTheDocument();
    });
  });

  it('renders folders from API', async () => {
    mockGetFolders.mockResolvedValue(baseFolders);
    render(
      <FolderSelector open={true} onSelect={vi.fn()} onClose={vi.fn()} />,
    );
    await waitFor(() => {
      expect(screen.getByText('技术文章')).toBeInTheDocument();
      expect(screen.getByText('设计资源')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('calls onSelect with folder id when clicked', async () => {
    mockGetFolders.mockResolvedValue(baseFolders);
    const onSelect = vi.fn();
    render(
      <FolderSelector open={true} onSelect={onSelect} onClose={vi.fn()} />,
    );
    await waitFor(() => {
      expect(screen.getByText('技术文章')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('技术文章'));
    expect(onSelect).toHaveBeenCalledWith(1, '技术文章');
  });

  it('calls onSelect with id 0 for default folder', async () => {
    mockGetFolders.mockResolvedValue(baseFolders);
    const onSelect = vi.fn();
    render(
      <FolderSelector open={true} onSelect={onSelect} onClose={vi.fn()} />,
    );
    await waitFor(() => {
      expect(screen.getByText('默认收藏夹')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('默认收藏夹'));
    expect(onSelect).toHaveBeenCalledWith(0, '默认收藏夹');
  });

  it('closes on Escape', async () => {
    mockGetFolders.mockResolvedValue([]);
    const onClose = vi.fn();
    render(
      <FolderSelector open={true} onSelect={vi.fn()} onClose={onClose} />,
    );
    await waitFor(() => {
      expect(screen.getByText('默认收藏夹')).toBeInTheDocument();
    });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
