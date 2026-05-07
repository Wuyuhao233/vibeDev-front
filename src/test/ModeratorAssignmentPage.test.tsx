import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ModeratorAssignmentPage from '../pages/admin/ModeratorAssignmentPage';

vi.mock('../api/admin', () => ({
  getModeratorList: vi.fn(),
  updateUserRole: vi.fn(),
  getAdminBoards: vi.fn(),
  getUsers: vi.fn(),
}));

import * as adminApi from '../api/admin';

const mockModerators = {
  items: [
    { id: '1', username: 'mod1', email: 'mod1@test.com', avatarUrl: null, role: 'moderator', level: 3 },
    { id: '2', username: 'mod2', email: 'mod2@test.com', avatarUrl: null, role: 'moderator', level: 4 },
  ],
  total: 2,
};

const mockBoards = [
  { id: 1, name: '前端', slug: 'frontend', description: '', icon: null, postCount: 156, sortOrder: 1, status: 'active' as const },
  { id: 2, name: '后端', slug: 'backend', description: '', icon: null, postCount: 89, sortOrder: 2, status: 'active' as const },
  { id: 3, name: 'AI', slug: 'ai', description: '', icon: null, postCount: 234, sortOrder: 3, status: 'active' as const },
];

function renderComponent() {
  return render(
    <MemoryRouter>
      <ModeratorAssignmentPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(adminApi.getModeratorList).mockResolvedValue(mockModerators);
  vi.mocked(adminApi.getAdminBoards).mockResolvedValue(mockBoards);
  vi.mocked(adminApi.updateUserRole).mockResolvedValue({});
});

describe('ModeratorAssignmentPage', () => {
  it('renders loading state initially', () => {
    vi.mocked(adminApi.getModeratorList).mockReturnValue(new Promise(() => {}));
    vi.mocked(adminApi.getAdminBoards).mockReturnValue(new Promise(() => {}));
    renderComponent();
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('renders moderator list after data loads', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('版主分配')).toBeInTheDocument();
    });
    expect(screen.getByText('mod1')).toBeInTheDocument();
    expect(screen.getByText('mod2')).toBeInTheDocument();
    expect(screen.getByText('mod1@test.com')).toBeInTheDocument();
  });

  it('renders empty state when no moderators', async () => {
    vi.mocked(adminApi.getModeratorList).mockResolvedValue({ items: [], total: 0 });
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('暂无版主')).toBeInTheDocument();
    });
  });

  it('opens assignment modal when clicking 分配版块', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('mod1')).toBeInTheDocument();
    });
    const assignBtns = screen.getAllByText('分配版块');
    await userEvent.click(assignBtns[0]);
    await waitFor(() => {
      expect(screen.getByText('分配版块 — mod1')).toBeInTheDocument();
    });
  });

  it('shows board list in assignment modal', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('mod1')).toBeInTheDocument();
    });
    await userEvent.click(screen.getAllByText('分配版块')[0]);
    await waitFor(() => {
      expect(screen.getByText('前端')).toBeInTheDocument();
    });
    expect(screen.getByText('后端')).toBeInTheDocument();
    expect(screen.getByText('AI')).toBeInTheDocument();
  });

  it('toggles board selection in modal', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('mod1')).toBeInTheDocument();
    });
    await userEvent.click(screen.getAllByText('分配版块')[0]);
    await waitFor(() => {
      expect(screen.getByText('前端')).toBeInTheDocument();
    });

    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBe(3);

    // Initially 0 selected
    expect(screen.getByText('已选 0 个版块')).toBeInTheDocument();

    await userEvent.click(checkboxes[0]);
    expect(screen.getByText('已选 1 个版块')).toBeInTheDocument();

    await userEvent.click(checkboxes[1]);
    expect(screen.getByText('已选 2 个版块')).toBeInTheDocument();
  });

  it('calls updateUserRole when confirming assignment', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('mod1')).toBeInTheDocument();
    });
    await userEvent.click(screen.getAllByText('分配版块')[0]);
    await waitFor(() => {
      expect(screen.getByText('前端')).toBeInTheDocument();
    });

    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    await userEvent.click(checkboxes[0]);

    await userEvent.click(screen.getByText('确认分配'));
    await waitFor(() => {
      expect(adminApi.updateUserRole).toHaveBeenCalledWith('1', 'moderator');
    });
  });

  it('closes modal when clicking cancel', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('mod1')).toBeInTheDocument();
    });
    await userEvent.click(screen.getAllByText('分配版块')[0]);
    await waitFor(() => {
      expect(screen.getByText('分配版块 — mod1')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('取消'));
    await waitFor(() => {
      expect(screen.queryByText('分配版块 — mod1')).not.toBeInTheDocument();
    });
  });

  it('shows error state on API failure', async () => {
    vi.mocked(adminApi.getModeratorList).mockRejectedValue(new Error('网络错误'));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('加载失败')).toBeInTheDocument();
    });
  });
});
