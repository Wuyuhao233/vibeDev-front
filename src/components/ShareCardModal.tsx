import { useState, useEffect, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import Modal from './ui/Modal';
import { toast } from './ui/Toast';
import ShareCard, { type ShareCardData } from './ShareCard';

interface ShareCardModalProps {
  open: boolean;
  onClose: () => void;
  cardData: ShareCardData | null;
  postUrl: string;
}

type Stage = 'generating' | 'preview' | 'error';

export default function ShareCardModal({ open, onClose, cardData, postUrl }: ShareCardModalProps) {
  const [stage, setStage] = useState<Stage>('generating');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const generate = useCallback(async () => {
    if (!cardData) return;
    setStage('generating');
    setImageUrl(null);

    // Small delay to let the hidden DOM render
    await new Promise((r) => setTimeout(r, 100));

    try {
      if (!cardRef.current) throw new Error('no element');
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      });
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png'),
      );
      if (!blob) throw new Error('no blob');
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
      setStage('preview');
    } catch {
      setStage('error');
    }
  }, [cardData]);

  useEffect(() => {
    if (open) generate();
  }, [open, generate]);

  const handleDownload = useCallback(() => {
    if (!imageUrl || !cardData) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `vibeDev-${cardData.title.slice(0, 20)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('图片已下载');
  }, [imageUrl, cardData]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      toast.success('链接已复制');
    } catch {
      toast.error('复制失败');
    }
  }, [postUrl]);

  const handleClose = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl(null);
    }
    setStage('generating');
    onClose();
  };

  return (
    <>
      {/* Hidden share card for capture */}
      {open && cardData && (
        <div
          style={{
            position: 'fixed',
            left: -9999,
            top: 0,
            zIndex: -1,
          }}
          aria-hidden="true"
        >
          <ShareCard ref={cardRef} data={cardData} />
        </div>
      )}

      <Modal
        open={open}
        onClose={handleClose}
        title="分享卡片"
        size="lg"
        closeOnBackdrop={stage !== 'generating'}
      >
        <div className="flex flex-col items-center">
          {stage === 'generating' && (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin-slow" />
              <span className="text-sm text-gray-400">生成中...</span>
            </div>
          )}

          {stage === 'preview' && imageUrl && (
            <>
              <div className="w-full max-h-[400px] overflow-auto rounded-lg border border-gray-200">
                <img
                  src={imageUrl}
                  alt="分享卡片"
                  className="w-full"
                />
              </div>
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={handleDownload}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors duration-150"
                >
                  下载图片
                </button>
                <button
                  onClick={handleCopyLink}
                  className="px-5 py-2.5 text-sm font-medium text-gray-500 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-150"
                >
                  复制链接
                </button>
              </div>
            </>
          )}

          {stage === 'error' && (
            <div className="flex flex-col items-center gap-3 py-12">
              <p className="text-sm text-gray-500">生成失败</p>
              <button
                onClick={generate}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors duration-150"
              >
                重试
              </button>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
