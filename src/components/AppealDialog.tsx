import { useState, useCallback } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { toast } from './ui/Toast';
import { submitAppeal, type AppealResult } from '../api/report';

interface AppealDialogProps {
  open: boolean;
  postId: number;
  initialStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  onClose: () => void;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PENDING: { label: '待复审', className: 'bg-amber-50 border-amber-200 text-amber-800' },
  APPROVED: { label: '申诉已通过', className: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
  REJECTED: { label: '申诉已驳回', className: 'bg-red-50 border-red-200 text-red-600' },
};

export default function AppealDialog({
  open,
  postId,
  initialStatus,
  onClose,
}: AppealDialogProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AppealResult | null>(null);

  const currentStatus = result?.status ?? initialStatus;

  const handleSubmit = useCallback(async () => {
    const trimmed = reason.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      const res = await submitAppeal(postId, { reason: trimmed });
      setResult(res);
      toast.success('申诉已提交');
    } catch (err: any) {
      toast.error(err?.message || '申诉提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  }, [postId, reason]);

  const handleClose = useCallback(() => {
    setReason('');
    setResult(null);
    setSubmitting(false);
    onClose();
  }, [onClose]);

  // Already appealed: show status
  if (currentStatus) {
    const info = STATUS_LABELS[currentStatus];
    return (
      <Modal open={open} onClose={handleClose} title="申诉状态" size="sm">
        <div className={`rounded-lg border px-4 py-3 text-sm ${info?.className}`}>
          {info?.label || currentStatus}
        </div>
      </Modal>
    );
  }

  const valid = reason.trim().length > 0;

  const footer = (
    <>
      <Button variant="secondary" onClick={handleClose}>
        取消
      </Button>
      <Button
        variant="primary"
        loading={submitting}
        disabled={!valid}
        onClick={handleSubmit}
      >
        提交申诉
      </Button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="申诉"
      size="sm"
      footer={footer}
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          申诉理由
          <span className="text-red-500 ml-0.5">*</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="请说明您认为审核结果有误的原因..."
          maxLength={500}
          rows={5}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none resize-none transition-colors duration-150 focus:border-primary-500 focus:ring-2 focus:ring-primary-50"
        />
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-400">请详细描述您的申诉理由</span>
          <span className={`text-xs ${reason.length > 500 ? 'text-red-500' : 'text-gray-400'}`}>
            {reason.length}/500
          </span>
        </div>
      </div>
    </Modal>
  );
}
