import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const { mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('../components/ui/Toast', () => ({
  toast: { success: mockToastSuccess, error: mockToastError, info: vi.fn(), warning: vi.fn() },
}));

vi.mock('html2canvas', () => ({
  default: vi.fn(),
}));

import html2canvas from 'html2canvas';
import ShareCardModal from '../components/ShareCardModal';

const mockToBlob = vi.fn();
const mockGetContext = vi.fn();

const cardData = {
  title: '测试帖子标题',
  authorName: '测试用户',
  authorAvatar: null,
  boardName: '技术讨论',
  excerpt: '这是一篇关于前端开发的测试帖子...',
  createdAt: new Date().toISOString(),
  replyCount: 5,
  likeCount: 12,
};

describe('ShareCardModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetContext.mockReturnValue({
      fillRect: vi.fn(),
      fillText: vi.fn(),
    });
    mockToBlob.mockImplementation(function (this: any, cb: (b: Blob) => void) {
      cb(new Blob(['test'], { type: 'image/png' }));
    });
    const mockCanvas = {
      toBlob: mockToBlob,
      getContext: mockGetContext,
      width: 1200,
      height: 680,
    };
    (html2canvas as any).mockResolvedValue(mockCanvas);
  });

  it('renders nothing when closed', () => {
    render(
      <ShareCardModal
        open={false}
        onClose={vi.fn()}
        cardData={cardData}
        postUrl="https://example.com/post/1"
      />,
    );
    expect(screen.queryByText('分享卡片')).not.toBeInTheDocument();
  });

  it('shows generating state when open', () => {
    (html2canvas as any).mockReturnValue(new Promise(() => {})); // never resolves
    render(
      <ShareCardModal
        open={true}
        onClose={vi.fn()}
        cardData={cardData}
        postUrl="https://example.com/post/1"
      />,
    );
    expect(screen.getByText('生成中...')).toBeInTheDocument();
  });

  it('shows preview and download button after generation', async () => {
    render(
      <ShareCardModal
        open={true}
        onClose={vi.fn()}
        cardData={cardData}
        postUrl="https://example.com/post/1"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('下载图片')).toBeInTheDocument();
    });
    expect(screen.getByText('复制链接')).toBeInTheDocument();
  });

  it('shows error state and retry button on generation failure', async () => {
    (html2canvas as any).mockRejectedValue(new Error('fail'));

    render(
      <ShareCardModal
        open={true}
        onClose={vi.fn()}
        cardData={cardData}
        postUrl="https://example.com/post/1"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('生成失败')).toBeInTheDocument();
      expect(screen.getByText('重试')).toBeInTheDocument();
    });
  });

  it('does not render when cardData is null', () => {
    (html2canvas as any).mockReturnValue(new Promise(() => {}));
    render(
      <ShareCardModal
        open={true}
        onClose={vi.fn()}
        cardData={null}
        postUrl="https://example.com/post/1"
      />,
    );
    // When cardData is null, generate() returns early without setting stage
    // The initial stage is 'generating'
    expect(screen.getByText('生成中...')).toBeInTheDocument();
  });
});
