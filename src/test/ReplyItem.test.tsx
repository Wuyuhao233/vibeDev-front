import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('../components/ui/Toast', () => ({
  toast: { success: mockToastSuccess, error: mockToastError, info: vi.fn(), warning: vi.fn() },
}));

import ReplyItem from '../components/ReplyItem';

const baseProps = {
  id: 5,
  postId: 1,
  content: 'This is a reply',
  author: { id: 2, username: 'replier', avatar: null, level: 2 },
  floorNumber: 5,
  likeCount: 3,
  isLiked: false,
  createdAt: new Date(Date.now() - 3600000).toISOString(),
  updatedAt: new Date(Date.now() - 3600000).toISOString(),
};

describe('ReplyItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
    });
  });

  it('renders share button', () => {
    render(<ReplyItem {...baseProps} />);
    expect(screen.getByLabelText('分享')).toBeInTheDocument();
  });

  it('copies correct URL to clipboard on share click', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
    });

    render(<ReplyItem {...baseProps} />);
    fireEvent.click(screen.getByLabelText('分享'));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        `${window.location.origin}/post/1#reply-5`,
      );
    });
  });

  it('shows "已复制" after successful copy', async () => {
    render(<ReplyItem {...baseProps} />);
    fireEvent.click(screen.getByLabelText('分享'));

    await waitFor(() => {
      expect(screen.getByText('已复制')).toBeInTheDocument();
    });
  });

  it('shows toast success on copy', async () => {
    render(<ReplyItem {...baseProps} />);
    fireEvent.click(screen.getByLabelText('分享'));

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('链接已复制');
    });
  });

  it('calls onShare callback with reply ID', async () => {
    const onShare = vi.fn();
    render(<ReplyItem {...baseProps} onShare={onShare} />);
    fireEvent.click(screen.getByLabelText('分享'));

    await waitFor(() => {
      expect(onShare).toHaveBeenCalledWith(5);
    });
  });

  it('shows toast error on clipboard failure', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
    });

    render(<ReplyItem {...baseProps} />);
    fireEvent.click(screen.getByLabelText('分享'));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('复制失败，请手动复制');
    });
  });

  it('does not show share button on deleted reply', () => {
    render(<ReplyItem {...baseProps} isDeleted={true} />);
    expect(screen.queryByLabelText('分享')).not.toBeInTheDocument();
  });
});
