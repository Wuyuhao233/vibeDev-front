import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MarkdownSplitEditor from '../components/MarkdownSplitEditor';

describe('MarkdownSplitEditor', () => {
  it('renders textarea and preview', () => {
    render(<MarkdownSplitEditor value="" onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('请输入内容，支持 Markdown 语法')).toBeInTheDocument();
    expect(screen.getByText('预览区域')).toBeInTheDocument();
  });

  it('displays the value in textarea', () => {
    render(<MarkdownSplitEditor value="Hello **world**" onChange={vi.fn()} />);
    const textarea = screen.getByPlaceholderText('请输入内容，支持 Markdown 语法');
    expect(textarea).toHaveValue('Hello **world**');
  });

  it('calls onChange on text input', () => {
    const onChange = vi.fn();
    render(<MarkdownSplitEditor value="" onChange={onChange} />);
    const textarea = screen.getByPlaceholderText('请输入内容，支持 Markdown 语法');
    fireEvent.change(textarea, { target: { value: 'New content' } });
    expect(onChange).toHaveBeenCalledWith('New content');
  });

  it('renders markdown toolbar buttons', () => {
    render(<MarkdownSplitEditor value="" onChange={vi.fn()} />);
    expect(screen.getByText('加粗')).toBeInTheDocument();
    expect(screen.getByText('斜体')).toBeInTheDocument();
    expect(screen.getByText('标题')).toBeInTheDocument();
    expect(screen.getByText('引用')).toBeInTheDocument();
    expect(screen.getByText('代码块')).toBeInTheDocument();
  });

  it('inserts bold syntax when toolbar button is clicked', () => {
    const onChange = vi.fn();
    render(<MarkdownSplitEditor value="hello" onChange={onChange} />);
    const textarea = screen.getByPlaceholderText('请输入内容，支持 Markdown 语法');
    // Select text
    fireEvent.select(textarea);
    // Click bold
    fireEvent.click(screen.getByText('加粗'));
    expect(onChange).toHaveBeenCalled();
  });

  it('renders markdown preview for non-empty content', () => {
    render(<MarkdownSplitEditor value="# Heading" onChange={vi.fn()} />);
    // Preview should show rendered markdown (the heading text)
    expect(screen.queryByText('预览区域')).not.toBeInTheDocument();
  });
});
