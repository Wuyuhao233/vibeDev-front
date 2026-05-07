import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FolderTabs from '../components/FolderTabs';
import type { CollectionFolder } from '../api/collection';

const baseFolders: CollectionFolder[] = [
  { id: 1, name: '技术文章', itemCount: 5, createdAt: '2026-01-01' },
  { id: 2, name: '设计资源', itemCount: 3, createdAt: '2026-02-01' },
];

describe('FolderTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "全部收藏" tab always', () => {
    render(
      <FolderTabs folders={[]} selectedFolderId={null} onFolderChange={vi.fn()} />,
    );
    expect(screen.getByText('全部收藏')).toBeInTheDocument();
  });

  it('renders folder tabs with item counts', () => {
    render(
      <FolderTabs folders={baseFolders} selectedFolderId={null} onFolderChange={vi.fn()} />,
    );
    expect(screen.getByText('技术文章')).toBeInTheDocument();
    expect(screen.getByText('设计资源')).toBeInTheDocument();
    expect(screen.getByText('(5)')).toBeInTheDocument();
    expect(screen.getByText('(3)')).toBeInTheDocument();
  });

  it('highlights selected folder tab', () => {
    render(
      <FolderTabs folders={baseFolders} selectedFolderId={1} onFolderChange={vi.fn()} />,
    );
    const activeTab = screen.getByText('技术文章').closest('button');
    expect(activeTab?.className).toContain('border-primary-500');
  });

  it('calls onFolderChange when tab clicked', () => {
    const onFolderChange = vi.fn();
    render(
      <FolderTabs folders={baseFolders} selectedFolderId={null} onFolderChange={onFolderChange} />,
    );
    fireEvent.click(screen.getByText('技术文章'));
    expect(onFolderChange).toHaveBeenCalledWith(1);
  });

  it('calls onFolderChange with null when "全部收藏" clicked', () => {
    const onFolderChange = vi.fn();
    render(
      <FolderTabs folders={baseFolders} selectedFolderId={1} onFolderChange={onFolderChange} />,
    );
    fireEvent.click(screen.getByText('全部收藏'));
    expect(onFolderChange).toHaveBeenCalledWith(null);
  });

  it('hides "+ 新建" button by default', () => {
    render(
      <FolderTabs folders={baseFolders} selectedFolderId={null} onFolderChange={vi.fn()} />,
    );
    expect(screen.queryByText('+ 新建')).not.toBeInTheDocument();
  });

  it('shows "+ 新建" when showNewButton is true', () => {
    render(
      <FolderTabs
        folders={baseFolders}
        selectedFolderId={null}
        onFolderChange={vi.fn()}
        showNewButton
      />,
    );
    expect(screen.getByText('+ 新建')).toBeInTheDocument();
  });

  it('calls onNewFolder when "+ 新建" clicked', () => {
    const onNewFolder = vi.fn();
    render(
      <FolderTabs
        folders={baseFolders}
        selectedFolderId={null}
        onFolderChange={vi.fn()}
        showNewButton
        onNewFolder={onNewFolder}
      />,
    );
    fireEvent.click(screen.getByText('+ 新建'));
    expect(onNewFolder).toHaveBeenCalled();
  });
});
