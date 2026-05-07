import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LikeButton from '../components/LikeButton';

vi.mock('../api/like', () => ({
  addLike: vi.fn().mockResolvedValue({ success: true }),
  removeLike: vi.fn().mockResolvedValue(undefined),
}));

describe('LikeButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial count and unliked state', () => {
    render(
      <LikeButton targetType="post" targetId={1} initialLiked={false} initialCount={5} />,
    );
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByLabelText('点赞 (5)')).toBeInTheDocument();
  });

  it('renders liked state with filled heart', () => {
    render(
      <LikeButton targetType="post" targetId={1} initialLiked={true} initialCount={10} />,
    );
    const btn = screen.getByLabelText('取消点赞 (10)');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveClass('text-like');
  });

  it('toggles like on click', async () => {
    const onCountChange = vi.fn();
    render(
      <LikeButton
        targetType="post"
        targetId={1}
        initialLiked={false}
        initialCount={5}
        onCountChange={onCountChange}
      />,
    );
    fireEvent.click(screen.getByLabelText('点赞 (5)'));
    await waitFor(() => {
      expect(onCountChange).toHaveBeenCalledWith(6, true);
    });
  });

  it('toggles unlike on click when already liked', async () => {
    const onCountChange = vi.fn();
    render(
      <LikeButton
        targetType="reply"
        targetId={2}
        initialLiked={true}
        initialCount={3}
        onCountChange={onCountChange}
      />,
    );
    fireEvent.click(screen.getByLabelText('取消点赞 (3)'));
    await waitFor(() => {
      expect(onCountChange).toHaveBeenCalledWith(2, false);
    });
  });
});
