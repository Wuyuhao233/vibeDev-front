import { useState, useCallback, useRef, useEffect } from 'react';
import Button from './ui/Button';

interface QuickReplyProps {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  cooldownSeconds?: number;
  disabled?: boolean;
}

const miniTools = [
  { label: 'B', prefix: '**', suffix: '**' },
  { label: 'I', prefix: '*', suffix: '*' },
  { label: '>', prefix: '> ', suffix: '', block: true },
  { label: '`', prefix: '`', suffix: '`' },
];

export default function QuickReply({
  onSubmit,
  placeholder = '写下你的回复，支持 Markdown 语法',
  cooldownSeconds = 10,
  disabled = false,
}: QuickReplyProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
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

  const insertTool = useCallback(
    (tool: typeof miniTools[0]) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = content.substring(start, end);
      const before = content.substring(0, start);
      const after = content.substring(end);
      let newValue: string;
      let cursor: number;

      if (tool.block) {
        const lineStart = before.lastIndexOf('\n', start - 1) + 1;
        newValue = before.substring(0, lineStart) + tool.prefix + before.substring(lineStart, start) + selected + after;
        cursor = start + tool.prefix.length;
      } else if (selected) {
        newValue = before + tool.prefix + selected + tool.suffix + after;
        cursor = start + tool.prefix.length + selected.length + tool.suffix.length;
      } else {
        newValue = before + tool.prefix + tool.suffix + after;
        cursor = start + tool.prefix.length;
      }

      setContent(newValue);
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(cursor, cursor);
      });
    },
    [content],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const charCount = content.length;

  return (
    <div className="quick-reply border-t border-gray-100 pt-4">
      <h4 className="text-base font-medium text-gray-900 mb-3">发表回复</h4>

      {/* Mini toolbar */}
      <div className="flex items-center gap-1 mb-2">
        {miniTools.map((tool) => (
          <button
            key={tool.label}
            type="button"
            onClick={() => insertTool(tool)}
            className="w-7 h-7 flex items-center justify-center text-xs font-mono text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors duration-150"
            title={tool.label}
          >
            {tool.label}
          </button>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={4}
        disabled={disabled}
        className="w-full border border-gray-200 rounded-md p-3 text-sm resize-y outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50 transition-colors duration-150 placeholder-gray-400 min-h-[100px]"
      />

      {/* Bottom bar */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-3">
          <span className={`text-xs ${charCount > 2000 ? 'text-red-500' : 'text-gray-400'}`}>
            {charCount}/2000
          </span>
          <span className="text-xs text-gray-400">Ctrl+Enter 发送</span>
        </div>

        {cooldown > 0 ? (
          <span className="inline-flex items-center px-4 py-2 text-sm text-gray-400 bg-gray-100 rounded-md">
            请等待 {cooldown} 秒后回复
          </span>
        ) : (
          <Button
            variant="primary"
            size="md"
            loading={loading}
            disabled={!content.trim() || disabled}
            onClick={handleSubmit}
          >
            {loading ? '提交中...' : '发布回复'}
          </Button>
        )}
      </div>
    </div>
  );
}
