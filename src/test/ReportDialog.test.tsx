import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { mockSubmitReport, mockToastSuccess, mockToastError, mockToastWarning } = vi.hoisted(() => ({
  mockSubmitReport: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
  mockToastWarning: vi.fn(),
}));

vi.mock('../api/report', () => ({
  submitReport: mockSubmitReport,
}));

vi.mock('../components/ui/Toast', () => ({
  toast: { success: mockToastSuccess, error: mockToastError, info: vi.fn(), warning: mockToastWarning },
  default: () => null,
}));

import ReportDialog from '../components/ReportDialog';

function getRadioByValue(value: string): HTMLInputElement {
  return screen.getByDisplayValue(value) as HTMLInputElement;
}

describe('ReportDialog', () => {
  let targetIdCounter = 0;

  beforeEach(() => {
    vi.clearAllMocks();
    targetIdCounter++;
  });

  function props(overrides = {}) {
    return {
      open: true,
      targetType: 'post' as const,
      targetId: targetIdCounter,
      onClose: vi.fn(),
      ...overrides,
    };
  }

  it('renders nothing when closed', () => {
    const { container } = render(<ReportDialog {...props()} open={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders report dialog when open', () => {
    render(<ReportDialog {...props()} />);
    expect(screen.getByText('举报')).toBeInTheDocument();
  });

  it('shows all report type options', () => {
    render(<ReportDialog {...props()} />);
    expect(screen.getByText('垃圾广告')).toBeInTheDocument();
    expect(screen.getByText('色情低俗')).toBeInTheDocument();
    expect(screen.getByText('违法违规')).toBeInTheDocument();
    expect(screen.getByText('人身攻击')).toBeInTheDocument();
    expect(screen.getByText('其他')).toBeInTheDocument();
  });

  it('selects "spam" by default', () => {
    render(<ReportDialog {...props()} />);
    expect(getRadioByValue('spam').checked).toBe(true);
  });

  it('allows selecting a different report type', () => {
    render(<ReportDialog {...props()} />);
    const sexualRadio = getRadioByValue('sexual');
    fireEvent.click(sexualRadio);
    expect(sexualRadio.checked).toBe(true);
  });

  it('has an optional description textarea', () => {
    render(<ReportDialog {...props()} />);
    const textarea = screen.getByPlaceholderText('请提供更多信息...');
    expect(textarea).toBeInTheDocument();
    fireEvent.change(textarea, { target: { value: 'test description' } });
    expect(textarea).toHaveValue('test description');
  });

  it('displays character counter for description', () => {
    render(<ReportDialog {...props()} />);
    fireEvent.change(screen.getByPlaceholderText('请提供更多信息...'), {
      target: { value: 'test' },
    });
    expect(screen.getByText('4/500')).toBeInTheDocument();
  });

  it('submits report and shows success toast', async () => {
    mockSubmitReport.mockResolvedValue({ success: true });
    const p = props();
    render(<ReportDialog {...p} />);

    fireEvent.click(screen.getByText('提交举报'));

    await waitFor(() => {
      expect(mockSubmitReport).toHaveBeenCalledWith({
        targetType: 'post',
        targetId: p.targetId,
        reason: 'spam',
        description: undefined,
      });
      expect(mockToastSuccess).toHaveBeenCalledWith('举报已提交，我们会尽快处理');
    });
  });

  it('includes description in submission when provided', async () => {
    mockSubmitReport.mockResolvedValue({ success: true });
    render(<ReportDialog {...props()} />);

    fireEvent.change(screen.getByPlaceholderText('请提供更多信息...'), {
      target: { value: 'test description' },
    });
    fireEvent.click(screen.getByText('提交举报'));

    await waitFor(() => {
      expect(mockSubmitReport).toHaveBeenCalledWith(
        expect.objectContaining({
          targetType: 'post',
          reason: 'spam',
          description: 'test description',
        }),
      );
    });
  });

  it('shows error toast on submission failure', async () => {
    mockSubmitReport.mockRejectedValue(new Error('网络错误'));
    render(<ReportDialog {...props()} />);

    fireEvent.click(screen.getByText('提交举报'));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled();
    });
  });

  it('handles DUPLICATE_SUBMIT error code', async () => {
    const err = new Error('请勿重复提交') as any;
    err.code = 'DUPLICATE_SUBMIT (40002)';
    mockSubmitReport.mockRejectedValue(err);
    render(<ReportDialog {...props()} />);

    fireEvent.click(screen.getByText('提交举报'));

    await waitFor(() => {
      expect(mockToastWarning).toHaveBeenCalledWith('请勿重复提交');
    });
  });

  it('shows loading state on submit button', async () => {
    let resolvePromise: (v: unknown) => void = () => {};
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockSubmitReport.mockReturnValue(pendingPromise);

    render(<ReportDialog {...props()} />);

    const submitBtn = screen.getByText('提交举报').closest('button')!;
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(submitBtn).toBeDisabled();
    });

    resolvePromise({ success: true });
  });

  it('closes dialog on cancel', () => {
    const onClose = vi.fn();
    render(<ReportDialog {...props({ onClose })} />);

    fireEvent.click(screen.getByText('取消'));
    expect(onClose).toHaveBeenCalled();
  });

  it('closes dialog after successful submit', async () => {
    const onClose = vi.fn();
    mockSubmitReport.mockResolvedValue({ success: true });
    render(<ReportDialog {...props({ onClose })} />);

    fireEvent.click(screen.getByText('提交举报'));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('resets state on close', () => {
    const onClose = vi.fn();
    render(<ReportDialog {...props({ onClose })} />);

    fireEvent.click(getRadioByValue('sexual'));
    fireEvent.change(screen.getByPlaceholderText('请提供更多信息...'), {
      target: { value: 'test' },
    });

    fireEvent.click(screen.getByText('取消'));
    expect(onClose).toHaveBeenCalled();
  });

  it('prevents duplicate report submission via module-level tracking', async () => {
    mockSubmitReport.mockResolvedValue({ success: true });
    const p = props();

    // First submit
    const { unmount } = render(<ReportDialog {...p} />);
    fireEvent.click(screen.getByText('提交举报'));

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalled();
    });

    // Re-render with same target (simulating reopening)
    unmount();
    render(<ReportDialog {...p} />);

    // Should show "已举报" and be disabled
    expect(screen.getByText('已举报')).toBeInTheDocument();
    expect(screen.getByText('已举报').closest('button')).toBeDisabled();
  });
});
