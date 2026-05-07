import { useState, useCallback } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { toast } from './ui/Toast';
import { submitReport, type ReportData } from '../api/report';

const REPORT_TYPES: { value: ReportData['reason']; label: string; desc: string }[] = [
  { value: 'spam', label: '垃圾广告', desc: '商业广告、推广信息等' },
  { value: 'sexual', label: '色情低俗', desc: '色情、低俗、擦边内容' },
  { value: 'illegal', label: '违法违规', desc: '违反法律法规的内容' },
  { value: 'harassment', label: '人身攻击', desc: '辱骂、诽谤、隐私泄露' },
  { value: 'other', label: '其他', desc: '其他违规内容' },
];

interface ReportDialogProps {
  open: boolean;
  targetType: ReportData['targetType'];
  targetId: number;
  onClose: () => void;
}

let lastReportedTarget = '';
let lastReportedTime = 0;

export default function ReportDialog({
  open,
  targetType,
  targetId,
  onClose,
}: ReportDialogProps) {
  const [reason, setReason] = useState<ReportData['reason']>('spam');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const dupeKey = `${targetType}:${targetId}`;
  const alreadyReported = submitted || (
    dupeKey === lastReportedTarget && Date.now() - lastReportedTime < 10000
  );

  const handleSubmit = useCallback(async () => {
    if (alreadyReported) {
      toast.warning('该内容已举报，请勿重复提交');
      return;
    }

    setSubmitting(true);
    try {
      await submitReport({
        targetType,
        targetId,
        reason,
        description: description.trim() || undefined,
      });
      lastReportedTarget = dupeKey;
      lastReportedTime = Date.now();
      setSubmitted(true);
      toast.success('举报已提交，我们会尽快处理');
      onClose();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'DUPLICATE_SUBMIT (40002)') {
        toast.warning('请勿重复提交');
        setSubmitted(true);
        onClose();
      } else {
        toast.error(err?.message || '举报提交失败，请稍后重试');
      }
    } finally {
      setSubmitting(false);
    }
  }, [targetType, targetId, reason, description, onClose, alreadyReported, dupeKey]);

  const handleClose = useCallback(() => {
    setReason('spam');
    setDescription('');
    setSubmitting(false);
    setSubmitted(false);
    onClose();
  }, [onClose]);

  const footer = (
    <>
      <Button variant="secondary" onClick={handleClose}>
        取消
      </Button>
      <Button
        variant="primary"
        loading={submitting}
        disabled={alreadyReported}
        onClick={handleSubmit}
      >
        {alreadyReported ? '已举报' : '提交举报'}
      </Button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="举报"
      size="sm"
      footer={footer}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">举报类型</label>
          <div className="space-y-1.5">
            {REPORT_TYPES.map((type) => (
              <label
                key={type.value}
                className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors duration-150 ${
                  reason === type.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="reportReason"
                  value={type.value}
                  checked={reason === type.value}
                  onChange={() => setReason(type.value)}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">{type.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{type.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            详细描述
            <span className="text-gray-400 font-normal ml-1">（可选）</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请提供更多信息..."
            maxLength={500}
            rows={4}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none resize-none transition-colors duration-150 focus:border-primary-500 focus:ring-2 focus:ring-primary-50"
          />
          <div className="text-right text-xs text-gray-400 mt-1">
            {description.length}/500
          </div>
        </div>
      </div>
    </Modal>
  );
}
