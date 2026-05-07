import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { mockGetBoards, mockCreatePost, mockGetSensitiveWords } = vi.hoisted(() => ({
  mockGetBoards: vi.fn(),
  mockCreatePost: vi.fn(),
  mockGetSensitiveWords: vi.fn(),
}));

vi.mock('../api/board', () => ({
  getBoards: mockGetBoards,
}));

vi.mock('../api/post', () => ({
  createPost: mockCreatePost,
  getSensitiveWords: mockGetSensitiveWords,
}));

vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 1, username: 'testuser' },
    isAuthenticated: true,
  })),
}));

import NewPostPageComponent from '../pages/NewPostPage';

const mockBoardsData = [
  { id: 1, name: '综合讨论', slug: 'general', description: '', icon: null, postCount: 128, sortOrder: 1, tags: [
    { id: 1, name: '闲聊', slug: 'chat', sortOrder: 1 },
    { id: 2, name: '教程', slug: 'tutorial', sortOrder: 2 },
  ]},
  { id: 2, name: '技术交流', slug: 'tech', description: '', icon: null, postCount: 86, sortOrder: 2 },
];

function renderNewPostPage(search = '') {
  return render(
    <MemoryRouter initialEntries={[`/post/new${search}`]}>
      <NewPostPageComponent />
    </MemoryRouter>,
  );
}

describe('NewPostPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockGetBoards.mockResolvedValue(mockBoardsData);
    mockCreatePost.mockResolvedValue({ id: 1, title: 'Test' });
    mockGetSensitiveWords.mockResolvedValue(['敏感词1', '敏感词2']);
  });

  it('renders page title', async () => {
    renderNewPostPage();
    await waitFor(() => {
      expect(screen.getByText('发布新帖')).toBeInTheDocument();
    });
  });

  it('renders board selector after loading', async () => {
    renderNewPostPage();
    await waitFor(() => {
      expect(screen.getByText('综合讨论')).toBeInTheDocument();
      expect(screen.getByText('技术交流')).toBeInTheDocument();
    });
  });

  it('renders title input', () => {
    renderNewPostPage();
    expect(screen.getByPlaceholderText('请输入标题（5-100 字符）')).toBeInTheDocument();
  });

  it('renders markdown editor', () => {
    renderNewPostPage();
    expect(screen.getByPlaceholderText('请输入帖子内容，支持 Markdown 语法')).toBeInTheDocument();
  });

  it('renders publish button', () => {
    renderNewPostPage();
    expect(screen.getByText('发布')).toBeInTheDocument();
  });

  it('shows title character counter', () => {
    renderNewPostPage();
    const input = screen.getByPlaceholderText('请输入标题（5-100 字符）');
    fireEvent.change(input, { target: { value: 'Hello' } });
    expect(screen.getByText('5/100')).toBeInTheDocument();
  });

  it('prefills board from query param', async () => {
    renderNewPostPage('?board=1');
    await waitFor(() => {
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('1');
    });
  });

  it('shows tag selector when board is selected', async () => {
    renderNewPostPage('?board=1');
    await waitFor(() => {
      expect(screen.getByPlaceholderText('选择标签（1-3个）')).toBeInTheDocument();
    });
  });

  it('loads without errors', async () => {
    renderNewPostPage();
    await waitFor(() => {
      expect(screen.getByText('发布新帖')).toBeInTheDocument();
    });
  });

  it('publishes post with correct data', async () => {
    renderNewPostPage('?board=1');

    await waitFor(() => {
      expect(screen.getByText('发布新帖')).toBeInTheDocument();
    });

    // Open tag selector dropdown and select a tag
    const tagInput = screen.getByPlaceholderText('选择标签（1-3个）');
    fireEvent.focus(tagInput);
    await waitFor(() => {
      expect(screen.getByText('教程')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('教程'));

    fireEvent.change(screen.getByPlaceholderText('请输入标题（5-100 字符）'), {
      target: { value: 'A great post title' },
    });
    fireEvent.change(screen.getByPlaceholderText('请输入帖子内容，支持 Markdown 语法'), {
      target: { value: 'This is the content of the post.' },
    });

    fireEvent.click(screen.getByText('发布'));

    await waitFor(() => {
      expect(mockCreatePost).toHaveBeenCalled();
    });
  });
});
