import { useState, useCallback } from 'react';
import { toast } from './ui/Toast';

interface SharePanelProps {
  url: string;
  title?: string;
  className?: string;
}

export default function SharePanel({ url, title, className = '' }: SharePanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('链接已复制');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('复制失败，请手动复制');
    }
  }, [url]);

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 text-sm text-gray-400 hover:text-primary-500 transition-colors duration-150 ${className}`}
      aria-label={copied ? '已复制' : '分享'}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
        <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{copied ? '已复制' : '分享'}</span>
    </button>
  );
}
