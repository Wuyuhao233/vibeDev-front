import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { mockSubmitAppeal, mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockSubmitAppeal: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('../api/report', () => ({
  submitAppeal: mockSubmitAppeal,
  submitReport: vi.fn(),
}));

vi.mock('../components/ui/Toast', () => ({
  toast: { success: mockToastSuccess, error: mockToastError, info: vi.fn(), warning: vi.fn() },
  default: () => null,
}));

import AppealDialog from '../components/AppealDialog';

describe('AppealDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function props(overrides = {}) {
    return {
      open: true,
      postId: 1,
      initialStatus: null as 'PENDING' | 'APPROVED' | 'REJECTED' | null,
      onClose: vi.fn(),
      ...overrides,
    };
  }

  it('renders nothing when closed', () => {
    const { container } = render(<AppealDialog {...props()} open={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders appeal dialog when open', () => {
    render(<AppealDialog {...props()} />);
    expect(screen.getByText('申诉')).toBeInTheDocument();
  });

  it('shows required reason textarea', () => {
    render(<AppealDialog {...props()} />);
    expect(screen.getByPlaceholderText('请说明您认为审核结果有误的原因...')).toBeInTheDocument();
  });

  it('shows character counter', () => {
    render(<AppealDialog {...props()} />);
    fireEvent.change(screen.getByPlaceholderText('请说明您认为审核结果有误的原因...'), {
      target: { value: 'test reason' },
    });
    expect(screen.getByText('11/500')).toBeInTheDocument();
  });

  it('disables submit when reason is empty', () => {
    render(<AppealDialog {...props()} />);
    const submitBtn = screen.getByText('提交申诉').closest('button')!;
    expect(submitBtn).toBeDisabled();
  });

  it('enables submit when reason is provided', () => {
    render(<AppealDialog {...props()} />);
    fireEvent.change(screen.getByPlaceholderText('请说明您认为审核结果有误的原因...'), {
      target: { value: 'This is a valid reason for appeal.' },
    });
    const submitBtn = screen.getByText('提交申诉').closest('button')!;
    expect(submitBtn).not.toBeDisabled();
  });

  it('submits appeal and shows success toast', async () => {
    mockSubmitAppeal.mockResolvedValue({ success: true, status: 'PENDING' });
    render(<AppealDialog {...props()} />);

    fireEvent.change(screen.getByPlaceholderText('请说明您认为审核结果有误的原因...'), {
      target: { value: 'This is a valid appeal reason.' },
    });
    fireEvent.click(screen.getByText('提交申诉'));

    await waitFor(() => {
      expect(mockSubmitAppeal).toHaveBeenCalledWith(1, {
        reason: 'This is a valid appeal reason.',
      });
      expect(mockToastSuccess).toHaveBeenCalledWith('申诉已提交');
    });
  });

  it('shows error toast on submission failure', async () => {
    mockSubmitAppeal.mockRejectedValue(new Error('网络错误'));
    render(<AppealDialog {...props()} />);

    fireEvent.change(screen.getByPlaceholderText('请说明您认为审核结果有误的原因...'), {
      target: { value: 'Valid reason text.' },
    });
    fireEvent.click(screen.getByText('提交申诉'));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled();
    });
  });

  it('shows loading state on submit button', async () => {
    let resolvePromise: (v: unknown) => void = () => {};
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockSubmitAppeal.mockReturnValue(pendingPromise);

    render(<AppealDialog {...props()} />);

    fireEvent.change(screen.getByPlaceholderText('请说明您认为审核结果有误的原因...'), {
      target: { value: 'Valid reason.' },
    });

    const submitBtn = screen.getByText('提交申诉').closest('button')!;
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(submitBtn).toBeDisabled();
    });

    resolvePromise({ success: true, status: 'PENDING' });
  });

  it('closes dialog on cancel', () => {
    const onClose = vi.fn();
    render(<AppealDialog {...props({ onClose })} />);

    fireEvent.click(screen.getByText('取消'));
    expect(onClose).toHaveBeenCalled();
  });

  it('resets state on close', () => {
    const onClose = vi.fn();
    const { rerender } = render(<AppealDialog {...props({ onClose })} />);

    fireEvent.change(screen.getByPlaceholderText('请说明您认为审核结果有误的原因...'), {
      target: { value: 'test' },
    });

    fireEvent.click(screen.getByText('取消'));
    expect(onClose).toHaveBeenCalled();

    rerender(<AppealDialog {...props({ onClose })} open={true} />);
    expect(screen.getByPlaceholderText('请说明您认为审核结果有误的原因...')).toHaveValue('');
  });

  describe('status display', () => {
    it('shows pending status when initialStatus is PENDING', () => {
      render(<AppealDialog {...props({ initialStatus: 'PENDING' })} />);
      expect(screen.getByText('待复审')).toBeInTheDocument();
    });

    it('shows approved status when initialStatus is APPROVED', () => {
      render(<AppealDialog {...props({ initialStatus: 'APPROVED' })} />);
      expect(screen.getByText('申诉已通过')).toBeInTheDocument();
    });

    it('shows rejected status when initialStatus is REJECTED', () => {
      render(<AppealDialog {...props({ initialStatus: 'REJECTED' })} />);
      expect(screen.getByText('申诉已驳回')).toBeInTheDocument();
    });

    it('shows status after successful submission', async () => {
      mockSubmitAppeal.mockResolvedValue({ success: true, status: 'PENDING' });
      render(<AppealDialog {...props()} />);

      fireEvent.change(screen.getByPlaceholderText('请说明您认为审核结果有误的原因...'), {
        target: { value: 'Valid reason for appeal.' },
      });
      fireEvent.click(screen.getByText('提交申诉'));

      await waitFor(() => {
        expect(screen.getByText('待复审')).toBeInTheDocument();
      });
    });
  });
});
