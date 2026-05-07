import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CollectButton from '../components/CollectButton';

vi.mock('../api/favorite', () => ({
  addFavorite: vi.fn().mockResolvedValue({ success: true }),
  removeFavorite: vi.fn().mockResolvedValue(undefined),
}));

describe('CollectButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('toggles collect on click', async () => {
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
      expect(onCountChange).toHaveBeenCalledWith(8, true);
    });
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
    });
  });
});
