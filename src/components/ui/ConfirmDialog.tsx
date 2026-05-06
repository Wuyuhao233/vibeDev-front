import { type ReactNode } from 'react';
import Modal from './Modal';
import Button from './Button';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: ReactNode;
  affectedItems?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  affectedItems,
  confirmLabel = '确认',
  cancelLabel = '取消',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      closeOnBackdrop={false}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
          <span className="text-red-500 text-lg">!</span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="mt-2 text-sm text-gray-500">{description}</div>
          {affectedItems && affectedItems.length > 0 && (
            <div className="mt-3 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
              {affectedItems.map((item, i) => (
                <div key={i} className="text-sm text-gray-700 py-0.5">
                  {item}
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-gray-400">此操作不可撤销。</p>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          loading={loading}
          autoFocus
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
