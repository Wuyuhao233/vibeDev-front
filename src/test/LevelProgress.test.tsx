import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LevelProgress from '../components/LevelProgress';

describe('LevelProgress', () => {
  it('renders level badge and progress', () => {
    render(<LevelProgress points={50} />);
    expect(screen.getByText('Lv.1')).toBeInTheDocument();
    expect(screen.getByText('50 / 100 积分')).toBeInTheDocument();
  });

  it('shows correct level for level 2 points', () => {
    render(<LevelProgress points={200} />);
    expect(screen.getByText('Lv.2')).toBeInTheDocument();
    expect(screen.getByText('200 / 300 积分')).toBeInTheDocument();
  });

  it('shows correct level for level 3 points', () => {
    render(<LevelProgress points={450} />);
    expect(screen.getByText('Lv.3')).toBeInTheDocument();
    expect(screen.getByText('450 / 600 积分')).toBeInTheDocument();
  });

  it('shows correct level for level 6 points', () => {
    render(<LevelProgress points={2500} />);
    expect(screen.getByText('Lv.6')).toBeInTheDocument();
  });

  it('displays max level message when at level 6', () => {
    render(<LevelProgress points={3000} />);
    expect(screen.getByText('已达到最高等级')).toBeInTheDocument();
  });

  it('shows remaining points to next level', () => {
    render(<LevelProgress points={50} />);
    expect(screen.getByText('还需 50 积分升级到 Lv.2')).toBeInTheDocument();
  });

  it('renders progress bar element', () => {
    const { container } = render(<LevelProgress points={50} />);
    const bar = container.querySelector('.h-2.bg-gray-200');
    expect(bar).toBeInTheDocument();
  });
});
