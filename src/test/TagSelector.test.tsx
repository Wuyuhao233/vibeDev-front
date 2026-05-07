import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TagSelector from '../components/TagSelector';

const sampleTags = [
  { id: 1, name: 'React' },
  { id: 2, name: 'TypeScript' },
  { id: 3, name: 'TailwindCSS' },
  { id: 4, name: 'Vite' },
];

describe('TagSelector', () => {
  it('renders placeholder when no tags selected', () => {
    render(
      <TagSelector tags={sampleTags} selected={[]} onChange={vi.fn()} />,
    );
    expect(screen.getByPlaceholderText('选择标签（1-3个）')).toBeInTheDocument();
  });

  it('displays selected tags as chips', () => {
    render(
      <TagSelector tags={sampleTags} selected={[1, 2]} onChange={vi.fn()} />,
    );
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('shows dropdown on click', () => {
    render(
      <TagSelector tags={sampleTags} selected={[]} onChange={vi.fn()} />,
    );
    const input = screen.getByPlaceholderText('选择标签（1-3个）');
    fireEvent.focus(input);
    expect(screen.getByText('TailwindCSS')).toBeInTheDocument();
    expect(screen.getByText('Vite')).toBeInTheDocument();
  });

  it('filters out already selected tags from dropdown', () => {
    render(
      <TagSelector tags={sampleTags} selected={[1]} onChange={vi.fn()} />,
    );
    const input = screen.getByDisplayValue('');
    fireEvent.focus(input);
    // React should not be in dropdown since it's already selected
    expect(screen.queryByRole('button', { name: 'React' })).not.toBeInTheDocument();
  });

  it('calls onChange when a tag is selected', () => {
    const onChange = vi.fn();
    render(
      <TagSelector tags={sampleTags} selected={[1]} onChange={onChange} />,
    );
    const input = screen.getByDisplayValue('');
    fireEvent.focus(input);
    fireEvent.click(screen.getByText('TypeScript'));
    expect(onChange).toHaveBeenCalledWith([1, 2]);
  });

  it('shows error message when error prop is provided', () => {
    render(
      <TagSelector
        tags={sampleTags}
        selected={[]}
        onChange={vi.fn()}
        error="请至少选择一个标签"
      />,
    );
    expect(screen.getByText('请至少选择一个标签')).toBeInTheDocument();
  });

  it('removes tag when X button is clicked', () => {
    const onChange = vi.fn();
    render(
      <TagSelector tags={sampleTags} selected={[1, 2]} onChange={onChange} />,
    );
    fireEvent.click(screen.getByLabelText('移除标签 React'));
    expect(onChange).toHaveBeenCalledWith([2]);
  });

  it('disables selection when max is reached', () => {
    render(
      <TagSelector tags={sampleTags} selected={[1, 2, 3]} onChange={vi.fn()} max={3} />,
    );
    expect(screen.getByText('最多3个')).toBeInTheDocument();
  });
});
