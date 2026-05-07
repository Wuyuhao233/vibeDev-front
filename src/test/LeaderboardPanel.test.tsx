import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LeaderboardPanel from '../components/LeaderboardPanel';
import * as pointsApi from '../api/points';
import { useAuthStore } from '../store/authStore';

vi.mock('../api/points');

const mockEntries = [
  { rank: 1, userId: 1, username: 'topuser', avatar: null, points: 5000 },
  { rank: 2, userId: 2, username: 'seconduser', avatar: null, points: 4000 },
  { rank: 3, userId: 3, username: 'thirduser', avatar: null, points: 3000 },
  { rank: 4, userId: 4, username: 'testuser', avatar: null, points: 1500 },
];

describe('LeaderboardPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: 4, username: 'testuser', email: 'test@test.com', avatar: null, level: 3 },
      accessToken: 'token',
      refreshToken: 'refresh',
    });
    vi.mocked(pointsApi.getLeaderboard).mockResolvedValue({
      items: mockEntries,
      total: 4,
      currentUser: { rank: 4, points: 1500 },
    });
  });

  function renderPanel() {
    return render(
      <MemoryRouter>
        <LeaderboardPanel />
      </MemoryRouter>,
    );
  }

  it('renders tab buttons', async () => {
    renderPanel();
    await waitFor(() => {
      expect(screen.getByText('周榜')).toBeInTheDocument();
      expect(screen.getByText('月榜')).toBeInTheDocument();
      expect(screen.getByText('总榜')).toBeInTheDocument();
    });
  });

  it('renders leaderboard entries', async () => {
    renderPanel();
    await waitFor(() => {
      expect(screen.getByText('topuser')).toBeInTheDocument();
      expect(screen.getByText('seconduser')).toBeInTheDocument();
      expect(screen.getByText('thirduser')).toBeInTheDocument();
    });
  });

  it('shows medal emojis for top 3', async () => {
    renderPanel();
    await waitFor(() => {
      expect(screen.getByText('🥇')).toBeInTheDocument();
      expect(screen.getByText('🥈')).toBeInTheDocument();
      expect(screen.getByText('🥉')).toBeInTheDocument();
    });
  });

  it('highlights current user', async () => {
    renderPanel();
    await waitFor(() => {
      expect(screen.getByText('(我)')).toBeInTheDocument();
    });
  });

  it('shows current user rank banner', async () => {
    renderPanel();
    await waitFor(() => {
      expect(screen.getByText('我的排名：第 4 名')).toBeInTheDocument();
    });
  });

  it('switches periods on tab click', async () => {
    const user = userEvent.setup();
    renderPanel();

    await waitFor(() => {
      expect(screen.getByText('周榜')).toBeInTheDocument();
    });

    await user.click(screen.getByText('月榜'));

    await waitFor(() => {
      expect(pointsApi.getLeaderboard).toHaveBeenCalledWith('monthly', 1, 20);
    });
  });

  it('shows error state on API failure', async () => {
    vi.mocked(pointsApi.getLeaderboard).mockRejectedValue(new Error('fail'));
    renderPanel();

    await waitFor(() => {
      expect(screen.getByText('排行榜加载失败')).toBeInTheDocument();
    });
  });

  it('shows empty state when no entries', async () => {
    vi.mocked(pointsApi.getLeaderboard).mockResolvedValue({
      items: [],
      total: 0,
      currentUser: null,
    });
    renderPanel();

    await waitFor(() => {
      expect(screen.getByText('暂无排行数据')).toBeInTheDocument();
    });
  });

  it('renders points for each entry', async () => {
    renderPanel();
    await waitFor(() => {
      expect(screen.getByText('5000 积分')).toBeInTheDocument();
      expect(screen.getByText('4000 积分')).toBeInTheDocument();
    });
  });
});
