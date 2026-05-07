import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import UserProfilePage from '../pages/user/UserProfilePage';
import * as userApi from '../api/user';
import * as pointsApi from '../api/points';
import * as collectionApi from '../api/collection';
import { useAuthStore } from '../store/authStore';

vi.mock('../api/user');
vi.mock('../api/points');
vi.mock('../api/collection');

const mockProfile: userApi.UserProfile = {
  id: 1,
  username: 'testuser',
  email: 'test@test.com',
  avatar: null,
  bio: 'Hello world',
  level: 3,
  points: 450,
  postCount: 15,
  replyCount: 30,
  createdAt: new Date().toISOString(),
};

function setAuth(authed: boolean, username = 'testuser') {
  if (authed) {
    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: 1, username, email: 'test@test.com', avatar: null, level: 3 },
      accessToken: 'token',
      refreshToken: 'refresh',
    });
  } else {
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
    });
  }
}

describe('UserProfilePage - Points V1.1', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
    });
    vi.mocked(userApi.getProfile).mockResolvedValue(mockProfile);
    vi.mocked(userApi.getUserPosts).mockResolvedValue({ items: [], total: 0 });
    vi.mocked(userApi.getUserReplies).mockResolvedValue({ items: [], total: 0 });
    vi.mocked(userApi.getCollections).mockResolvedValue({ items: [], total: 0 });
    vi.mocked(userApi.getBrowseHistory).mockResolvedValue({ items: [], total: 0 });
    vi.mocked(pointsApi.getPointsHistory).mockResolvedValue({ items: [], total: 0 });
    vi.mocked(collectionApi.getFolders).mockResolvedValue([]);
  });

  function renderProfile(username = 'testuser') {
    return render(
      <MemoryRouter initialEntries={[`/u/${username}`]}>
        <Routes>
          <Route path="/u/:username" element={<UserProfilePage />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it('shows level progress bar', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('450 / 600 积分')).toBeInTheDocument();
    });
  });

  it('shows "积分记录" tab for owner', async () => {
    setAuth(true);
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('积分记录')).toBeInTheDocument();
    });
  });

  it('does not show "积分记录" tab for non-owner', async () => {
    setAuth(true, 'otheruser');
    renderProfile();
    await waitFor(() => {
      expect(screen.queryByText('积分记录')).not.toBeInTheDocument();
    });
  });

  it('renders level badge in profile header', async () => {
    renderProfile();
    await waitFor(() => {
      const badges = screen.getAllByText('Lv.3');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows level progress bar with remaining points text', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('还需 150 积分升级到 Lv.4')).toBeInTheDocument();
    });
  });

  it('renders points history when "积分记录" tab is selected', async () => {
    setAuth(true);
    vi.mocked(pointsApi.getPointsHistory).mockResolvedValue({
      items: [{ id: 1, description: '签到', points: 5, createdAt: new Date().toISOString() }],
      total: 1,
    });
    const { container } = renderProfile();

    await waitFor(() => {
      expect(screen.getByText('积分记录')).toBeInTheDocument();
    });

    const pointsTab = screen.getByText('积分记录');
    pointsTab.click();

    await waitFor(() => {
      expect(screen.getByText('签到')).toBeInTheDocument();
    });
  });
});
