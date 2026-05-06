import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import UserProfilePage from '../pages/user/UserProfilePage';

vi.mock('../api/user', () => ({
  getProfile: vi.fn().mockResolvedValue({
    id: 1,
    username: 'testuser',
    email: 'test@test.com',
    avatar: null,
    bio: 'Hello world',
    level: 3,
    points: 150,
    postCount: 5,
    replyCount: 12,
    createdAt: '2025-01-01T00:00:00Z',
  }),
  getUserPosts: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  getUserReplies: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  getCollections: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  getBrowseHistory: vi.fn().mockResolvedValue({ items: [], total: 0 }),
}));

// Mock path must match what UserProfilePage imports: ../../store/authStore
vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn((selector?: (s: any) => any) => {
    const state = {
      user: { id: 2, username: 'otheruser', email: 'other@test.com', avatar: null, level: 1 },
      isAuthenticated: true,
    };
    return selector ? selector(state) : state;
  }),
}));

const renderPage = () => {
  return render(
    <MemoryRouter initialEntries={['/u/testuser']}>
      <Routes>
        <Route path="/u/:username" element={<UserProfilePage />} />
      </Routes>
    </MemoryRouter>,
  );
};

describe('UserProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user profile after loading', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('shows user stats', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/积分：150/)).toBeTruthy();
      expect(screen.getByText(/帖子：5/)).toBeTruthy();
      expect(screen.getByText(/回复：12/)).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('shows level badge', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Lv.3')).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('shows tabs', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('我的帖子')).toBeTruthy();
      expect(screen.getByText('我的回复')).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('hides private tabs for non-owners', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.queryByText('我的收藏')).toBeFalsy();
      expect(screen.queryByText('浏览历史')).toBeFalsy();
    }, { timeout: 3000 });
  });
});
