import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const { mockGetPost, mockDeletePost, mockRecordPostView, mockPinPost, mockUnpinPost, mockToggleEssence } = vi.hoisted(() => ({
  mockGetPost: vi.fn(),
  mockDeletePost: vi.fn(),
  mockRecordPostView: vi.fn(),
  mockPinPost: vi.fn(),
  mockUnpinPost: vi.fn(),
  mockToggleEssence: vi.fn(),
}));

const { mockGetReplies, mockCreateReply, mockDeleteReply } = vi.hoisted(() => ({
  mockGetReplies: vi.fn(),
  mockCreateReply: vi.fn(),
  mockDeleteReply: vi.fn(),
}));

vi.mock('../api/post', () => ({
  getPost: mockGetPost,
  deletePost: mockDeletePost,
  recordPostView: mockRecordPostView,
  pinPost: mockPinPost,
  unpinPost: mockUnpinPost,
  toggleEssence: mockToggleEssence,
  getSensitiveWords: vi.fn().mockResolvedValue([]),
}));

vi.mock('../api/reply', () => ({
  getReplies: mockGetReplies,
  createReply: mockCreateReply,
  deleteReply: mockDeleteReply,
}));

vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: null,
    isAuthenticated: false,
  })),
}));

import PostPageComponent from '../pages/PostPage';

const mockPostData = {
  id: 1,
  title: 'Test Post',
  content: 'Hello **world**',
  contentMarkdown: 'Hello **world**',
  author: { id: 1, username: 'testuser', avatar: null, level: 3 },
  board: { id: 1, name: '综合讨论', slug: 'general' },
  tags: [{ id: 1, name: 'React', slug: 'react' }],
  likeCount: 10,
  replyCount: 5,
  collectCount: 3,
  viewCount: 100,
  isLiked: false,
  isCollected: false,
  isPinned: false,
  isEssence: false,
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockRepliesData = {
  items: [
    {
      id: 1,
      content: 'Nice post!',
      author: { id: 2, username: 'reply_user', avatar: null, level: 2 },
      parentId: null,
      floorNumber: 1,
      likeCount: 2,
      isLiked: false,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  total: 1,
};

function PostPageWrapper() {
  return <PostPageComponent />;
}

function renderPostPage(postId = '1') {
  return render(
    <MemoryRouter initialEntries={[`/post/${postId}`]}>
      <Routes>
        <Route path="/post/:id" element={<PostPageWrapper />} />
        <Route path="/board/:slug" element={<div>Board Page</div>} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PostPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPost.mockResolvedValue(mockPostData);
    mockRecordPostView.mockResolvedValue(undefined);
    mockGetReplies.mockResolvedValue(mockRepliesData);
  });

  it('shows loading skeleton initially', () => {
    renderPostPage();
    expect(document.querySelector('.animate-shimmer')).toBeInTheDocument();
  });

  it('renders post title after loading', async () => {
    renderPostPage();
    await waitFor(() => {
      expect(screen.getByText('Test Post')).toBeInTheDocument();
    });
  });

  it('renders author info', async () => {
    renderPostPage();
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });
  });

  it('shows breadcrumb with board name', async () => {
    renderPostPage();
    await waitFor(() => {
      expect(screen.getByText('综合讨论')).toBeInTheDocument();
    });
  });

  it('shows 404 for non-existent post', async () => {
    mockGetPost.mockRejectedValueOnce({ message: 'NOT_FOUND', code: 'NOT_FOUND (30001)' });
    renderPostPage('999');
    await waitFor(() => {
      expect(screen.getByText('帖子不存在')).toBeInTheDocument();
    });
  });

  it('renders replies section', async () => {
    renderPostPage();
    await waitFor(() => {
      expect(screen.getByText('Nice post!')).toBeInTheDocument();
    });
  });

  it('shows login prompt for unauthenticated users', async () => {
    renderPostPage();
    await waitFor(() => {
      expect(screen.getByText('登录')).toBeInTheDocument();
    });
  });

  it('records view on mount', async () => {
    renderPostPage();
    await waitFor(() => {
      expect(mockRecordPostView).toHaveBeenCalledWith(1);
    });
  });

  it('shows appeal button for rejected post when user is author', async () => {
    const { useAuthStore } = await import('../store/authStore');
    (useAuthStore as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: 1, username: 'testuser', level: 3 },
      isAuthenticated: true,
    });

    mockGetPost.mockResolvedValue({
      ...mockPostData,
      auditStatus: 'REJECTED',
      auditReason: '内容违规',
    });

    renderPostPage();
    await waitFor(() => {
      expect(screen.getByText('申诉')).toBeInTheDocument();
    });
  });
});
