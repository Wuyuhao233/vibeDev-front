import { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownSplitEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

type ToolAction = {
  label: string;
  prefix: string;
  suffix: string;
  shortcut?: string;
  block?: boolean;
};

const tools: ToolAction[] = [
  { label: '加粗', prefix: '**', suffix: '**', shortcut: 'Ctrl+B' },
  { label: '斜体', prefix: '*', suffix: '*', shortcut: 'Ctrl+I' },
  { label: '标题', prefix: '### ', suffix: '', block: true },
  { label: '引用', prefix: '> ', suffix: '', block: true },
  { label: '无序列表', prefix: '- ', suffix: '', block: true },
  { label: '有序列表', prefix: '1. ', suffix: '', block: true },
  { label: '代码块', prefix: '```\n', suffix: '\n```', block: true },
  { label: '链接', prefix: '[', suffix: '](url)' },
  { label: '图片', prefix: '![alt](', suffix: ')' },
];

export default function MarkdownSplitEditor({
  value,
  onChange,
  placeholder = '请输入内容，支持 Markdown 语法',
  minHeight = 400,
}: MarkdownSplitEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const insertTool = useCallback(
    (tool: ToolAction) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.substring(start, end);
      const before = value.substring(0, start);
      const after = value.substring(end);

      let newValue: string;
      let newCursor: number;

      if (tool.block) {
        const lineStart = before.lastIndexOf('\n', start - 1) + 1;
        const linePrefix = before.substring(lineStart, start);
        newValue = before.substring(0, lineStart) + tool.prefix + linePrefix + selected + tool.suffix + after;
        newCursor = start + tool.prefix.length;
      } else if (selected) {
        newValue = before + tool.prefix + selected + tool.suffix + after;
        newCursor = start + tool.prefix.length + selected.length + tool.suffix.length;
      } else {
        newValue = before + tool.prefix + tool.suffix + after;
        newCursor = start + tool.prefix.length;
      }

      onChange(newValue);
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursor, newCursor);
      });
    },
    [value, onChange],
  );

  // Keyboard shortcut for Ctrl+Enter to indicate submit
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        insertTool({ label: '', prefix: '  ', suffix: '', block: true });
      }
    },
    [insertTool],
  );

  useEffect(() => {
    if (fullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [fullscreen]);

  const editor = (
    <div
      className={`flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white ${
        fullscreen ? 'fixed inset-0 z-40 m-0 rounded-none' : ''
      }`}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 bg-gray-50 flex-wrap">
        {tools.map((tool) => (
          <button
            key={tool.label}
            type="button"
            onClick={() => insertTool(tool)}
            title={tool.shortcut ? `${tool.label} (${tool.shortcut})` : tool.label}
            className="px-2 py-1 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors duration-150"
          >
            {tool.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setFullscreen(!fullscreen)}
          className="px-2 py-1 text-xs text-gray-400 hover:text-gray-600 rounded transition-colors duration-150"
          title={fullscreen ? '退出全屏' : '全屏'}
        >
          {fullscreen ? '退出全屏' : '全屏'}
        </button>
      </div>

      {/* Split pane */}
      <div className={`flex ${fullscreen ? 'flex-1' : ''}`} style={{ minHeight: fullscreen ? 0 : minHeight }}>
        {/* Editor */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 w-1/2 p-4 border-r border-gray-100 resize-none outline-none font-mono text-sm leading-relaxed text-gray-900 placeholder-gray-400"
          style={{ minHeight: fullscreen ? 0 : minHeight }}
        />
        {/* Preview */}
        <div
          className="flex-1 w-1/2 p-4 overflow-y-auto bg-white"
          style={{ minHeight: fullscreen ? 0 : minHeight }}
        >
          {value.trim() ? (
            <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-primary-500 prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-blockquote:border-l-primary-500 prose-blockquote:text-gray-500">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {value}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-gray-400">预览区域</p>
          )}
        </div>
      </div>
    </div>
  );

  return editor;
}
