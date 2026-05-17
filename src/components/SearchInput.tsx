import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';

const SEARCH_HISTORY_KEY = 'search_history';
const MAX_HISTORY = 10;

function getHistory(): string[] {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(query: string) {
  const history = getHistory().filter((h) => h !== query);
  history.unshift(query);
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

function clearHistory() {
  localStorage.removeItem(SEARCH_HISTORY_KEY);
}

function removeHistoryItem(query: string) {
  localStorage.setItem(
    SEARCH_HISTORY_KEY,
    JSON.stringify(getHistory().filter((h) => h !== query)),
  );
}

// Highlight matching text in history items
function highlightMatch(text: string, keyword: string) {
  if (!keyword) return text;
  const idx = text.toLowerCase().indexOf(keyword.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/10 text-foreground rounded-sm">{text.slice(idx, idx + keyword.length)}</mark>
      {text.slice(idx + keyword.length)}
    </>
  );
}

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (query: string) => void;
  suggestions?: string[];
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export default function SearchInput({
  value,
  onChange,
  onSubmit,
  suggestions,
  placeholder = '搜索帖子...',
  className = '',
  autoFocus = false,
}: SearchInputProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [history, setHistory] = useState<string[]>(getHistory);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const items = getDropdownItems();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < items.length) {
        const selected = items[activeIndex];
        if (typeof selected === 'string') {
          submitQuery(selected);
        }
      } else if (value.trim()) {
        submitQuery(value.trim());
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      setActiveIndex(-1);
    }
  };

  function getDropdownItems(): string[] {
    if (suggestions && suggestions.length > 0 && value.trim()) {
      return suggestions;
    }
    if (value.trim()) {
      return history.filter((h) => h.toLowerCase().includes(value.trim().toLowerCase()));
    }
    return history;
  }

  function submitQuery(query: string) {
    saveHistory(query);
    setHistory(getHistory());
    setIsFocused(false);
    setActiveIndex(-1);
    onSubmit(query);
  }

  function handleClearHistory(e: React.MouseEvent) {
    e.stopPropagation();
    clearHistory();
    setHistory([]);
  }

  function handleRemoveItem(e: React.MouseEvent, query: string) {
    e.stopPropagation();
    removeHistoryItem(query);
    setHistory(getHistory());
  }

  function handleFocus() {
    setHistory(getHistory());
    setIsFocused(true);
    setActiveIndex(-1);
  }

  const items = getDropdownItems();
  const showDropdown = isFocused && items.length > 0;

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          autoFocus={autoFocus}
          className="w-full h-9 pl-9 pr-3 text-sm bg-muted/50 border border-border rounded-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-150 placeholder:text-muted-foreground"
        />
      </div>

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 top-full mt-1 bg-popover rounded-lg shadow-modal border border-border py-1 z-dropdown animate-fade-in"
        >
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-xs text-muted-foreground">
              {suggestions && suggestions.length > 0 && value.trim() ? '搜索建议' : '搜索历史'}
            </span>
            {!suggestions && history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
              >
                清除全部
              </button>
            )}
          </div>
          {items.map((item, i) => (
            <button
              key={item}
              onClick={() => submitQuery(item)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors duration-150 flex items-center justify-between ${
                i === activeIndex ? 'bg-muted' : ''`
              }`}
            >
              <span className="truncate">
                {suggestions && suggestions.length > 0 && value.trim()
                  ? item
                  : highlightMatch(item, value.trim())}
              </span>
              {!suggestions && (
                <button
                  onClick={(e) => handleRemoveItem(e, item)}
                  className="flex-shrink-0 ml-2 text-muted-foreground hover:text-foreground transition-colors duration-150"
                  aria-label={`清除 "${item}"`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { getHistory, saveHistory, clearHistory, removeHistoryItem, SEARCH_HISTORY_KEY, MAX_HISTORY };
