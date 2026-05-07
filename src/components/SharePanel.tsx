import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from './ui';
import ShareCardModal from './ShareCardModal';
import type { ShareCardData } from './ShareCard';

interface SharePanelProps {
  url: string;
  title?: string;
  className?: string;
  cardData?: ShareCardData;
}

export default function SharePanel({ url, title: _title, className = '', cardData }: SharePanelProps) {
  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('链接已复制');
      setTimeout(() => setCopied(false), 2000);
      setDropdownOpen(false);
    } catch {
      toast.error('复制失败，请手动复制');
    }
  }, [url]);

  const handleGenerateCard = useCallback(() => {
    setDropdownOpen(false);
    setShowCardModal(true);
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  if (!cardData) {
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

  return (
    <div ref={dropdownRef} className="relative inline-flex">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className={`inline-flex items-center gap-1 text-sm text-gray-400 hover:text-primary-500 transition-colors duration-150 ${className}`}
        aria-label="分享"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
          <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>分享</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className={`transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}>
          <path d="M3 4.5l3 3 3-3" />
        </svg>
      </button>

      {dropdownOpen && (
        <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-lg shadow-modal border border-gray-200 z-10 py-1">
          <button
            onClick={handleCopy}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
          >
            复制链接
          </button>
          <button
            onClick={handleGenerateCard}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
          >
            生成分享卡片
          </button>
        </div>
      )}

      <ShareCardModal
        open={showCardModal}
        onClose={() => setShowCardModal(false)}
        cardData={cardData}
        postUrl={url}
      />
    </div>
  );
}
