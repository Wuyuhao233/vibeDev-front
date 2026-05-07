import { useState, useRef, useEffect, useCallback } from 'react';

interface TagSelectorProps {
  tags: { id: number; name: string }[];
  selected: number[];
  onChange: (selected: number[]) => void;
  max?: number;
  min?: number;
  error?: string;
}

export default function TagSelector({
  tags,
  selected,
  onChange,
  max = 3,
  min = 1,
  error,
}: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredTags = tags.filter(
    (t) => !selected.includes(t.id) && t.name.toLowerCase().includes(search.toLowerCase()),
  );
  const selectedTags = tags.filter((t) => selected.includes(t.id));
  const atMax = selected.length >= max;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = useCallback(
    (id: number) => {
      if (atMax || selected.includes(id)) return;
      onChange([...selected, id]);
      setSearch('');
    },
    [selected, atMax, onChange],
  );

  const handleRemove = useCallback(
    (id: number) => {
      onChange(selected.filter((s) => s !== id));
    },
    [selected, onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && !search && selected.length > 0) {
        handleRemove(selected[selected.length - 1]);
      }
    },
    [search, selected, handleRemove],
  );

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex flex-wrap items-center gap-1.5 px-3 py-2 min-h-[40px] border rounded-md bg-white cursor-text transition-colors duration-150 ${
          error ? 'border-red-500' : open ? 'border-primary-500 ring-2 ring-primary-50' : 'border-gray-200'
        }`}
        onClick={() => setOpen(true)}
      >
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="tag-chip inline-flex items-center gap-1 rounded px-2 py-px text-xs text-gray-500 bg-gray-100"
          >
            {tag.name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(tag.id);
              }}
              className="text-gray-400 hover:text-gray-600 leading-none"
              aria-label={`移除标签 ${tag.name}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selected.length === 0 ? `选择标签（${min}-${max}个）` : selected.length < max ? '继续添加...' : `最多${max}个`}
          disabled={atMax}
          className="flex-1 min-w-[80px] border-none outline-none text-sm bg-transparent placeholder-gray-400"
        />
        {atMax && <span className="text-xs text-gray-400">最多{max}个</span>}
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-modal z-10 max-h-48 overflow-y-auto">
          {filteredTags.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">无匹配标签</div>
          ) : (
            filteredTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleSelect(tag.id)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors duration-150 ${
                  atMax ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={atMax}
              >
                {tag.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
