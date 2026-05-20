import 'bytemd/dist/index.css';
import 'github-markdown-css/github-markdown.css';
import { Editor } from '@bytemd/react';
import gfm from '@bytemd/plugin-gfm';
import highlight from '@bytemd/plugin-highlight';
import frontmatter from '@bytemd/plugin-frontmatter';
import zh_Hans from 'bytemd/locales/zh_Hans.json';
import type { BytemdLocale } from 'bytemd';
import { useMemo } from 'react';
import { uploadFile } from '../api/upload';

interface MarkdownSplitEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  mode?: 'split' | 'tab' | 'auto';
  locale?: Partial<BytemdLocale>;
  maxLength?: number;
  className?: string;
}

const plugins = [gfm(), highlight(), frontmatter()];

export default function MarkdownSplitEditor({
  value,
  onChange,
  placeholder = '请输入内容，支持 Markdown 语法',
  minHeight,
  mode = 'split',
  locale = zh_Hans,
  maxLength,
  className,
}: MarkdownSplitEditorProps) {
  const editorConfig = useMemo(
    () => ({
      ...(minHeight ? { minHeight: `${minHeight}px` } : {}),
    }),
    [minHeight],
  );

  return (
    <div
      className={`bytemd-container ${className || ''}`}
      style={minHeight ? { minHeight: `${minHeight}px` } : undefined}
    >
      <Editor
        value={value}
        plugins={plugins}
        onChange={onChange}
        placeholder={placeholder}
        mode={mode}
        locale={locale}
        maxLength={maxLength}
        editorConfig={editorConfig}
        uploadImages={async (files: File[]) => {
          const results = await Promise.all(
            files.map(async (file) => {
              const result = await uploadFile(file);
              return {
                url: result.url,
                title: result.filename,
                alt: result.filename,
              };
            }),
          );
          return results;
        }}
      />
    </div>
  );
}
