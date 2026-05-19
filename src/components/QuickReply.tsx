import { useState, useCallback, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage, Button } from './ui';
import EmojiPicker from './EmojiPicker';
import { normalizeImageUrl } from '../utils/imageUrl';

interface QuickReplyProps {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  cooldownSeconds?: number;
  disabled?: boolean;
  /** Current user info for avatar display */
  currentUser?: {
    username: string;
    avatarUrl: string | null;
  } | null;
  /** Who the user is replying to — null means replying to the post itself */
  replyToUsername?: string | null;
  /** Callback to cancel replying to a specific user */
  onCancelReplyTo?: () => void;
  /** Whether to force top-level reply (ignore parentReplyId) */
  replyToPostOnly?: boolean;
  onReplyToPostOnlyChange?: (value: boolean) => void;
}

export default function QuickReply({
  onSubmit,
  placeholder = '写下你的回复…',
  cooldownSeconds = 10,
  disabled = false,
  currentUser,
  replyToUsername,
  onCancelReplyTo,
  replyToPostOnly = false,
  onReplyToPostOnlyChange,
}: QuickReplyProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showEmoji, setShowEmoji] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleSubmit = useCallback(async () => {
    if (!content.trim() || loading || cooldown > 0 || disabled) return;
    setLoading(true);
    try {
      await onSubmit(content);
      setContent('');
      setCooldown(cooldownSeconds);
    } catch {
      // error handling is done by parent
    } finally {
      setLoading(false);
    }
  }, [content, loading, cooldown, disabled, cooldownSeconds, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleEmojiSelect = useCallback((emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent((prev) => prev + emoji);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = content.substring(0, start);
    const after = content.substring(end);
    const newValue = before + emoji + after;
    setContent(newValue);
    const cursor = start + emoji.length;
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
    });
    setShowEmoji(false);
  }, [content]);

  // Auto-resize textarea
  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }, []);

  return (
    <div className="quick-reply">
      {/* Main input area: avatar + textarea */}
      <div className="flex gap-3">
        {/* Left avatar — static display only, no hover */}
        {currentUser && (
          <Avatar size="default" className="flex-shrink-0 mt-0.5">
            {currentUser.avatarUrl && (
              <AvatarImage src={normalizeImageUrl(currentUser.avatarUrl)} alt={currentUser.username} />
            )}
            <AvatarFallback>{currentUser.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
          </Avatar>
        )}

        {/* Right: reply hint + textarea */}
        <div className="flex-1 min-w-0">
          {/* Reply-to hint (gray, dismissible) */}
          {replyToUsername && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-xs text-muted-foreground">
                回复 <span className="font-medium">@{replyToUsername}</span>
              </span>
              {onCancelReplyTo && (
                <button
                  onClick={onCancelReplyTo}
                  className="text-muted-foreground/60 hover:text-foreground text-xs transition-colors duration-150"
                  aria-label="取消回复"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={3}
            disabled={disabled}
            className="w-full border border-border rounded-lg p-3 text-sm resize-none outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors duration-150 placeholder:text-muted-foreground min-h-[80px] bg-muted/30"
          />
        </div>
      </div>

      {/* Bottom toolbar */}
      <div className="flex items-center justify-between mt-2 pl-11">
        {/* Left: emoji + other tools */}
        <div className="flex items-center gap-1">
          {/* Emoji button */}
          <div className="relative">
            <button
              onClick={() => setShowEmoji(!showEmoji)}
              className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors duration-150 ${
                showEmoji
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              aria-label="表情"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2" />
                <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2" />
              </svg>
            </button>
            {showEmoji && (
              <EmojiPicker
                onSelect={handleEmojiSelect}
                onClose={() => setShowEmoji(false)}
              />
            )}
          </div>

          {/* Image upload placeholder */}
          <button
            className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-150"
            aria-label="图片"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>

          {/* Reply-to-post-only checkbox */}
          {onReplyToPostOnlyChange && (
            <label className="flex items-center gap-1.5 ml-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={replyToPostOnly}
                onChange={(e) => onReplyToPostOnlyChange(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary/20 accent-primary"
              />
              <span className="text-xs text-muted-foreground">仅在正文下讨论</span>
            </label>
          )}
        </div>

        {/* Right: submit button */}
        {cooldown > 0 ? (
          <span className="inline-flex items-center px-4 py-1.5 text-sm text-muted-foreground bg-muted/50 rounded-md">
            {cooldown}s
          </span>
        ) : (
          <Button
            variant="default"
            size="sm"
            disabled={loading || !content.trim() || disabled}
            onClick={handleSubmit}
            className="px-5"
          >
            {loading ? '发布中...' : '发布'}
          </Button>
        )}
      </div>
    </div>
  );
}
