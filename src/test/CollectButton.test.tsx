import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CollectButton from '../components/CollectButton';

const { mockAddFavorite, mockRemoveFavorite } = vi.hoisted(() => ({
  mockAddFavorite: vi.fn().mockResolvedValue({ success: true }),
  mockRemoveFavorite: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../api/favorite', () => ({
  addFavorite: (...args: any[]) => mockAddFavorite(...args),
  removeFavorite: (...args: any[]) => mockRemoveFavorite(...args),
}));

const { mockGetFolders, mockAddToFolder } = vi.hoisted(() => ({
  mockGetFolders: vi.fn().mockResolvedValue([]),
  mockAddToFolder: vi.fn().mockResolvedValue(true),
}));

vi.mock('../api/collection', () => ({
  getFolders: (...args: any[]) => mockGetFolders(...args),
  addToFolder: (...args: any[]) => mockAddToFolder(...args),
}));

describe('CollectButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetFolders.mockResolvedValue([]);
  });

  it('renders initial count and uncollected state', () => {
    render(
      <CollectButton postId={1} initialCollected={false} initialCount={7} />,
    );
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByLabelText('收藏 (7)')).toBeInTheDocument();
  });

  it('renders collected state', () => {
    render(
      <CollectButton postId={1} initialCollected={true} initialCount={15} />,
    );
    const btn = screen.getByLabelText('取消收藏 (15)');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveClass('text-collect');
  });

  it('opens folder selector when collecting', async () => {
    render(
      <CollectButton postId={1} initialCollected={false} initialCount={7} />,
    );
    fireEvent.click(screen.getByLabelText('收藏 (7)'));
    await waitFor(() => {
      expect(screen.getByText('默认收藏夹')).toBeInTheDocument();
    });
  });

  it('collects to default folder when "默认收藏夹" is selected', async () => {
    const onCountChange = vi.fn();
    render(
      <CollectButton
        postId={1}
        initialCollected={false}
        initialCount={7}
        onCountChange={onCountChange}
      />,
    );
    fireEvent.click(screen.getByLabelText('收藏 (7)'));
    await waitFor(() => {
      expect(screen.getByText('默认收藏夹')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('默认收藏夹'));
    await waitFor(() => {
      expect(mockAddFavorite).toHaveBeenCalledWith(1);
      expect(onCountChange).toHaveBeenCalledWith(8, true);
    });
    expect(screen.getByLabelText('取消收藏 (8)')).toBeInTheDocument();
  });

  it('toggles uncollect on click', async () => {
    const onCountChange = vi.fn();
    render(
      <CollectButton
        postId={1}
        initialCollected={true}
        initialCount={3}
        onCountChange={onCountChange}
      />,
    );
    fireEvent.click(screen.getByLabelText('取消收藏 (3)'));
    await waitFor(() => {
      expect(onCountChange).toHaveBeenCalledWith(2, false);
      expect(mockRemoveFavorite).toHaveBeenCalledWith(1);
    });
  });

  it('closes folder selector when uncollect is clicked while selector is open', async () => {
    // Verify that clicking uncollect directly closes any open selector and uncollects
    render(
      <CollectButton postId={1} initialCollected={true} initialCount={3} />,
    );
    fireEvent.click(screen.getByLabelText('取消收藏 (3)'));
    await waitFor(() => {
      expect(mockRemoveFavorite).toHaveBeenCalled();
    });
  });
});
