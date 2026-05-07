import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReplyList from '../components/ReplyList';
import type { Reply } from '../api/reply';

const baseReply: Reply = {
  id: 1,
  content: 'This is a reply',
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

describe('ReplyList', () => {
  it('renders replies', () => {
    render(<ReplyList {...baseProps} />);
    expect(screen.getByText('This is a reply')).toBeInTheDocument();
    expect(screen.getByText('replier')).toBeInTheDocument();
  });

  it('shows total count', () => {
    render(<ReplyList {...baseProps} />);
    expect(screen.getByText('共 1 条回复')).toBeInTheDocument();
  });

  it('shows empty state when no replies', () => {
    render(<ReplyList {...baseProps} replies={[]} total={0} />);
    expect(screen.getByText('暂无回复')).toBeInTheDocument();
  });

  it('shows loading skeleton', () => {
    render(<ReplyList {...baseProps} replies={[]} loading={true} />);
    expect(document.querySelector('.animate-shimmer')).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(<ReplyList {...baseProps} replies={[]} error="加载失败" />);
    expect(screen.getByText('加载失败')).toBeInTheDocument();
  });

  it('shows floor numbers', () => {
    render(<ReplyList {...baseProps} />);
    expect(screen.getByText('#1')).toBeInTheDocument();
  });

  it('renders multiple replies with pagination', () => {
    const replies: Reply[] = [
      baseReply,
      { ...baseReply, id: 2, floorNumber: 2, content: 'Second reply', author: { ...baseReply.author, id: 3, username: 'user3' } },
    ];
    render(<ReplyList {...baseProps} replies={replies} total={50} />);
    expect(screen.getByText('Second reply')).toBeInTheDocument();
    // Pagination should be visible
    expect(screen.getByText('共 50 条')).toBeInTheDocument();
  });
});
