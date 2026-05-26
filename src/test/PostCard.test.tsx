import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PostCard from '../components/PostCard';
import type { PostCardData } from '../types/board';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const basePost: PostCardData = {
  id: 1,
  title: 'Test Post Title',
  content: 'This is the content of the post.',
  contentSummary: 'This is the summary',
  author: {
    id: 1,
    username: 'testuser',
    avatar: null,
    level: 3,
  },
  board: { id: 1, name: 'Test Board', slug: 'test-board' },
  tags: [
    { id: 1, name: 'React', slug: 'react' },
    { id: 2, name: 'TypeScript', slug: 'typescript' },
  ],
  likeCount: 10,
  replyCount: 5,
  collectCount: 2,
  isLiked: false,
  isCollected: false,
  createdAt: new Date(Date.now() - 3600000).toISOString(),
  isPinned: false,
  isEssence: false,
};

function renderPostCard(post: PostCardData, showBoard = false) {
  return render(
    <MemoryRouter>
      <PostCard post={post} showBoard={showBoard} />
    </MemoryRouter>
  );
}

describe('PostCard', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders post title', () => {
    renderPostCard(basePost);
    expect(screen.getByText('Test Post Title')).toBeInTheDocument();
  });

  it('renders author name and level', () => {
    renderPostCard(basePost);
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('Lv.3')).toBeInTheDocument();
  });

  it('renders relative time', () => {
    renderPostCard(basePost);
    expect(screen.getByText(/\d+分钟前|\d+小时前|刚刚/)).toBeInTheDocument();
  });

  it('renders stats with formatted counts', () => {
    renderPostCard(basePost);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders pinned badge when post is pinned', () => {
    const pinnedPost = { ...basePost, isPinned: true };
    renderPostCard(pinnedPost);
    expect(screen.getByText('置顶')).toBeInTheDocument();
  });

  it('renders essence badge when post is essence', () => {
    const essencePost = { ...basePost, isEssence: true };
    renderPostCard(essencePost);
    expect(screen.getByText('精')).toBeInTheDocument();
  });

  it('renders tags', () => {
    renderPostCard(basePost);
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('shows +N when more than 3 tags', () => {
    const manyTagsPosts: PostCardData = {
      ...basePost,
      tags: [
        { id: 1, name: 'React', slug: 'react' },
        { id: 2, name: 'Vue', slug: 'vue' },
        { id: 3, name: 'Angular', slug: 'angular' },
        { id: 4, name: 'Svelte', slug: 'svelte' },
      ],
    };
    renderPostCard(manyTagsPosts);
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('renders board name when showBoard is true', () => {
    renderPostCard(basePost, true);
    expect(screen.getByText('Test Board')).toBeInTheDocument();
  });

  it('navigates to post detail on card click', () => {
    renderPostCard(basePost);
    const article = screen.getByText('Test Post Title').closest('article')!;
    fireEvent.click(article);
    expect(mockNavigate).toHaveBeenCalledWith('/post/1');
  });

  it('navigates to user profile on author click', () => {
    renderPostCard(basePost);
    const authorEl = screen.getByText('testuser').closest('[role="button"]')!;
    fireEvent.click(authorEl);
    expect(mockNavigate).toHaveBeenCalledWith('/u/testuser');
  });

  it('renders cover image when coverImageUrl is provided', () => {
    const withCover = { ...basePost, coverImageUrl: 'https://example.com/img.jpg' };
    renderPostCard(withCover);
    const img = document.querySelector('.post-card__cover img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/img.jpg');
  });

  it('handles "刚刚" for recent posts', () => {
    const recent = { ...basePost, createdAt: new Date().toISOString() };
    renderPostCard(recent);
    expect(screen.getByText('刚刚')).toBeInTheDocument();
  });

  it('shows no tags when tags array is empty', () => {
    const noTags = { ...basePost, tags: [] };
    renderPostCard(noTags);
    expect(screen.queryByText('React')).not.toBeInTheDocument();
  });
});
