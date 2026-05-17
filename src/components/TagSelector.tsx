import { useState, useRef, useEffect, useCallback } from 'react';

interface TagSelectorProps {
  tags: { id: string; name: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  max?: number;
  min?: number;
  error?: string;
}

export default function TagSelector({
  tags,
  selected,
  onChange,
  max = 3,
  min = 0,
  error,
}: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // selected stores tag names (strings)
  const selectedSet = new Set(selected);

  // Existing tags that match search and are not already selected
  const filteredTags = tags.filter(
    (t) => !selectedSet.has(t.name) && t.name.toLowerCase().includes(search.toLowerCase()),
  );

  // Whether the current search text can be added as a custom tag
  const trimmedSearch = search.trim();
  const canAddCustom =
    trimmedSearch.length > 0 &&
    trimmedSearch.length <= 20 &&
    !selectedSet.has(trimmedSearch) &&
    selected.length < max &&
    !tags.some((t) => t.name.toLowerCase() === trimmedSearch.toLowerCase());

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
    (name: string) => {
      if (atMax || selectedSet.has(name)) return;
      onChange([...selected, name]);
      setSearch('');
    },
    [selected, atMax, onChange],
  );

  const handleRemove = useCallback(
    (name: string) => {
      onChange(selected.filter((s) => s !== name));
    },
    [selected, onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && !search && selected.length > 0) {
        handleRemove(selected[selected.length - 1]);
      }
      if (e.key === 'Enter' && canAddCustom) {
        e.preventDefault();
        handleSelect(trimmedSearch);
      }
    },
    [search, selected, handleRemove, canAddCustom, trimmedSearch, handleSelect],
  );

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex flex-wrap items-center gap-1.5 px-3 py-2 min-h-[40px] border rounded-md bg-card cursor-text transition-colors duration-150 ${
          error ? 'border-red-500' : open ? 'border-primary ring-2 ring-primary-50' : 'border-border'
        }`}
        onClick={() => setOpen(true)}
      >
        {selected.map((name) => (
          <span
            key={name}
            className="tag-chip inline-flex items-center gap-1 rounded px-2 py-px text-xs text-muted-foreground bg-muted/50"
          >
            {name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(name);
              }}
              className="text-muted-foreground hover:text-foreground/80 leading-none"
              aria-label={`移除标签 ${name}`}
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
          placeholder={selected.length === 0 ? `输入或选择标签（最多${max}个）` : selected.length < max ? '继续添加...' : `最多${max}个`}
          disabled={atMax}
          className="flex-1 min-w-[80px] border-none outline-none text-sm bg-transparent placeholder:text-muted-foreground"
        />
        {atMax && <span className="text-xs text-muted-foreground">最多{max}个</span>}
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-modal z-10 max-h-48 overflow-y-auto">
          {filteredTags.length === 0 && !canAddCustom && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {trimmedSearch ? '按 Enter 添加自定义标签' : '输入标签名添加自定义标签'}
            </div>
          )}
          {filteredTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleSelect(tag.name)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/30 transition-colors duration-150 ${
                atMax ? 'opacity-50 cursor-not-allowed' : ''
              }`
              }
              disabled={atMax}
            >
              {tag.name}
            </button>
          ))}
          {canAddCustom && (
            <button
              type="button"
              onClick={() => handleSelect(trimmedSearch)}
              className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-muted/30 transition-colors duration-150"
            >
              + 添加「{trimmedSearch}」
            </button>
          )}
        </div>
      )}
    </div>
  );
}
