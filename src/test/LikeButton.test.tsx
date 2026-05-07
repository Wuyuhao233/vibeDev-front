import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import LikeButton from '../components/LikeButton';

const { mockAddLike, mockRemoveLike } = vi.hoisted(() => ({
  mockAddLike: vi.fn(),
  mockRemoveLike: vi.fn(),
}));

vi.mock('../api/like', () => ({
  addLike: (...args: any[]) => mockAddLike(...args),
  removeLike: (...args: any[]) => mockRemoveLike(...args),
}));

describe('LikeButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddLike.mockResolvedValue({ success: true });
    mockRemoveLike.mockResolvedValue(undefined);
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it('applies heart-pop animation on like click', () => {
    render(
      <LikeButton targetType="post" targetId={1} initialLiked={false} initialCount={0} />,
    );
    fireEvent.click(screen.getByLabelText('点赞 (0)'));
    const svg = document.querySelector('.heart-pop');
    expect(svg).toBeTruthy();
  });

  it('does not apply heart-pop animation on unlike click', () => {
    render(
      <LikeButton targetType="post" targetId={1} initialLiked={true} initialCount={1} />,
    );
    fireEvent.click(screen.getByLabelText('取消点赞 (1)'));
    const svg = document.querySelector('.heart-pop');
    expect(svg).toBeFalsy();
  });

  it('enforces 300ms cooldown between clicks', async () => {
    render(
      <LikeButton targetType="post" targetId={1} initialLiked={false} initialCount={0} />,
    );

    fireEvent.click(screen.getByLabelText('点赞 (0)'));
    expect(mockAddLike).toHaveBeenCalledTimes(1);

    // Click again within cooldown - should be ignored
    fireEvent.click(screen.getByLabelText('取消点赞 (1)'));
    expect(mockRemoveLike).not.toHaveBeenCalled();

    // Advance past cooldown
    await act(() => vi.advanceTimersByTimeAsync(350));
    await waitFor(() => {
      expect(screen.getByLabelText('取消点赞 (1)')).toBeInTheDocument();
    });

    // Now click should work
    fireEvent.click(screen.getByLabelText('取消点赞 (1)'));
    await waitFor(() => {
      expect(mockRemoveLike).toHaveBeenCalledTimes(1);
    });
  });

  it('calls addLike API with correct arguments', async () => {
    render(
      <LikeButton targetType="post" targetId={42} initialLiked={false} initialCount={0} />,
    );
    fireEvent.click(screen.getByLabelText('点赞 (0)'));
    await waitFor(() => {
      expect(mockAddLike).toHaveBeenCalledWith('post', 42);
    });
  });

  it('calls removeLike API with correct arguments', async () => {
    render(
      <LikeButton targetType="reply" targetId={7} initialLiked={true} initialCount={1} />,
    );
    fireEvent.click(screen.getByLabelText('取消点赞 (1)'));
    await waitFor(() => {
      expect(mockRemoveLike).toHaveBeenCalledWith('reply', 7);
    });
  });

  it('rolls back on API failure', async () => {
    mockAddLike.mockRejectedValueOnce(new Error('网络异常'));
    render(
      <LikeButton targetType="post" targetId={1} initialLiked={false} initialCount={5} />,
    );
    fireEvent.click(screen.getByLabelText('点赞 (5)'));
    await waitFor(() => {
      expect(screen.getByLabelText('点赞 (5)')).toBeInTheDocument();
    });
  });
});
