import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SharePanel from '../components/SharePanel';

const mockWriteText = vi.fn();

Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: mockWriteText },
  writable: true,
});

describe('SharePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders share button', () => {
    render(<SharePanel url="https://example.com/post/1" />);
    expect(screen.getByText('分享')).toBeInTheDocument();
  });

  it('copies url to clipboard on click', async () => {
    mockWriteText.mockResolvedValueOnce(undefined);
    render(<SharePanel url="https://example.com/post/1" title="Test Post" />);
    fireEvent.click(screen.getByText('分享'));
    expect(mockWriteText).toHaveBeenCalledWith('https://example.com/post/1');
  });

  it('shows "已复制" after successful copy', async () => {
    mockWriteText.mockResolvedValueOnce(undefined);
    render(<SharePanel url="https://example.com/post/1" />);
    fireEvent.click(screen.getByText('分享'));
    expect(await screen.findByText('已复制')).toBeInTheDocument();
  });
});
