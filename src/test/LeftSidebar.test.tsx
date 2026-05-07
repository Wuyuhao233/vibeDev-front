import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LeftSidebar from '../components/LeftSidebar';
import * as boardApi from '../api/board';

vi.mock('../api/board');

const mockBoards: boardApi.Board[] = [
  { id: 1, name: 'General', slug: 'general', description: '', icon: null, postCount: 10, sortOrder: 1 },
  { id: 2, name: 'Announcements', slug: 'announcements', description: '', icon: null, postCount: 5, sortOrder: 0 },
];

function Wrapper({ children }: { children: React.ReactNode }) {
  function BoardRoute() {
    return <>{children}</>;
  }
  return (
    <MemoryRouter initialEntries={['/board/general']}>
      <Routes>
        <Route path="/board/:id" element={<BoardRoute />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('LeftSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(boardApi.getBoards).mockResolvedValue(mockBoards);
  });

  function renderSidebar(route = '/') {
    return render(
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="*" element={<LeftSidebar />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('renders navigation header', () => {
    renderSidebar();
    expect(screen.getByText('版块导航')).toBeInTheDocument();
  });

  it('renders board list after loading', async () => {
    renderSidebar();
    await waitFor(() => {
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Announcements')).toBeInTheDocument();
    });
  });

  it('shows post counts', async () => {
    renderSidebar();
    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('renders "我的关注" section with placeholder', () => {
    renderSidebar();
    expect(screen.getByText('我的关注')).toBeInTheDocument();
    expect(screen.getByText('关注感兴趣的标签')).toBeInTheDocument();
  });

  it('highlights active board', async () => {
    render(
      <MemoryRouter initialEntries={['/board/general']}>
        <Routes>
          <Route path="/board/:id" element={<LeftSidebar />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const link = screen.getByText('General').closest('a');
      expect(link).toBeInTheDocument();
      expect(link?.className).toContain('board-nav-item--active');
    });
  });

  it('shows error state when API fails', async () => {
    vi.mocked(boardApi.getBoards).mockRejectedValue(new Error('Network error'));
    renderSidebar();
    await waitFor(() => {
      expect(screen.getByText('版块列表加载失败')).toBeInTheDocument();
    });
  });

  it('loads from localStorage cache', async () => {
    const cached = JSON.stringify({ boards: mockBoards, timestamp: Date.now() });
    localStorage.setItem('vibeDev:sidebar:boards', cached);
    renderSidebar();
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Announcements')).toBeInTheDocument();
  });
});
