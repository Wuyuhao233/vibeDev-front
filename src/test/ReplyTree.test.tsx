import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReplyTree from '../components/ReplyTree';
import type { Reply } from '../api/reply';

const baseReply: Reply = {
  id: 1,
  content: 'Root reply',
  author: { id: 2, username: 'replier', avatar: null, level: 2 },
  parentId: null,
  floorNumber: 1,
  likeCount: 3,
  isLiked: false,
  version: 1,
  createdAt: new Date(Date.now() - 3600000).toISOString(),
  updatedAt: new Date(Date.now() - 3600000).toISOString(),
};

const baseProps = {
  replies: [baseReply],
  total: 1,
  page: 1,
  pageSize: 20,
  loading: false,
  error: null,
  onPageChange: vi.fn(),
  onReply: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onRetry: vi.fn(),
};

describe('ReplyTree', () => {
  it('renders root-level replies', () => {
    render(<ReplyTree {...baseProps} />);
    expect(screen.getByText('Root reply')).toBeInTheDocument();
    expect(screen.getByText('replier')).toBeInTheDocument();
  });

  it('shows total count', () => {
    render(<ReplyTree {...baseProps} />);
    expect(screen.getByText('共 1 条回复')).toBeInTheDocument();
  });

  it('shows empty state when no replies', () => {
    render(<ReplyTree {...baseProps} replies={[]} total={0} />);
    expect(screen.getByText('暂无回复')).toBeInTheDocument();
  });

  it('shows loading skeleton', () => {
    render(<ReplyTree {...baseProps} replies={[]} loading={true} />);
    expect(document.querySelector('.animate-shimmer')).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(<ReplyTree {...baseProps} replies={[]} error="加载失败" />);
    expect(screen.getByText('加载回复失败')).toBeInTheDocument();
    expect(screen.getByText('加载失败')).toBeInTheDocument();
  });

  it('renders nested replies with indentation', () => {
    const replies: Reply[] = [
      baseReply,
      {
        ...baseReply,
        id: 2,
        parentId: 1,
        floorNumber: 2,
        content: 'Child reply',
        author: { id: 3, username: 'child_user', avatar: null, level: 1 },
      },
    ];
    render(<ReplyTree {...baseProps} replies={replies} total={2} />);
    expect(screen.getByText('Root reply')).toBeInTheDocument();
    expect(screen.getByText('Child reply')).toBeInTheDocument();
  });

  it('renders deeply nested replies', () => {
    const replies: Reply[] = [
      baseReply,
      { ...baseReply, id: 2, parentId: 1, floorNumber: 2, content: 'Level 1', author: { ...baseReply.author, id: 3, username: 'u3' } },
      { ...baseReply, id: 3, parentId: 2, floorNumber: 3, content: 'Level 2', author: { ...baseReply.author, id: 4, username: 'u4' } },
      { ...baseReply, id: 4, parentId: 3, floorNumber: 4, content: 'Level 3', author: { ...baseReply.author, id: 5, username: 'u5' } },
    ];
    render(<ReplyTree {...baseProps} replies={replies} total={4} />);
    expect(screen.getByText('Level 1')).toBeInTheDocument();
    expect(screen.getByText('Level 2')).toBeInTheDocument();
    expect(screen.getByText('Level 3')).toBeInTheDocument();
  });

  it('applies highlight when highlightedReplyId matches', () => {
    const replies: Reply[] = [baseReply];
    render(<ReplyTree {...baseProps} replies={replies} highlightedReplyId={1} />);
    const highlightedEl = document.getElementById('reply-1')?.querySelector('.bg-yellow-100');
    expect(highlightedEl).toBeTruthy();
  });

  it('does not highlight non-matching reply', () => {
    const replies: Reply[] = [baseReply];
    render(<ReplyTree {...baseProps} replies={replies} highlightedReplyId={99} />);
    const highlightedEl = document.getElementById('reply-1')?.querySelector('.bg-yellow-100');
    expect(highlightedEl).toBeFalsy();
  });

  it('calls onReply when reply action clicked', () => {
    const onReply = vi.fn();
    render(<ReplyTree {...baseProps} onReply={onReply} />);
    const replyBtn = screen.getByLabelText('回复');
    fireEvent.click(replyBtn);
    expect(onReply).toHaveBeenCalledWith(1);
  });

  it('shows pagination when total > pageSize', () => {
    const replies: Reply[] = Array.from({ length: 20 }, (_, i) => ({
      ...baseReply,
      id: i + 1,
      floorNumber: i + 1,
      content: `Reply ${i + 1}`,
    }));
    render(<ReplyTree {...baseProps} replies={replies} total={50} />);
    expect(screen.getByText('共 50 条')).toBeInTheDocument();
  });

  it('renders siblings with same depth', () => {
    const replies: Reply[] = [
      baseReply,
      { ...baseReply, id: 2, parentId: 1, floorNumber: 2, content: 'Child 1', author: { ...baseReply.author, id: 3, username: 'c1' } },
      { ...baseReply, id: 3, parentId: 1, floorNumber: 3, content: 'Child 2', author: { ...baseReply.author, id: 4, username: 'c2' } },
    ];
    render(<ReplyTree {...baseProps} replies={replies} total={3} />);
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });
});
