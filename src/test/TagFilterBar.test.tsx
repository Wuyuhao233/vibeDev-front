import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TagFilterBar from '../components/TagFilterBar';
import { useAuthStore } from '../store/authStore';

const mockTags = [
  { id: 1, name: 'React', slug: 'react', sortOrder: 1 },
  { id: 2, name: 'TypeScript', slug: 'typescript', sortOrder: 2 },
  { id: 3, name: 'JavaScript', slug: 'javascript', sortOrder: 3 },
];

function setAuth(auth: boolean) {
  if (auth) {
    useAuthStore.setState({ isAuthenticated: true, user: { id: 1, username: 'test', email: 'test@test.com', avatar: null, level: 1 }, accessToken: 'token', refreshToken: 'refresh' });
  } else {
    useAuthStore.setState({ isAuthenticated: false, user: null, accessToken: null, refreshToken: null });
  }
}

describe('TagFilterBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAuth(false);
  });

  function renderBar(props?: Partial<{ activeTagId: number | null; followedTagIds: Set<number>; onSelect: () => void; onToggleFollow: () => void }>) {
    const onSelect = props?.onSelect ?? vi.fn();
    const onToggleFollow = props?.onToggleFollow ?? vi.fn();
    return {
      onSelect,
      onToggleFollow,
      ...render(
        <TagFilterBar
          tags={mockTags}
          activeTagId={props?.activeTagId ?? null}
          onSelect={onSelect}
          followedTagIds={props?.followedTagIds}
          onToggleFollow={onToggleFollow}
        />
      ),
    };
  }

  it('renders "全部" button plus all tags', () => {
    renderBar();
    expect(screen.getByText('全部')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
  });

  it('highlights active tag', () => {
    renderBar({ activeTagId: 2 });
    const tsBtn = screen.getByText('TypeScript');
    expect(tsBtn.className).toContain('tag-filter__item--active');
  });

  it('highlights "全部" when no active tag', () => {
    renderBar({ activeTagId: null });
    const allBtn = screen.getByText('全部');
    expect(allBtn.className).toContain('tag-filter__item--active');
  });

  it('calls onSelect with tag id on click', () => {
    const onSelect = vi.fn();
    renderBar({ onSelect });
    fireEvent.click(screen.getByText('React'));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('calls onSelect with null for "全部"', () => {
    const onSelect = vi.fn();
    renderBar({ onSelect, activeTagId: 1 });
    fireEvent.click(screen.getByText('全部'));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('does not call onSelect when clicking already active tag', () => {
    const onSelect = vi.fn();
    renderBar({ onSelect, activeTagId: 1 });
    fireEvent.click(screen.getByText('React'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('shows "更多" when more than 8 tags', () => {
    const manyTags = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `Tag${i + 1}`,
      slug: `tag-${i + 1}`,
      sortOrder: i,
    }));
    render(
      <TagFilterBar
        tags={manyTags}
        activeTagId={null}
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByText('更多...')).toBeInTheDocument();
  });

  describe('V1.1 follow/unfollow', () => {
    it('shows unfollow icon for followed tags (always visible)', () => {
      setAuth(true);
      const followedIds = new Set([1]);
      renderBar({ followedTagIds: followedIds });
      const reactBtn = screen.getByText('React').closest('button')!;
      const toggle = reactBtn.querySelector('.tag-filter__follow-toggle')!;
      expect(toggle).not.toBeNull();
      expect(toggle.querySelector('svg')).toBeInTheDocument();
    });

    it('calls onToggleFollow when clicking follow icon', () => {
      setAuth(true);
      const onToggleFollow = vi.fn();
      renderBar({ onToggleFollow });
      const reactBtn = screen.getByText('React').closest('button')!;
      const toggle = reactBtn.querySelector('.tag-filter__follow-toggle')!;
      fireEvent.click(toggle);
      expect(onToggleFollow).toHaveBeenCalledWith(mockTags[0]);
    });

    it('does not call onSelect when clicking follow toggle', () => {
      setAuth(true);
      const onSelect = vi.fn();
      const onToggleFollow = vi.fn();
      renderBar({ onSelect, onToggleFollow, activeTagId: null });
      const reactBtn = screen.getByText('React').closest('button')!;
      const toggle = reactBtn.querySelector('.tag-filter__follow-toggle')!;
      fireEvent.click(toggle);
      expect(onToggleFollow).toHaveBeenCalled();
      expect(onSelect).not.toHaveBeenCalled();
    });
  });
});
