import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SearchInput, { getHistory, saveHistory, clearHistory, SEARCH_HISTORY_KEY } from '../components/SearchInput';

describe('SearchInput', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  function renderInput(props: Partial<React.ComponentProps<typeof SearchInput>> = {}) {
    const onSubmit = props.onSubmit || vi.fn();
    const onChange = props.onChange || vi.fn();
    return {
      onSubmit,
      onChange,
      ...render(
        <MemoryRouter>
          <SearchInput
            value={props.value ?? ''}
            onChange={onChange}
            onSubmit={onSubmit}
            {...props}
          />
        </MemoryRouter>,
      ),
    };
  }

  it('renders input with placeholder', () => {
    renderInput();
    expect(screen.getByPlaceholderText('搜索帖子...')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    renderInput({ placeholder: '自定义占位...' });
    expect(screen.getByPlaceholderText('自定义占位...')).toBeInTheDocument();
  });

  it('calls onChange when typing', () => {
    const { onChange } = renderInput();
    const input = screen.getByPlaceholderText('搜索帖子...');
    fireEvent.change(input, { target: { value: 'react' } });
    expect(onChange).toHaveBeenCalledWith('react');
  });

  it('calls onSubmit on Enter with trimmed value', () => {
    const { onSubmit } = renderInput({ value: 'react' });
    const input = screen.getByPlaceholderText('搜索帖子...');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledWith('react');
  });

  it('does not call onSubmit on Enter with empty value', () => {
    const { onSubmit } = renderInput({ value: '  ' });
    const input = screen.getByPlaceholderText('搜索帖子...');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows search history on focus', () => {
    saveHistory('react');
    saveHistory('typescript');
    const { container } = renderInput();
    const input = screen.getByPlaceholderText('搜索帖子...');
    fireEvent.focus(input);
    expect(screen.getByText('搜索历史')).toBeInTheDocument();
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('typescript')).toBeInTheDocument();
  });

  it('saves query to history on submit', () => {
    const { onSubmit } = renderInput({ value: 'react' });
    const input = screen.getByPlaceholderText('搜索帖子...');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(getHistory()).toContain('react');
  });

  it('clears history when clear all is clicked', () => {
    saveHistory('react');
    saveHistory('typescript');
    renderInput();
    const input = screen.getByPlaceholderText('搜索帖子...');
    fireEvent.focus(input);
    fireEvent.click(screen.getByText('清除全部'));
    expect(getHistory()).toHaveLength(0);
  });

  it('removes single history item', () => {
    saveHistory('react');
    saveHistory('typescript');
    renderInput();
    const input = screen.getByPlaceholderText('搜索帖子...');
    fireEvent.focus(input);
    const removeButtons = screen.getAllByLabelText(/清除/);
    fireEvent.click(removeButtons[0]);
    expect(getHistory()).toHaveLength(1);
  });

  it('filters history based on input value', () => {
    saveHistory('react');
    saveHistory('typescript');
    saveHistory('redux');
    const { onChange } = renderInput({ value: 're' });
    const input = screen.getByPlaceholderText('搜索帖子...');
    fireEvent.focus(input);
    // Should show react and redux but not typescript
    // Text is broken by <mark> tags, find by parent buttons' textContent
    const items = screen.getAllByRole('button').filter(
      (btn) => btn.closest('.z-dropdown') && btn.textContent
    );
    const texts = items.map((btn) => btn.textContent?.replace(/清除\s*".*"|清除全部/g, '').trim());
    expect(texts.some((t) => t?.includes('react') && !t?.includes('redux'))).toBe(true);
    expect(texts.some((t) => t?.includes('redux'))).toBe(true);
    expect(texts.some((t) => t?.includes('typescript'))).toBe(false);
  });

  it('navigates with keyboard arrow keys and selects item on Enter', () => {
    saveHistory('react');
    saveHistory('typescript');
    const onSubmit = vi.fn();
    renderInput({ value: '', onSubmit });
    const input = screen.getByPlaceholderText('搜索帖子...');
    fireEvent.focus(input);
    // Arrow down to first item (typescript saved last, so it's first due to unshift)
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    // Enter to select first item
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledWith('typescript');
  });

  it('closes dropdown on Escape', () => {
    saveHistory('react');
    renderInput();
    const input = screen.getByPlaceholderText('搜索帖子...');
    fireEvent.focus(input);
    expect(screen.getByText('搜索历史')).toBeInTheDocument();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByText('搜索历史')).not.toBeInTheDocument();
  });

  it('closes dropdown on outside click', async () => {
    saveHistory('react');
    const { container } = render(
      <MemoryRouter>
        <div>
          <SearchInput value="" onChange={vi.fn()} onSubmit={vi.fn()} />
          <button>Outside</button>
        </div>
      </MemoryRouter>,
    );
    const input = screen.getByPlaceholderText('搜索帖子...');
    fireEvent.focus(input);
    expect(screen.getByText('搜索历史')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByText('Outside'));
    await waitFor(() => {
      expect(screen.queryByText('搜索历史')).not.toBeInTheDocument();
    });
  });

  it('shows suggestions instead of history when suggestions provided', () => {
    saveHistory('react');
    renderInput({ value: 're', suggestions: ['react hooks', 'react native', 'redux'] });
    const input = screen.getByPlaceholderText('搜索帖子...');
    fireEvent.focus(input);
    expect(screen.getByText('搜索建议')).toBeInTheDocument();
    expect(screen.getByText('react hooks')).toBeInTheDocument();
    expect(screen.queryByText('搜索历史')).not.toBeInTheDocument();
  });

  it('highlights matching text in history items', () => {
    saveHistory('react');
    saveHistory('redux');
    renderInput({ value: 'rea' });
    const input = screen.getByPlaceholderText('搜索帖子...');
    fireEvent.focus(input);
    // react should have highlighted "rea"
    const marks = document.querySelectorAll('mark');
    expect(marks.length).toBeGreaterThanOrEqual(1);
  });

  it('auto-focuses when autoFocus is true', () => {
    renderInput({ autoFocus: true });
    const input = screen.getByPlaceholderText('搜索帖子...');
    expect(document.activeElement).toBe(input);
  });
});
