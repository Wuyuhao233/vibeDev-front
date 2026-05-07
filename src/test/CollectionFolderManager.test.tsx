import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CollectionFolderManager from '../components/CollectionFolderManager';

const { mockGetFolders, mockCreateFolder, mockRenameFolder, mockDeleteFolder } = vi.hoisted(() => ({
  mockGetFolders: vi.fn(),
  mockCreateFolder: vi.fn(),
  mockRenameFolder: vi.fn(),
  mockDeleteFolder: vi.fn(),
}));

vi.mock('../api/collection', () => ({
  getFolders: (...args: any[]) => mockGetFolders(...args),
  createFolder: (...args: any[]) => mockCreateFolder(...args),
  renameFolder: (...args: any[]) => mockRenameFolder(...args),
  deleteFolder: (...args: any[]) => mockDeleteFolder(...args),
}));

vi.mock('../components/ui/Toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

const baseFolders = [
  { id: 1, name: '技术文章', itemCount: 5, createdAt: '2026-01-01' },
  { id: 2, name: '设计资源', itemCount: 3, createdAt: '2026-02-01' },
];

describe('CollectionFolderManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    mockGetFolders.mockResolvedValue([]);
    render(
      <CollectionFolderManager open={false} onClose={vi.fn()} />,
    );
    expect(screen.queryByText('管理收藏夹')).not.toBeInTheDocument();
  });

  it('renders create input and folder list', async () => {
    mockGetFolders.mockResolvedValue(baseFolders);
    render(
      <CollectionFolderManager open={true} onClose={vi.fn()} />,
    );
    await waitFor(() => {
      expect(screen.getByPlaceholderText('新收藏夹名称')).toBeInTheDocument();
      expect(screen.getByText('技术文章')).toBeInTheDocument();
      expect(screen.getByText('设计资源')).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    mockGetFolders.mockReturnValue(new Promise(() => {}));
    render(
      <CollectionFolderManager open={true} onClose={vi.fn()} />,
    );
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('creates a new folder', async () => {
    mockGetFolders.mockResolvedValue(baseFolders);
    mockCreateFolder.mockResolvedValue({
      id: 3,
      name: '新收藏夹',
      itemCount: 0,
      createdAt: '2026-03-01',
    });

    render(
      <CollectionFolderManager open={true} onClose={vi.fn()} />,
    );

    await waitFor(() => {
      expect(screen.getByText('技术文章')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('新收藏夹名称');
    fireEvent.change(input, { target: { value: '新收藏夹' } });
    fireEvent.click(screen.getByText('创建'));

    await waitFor(() => {
      expect(mockCreateFolder).toHaveBeenCalledWith('新收藏夹');
    });
  });

  it('renames a folder', async () => {
    mockGetFolders.mockResolvedValue(baseFolders);
    mockRenameFolder.mockResolvedValue({
      id: 1,
      name: '改名的文章',
      itemCount: 5,
      createdAt: '2026-01-01',
    });

    render(
      <CollectionFolderManager open={true} onClose={vi.fn()} />,
    );

    await waitFor(() => {
      expect(screen.getByText('技术文章')).toBeInTheDocument();
    });

    // Click rename button (first "重命名" button)
    const renameButtons = screen.getAllByText('重命名');
    fireEvent.click(renameButtons[0]);

    // Should now show an input with the current name
    await waitFor(() => {
      const input = screen.getByDisplayValue('技术文章');
      expect(input).toBeInTheDocument();
    });

    fireEvent.change(screen.getByDisplayValue('技术文章'), {
      target: { value: '改名的文章' },
    });
    fireEvent.click(screen.getByText('保存'));

    await waitFor(() => {
      expect(mockRenameFolder).toHaveBeenCalledWith(1, '改名的文章');
    });
  });

  it('deletes a folder', async () => {
    mockGetFolders.mockResolvedValue(baseFolders);
    mockDeleteFolder.mockResolvedValue(true);

    render(
      <CollectionFolderManager open={true} onClose={vi.fn()} />,
    );

    await waitFor(() => {
      expect(screen.getByText('技术文章')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('删除');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockDeleteFolder).toHaveBeenCalledWith(1);
    });
  });

  it('shows empty state when no folders', async () => {
    mockGetFolders.mockResolvedValue([]);
    render(
      <CollectionFolderManager open={true} onClose={vi.fn()} />,
    );

    await waitFor(() => {
      expect(screen.getByText('暂无收藏夹')).toBeInTheDocument();
    });
  });
});
