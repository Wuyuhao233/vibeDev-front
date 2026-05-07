import { useState } from 'react';

interface Tag {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
}

interface TagFilterBarProps {
  tags: Tag[];
  activeTagId: number | null;
  onSelect: (tagId: number | null) => void;
}

const MAX_VISIBLE = 8;

export default function TagFilterBar({ tags, activeTagId, onSelect }: TagFilterBarProps) {
  const [expanded, setExpanded] = useState(false);

  const sorted = [{ id: 0, name: '全部', slug: '', sortOrder: -1 }, ...tags].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  const visible = expanded ? sorted : sorted.slice(0, MAX_VISIBLE);
  const hasMore = sorted.length > MAX_VISIBLE;

  return (
    <div className="tag-filter flex flex-wrap items-center gap-2 mb-4">
      {visible.map((tag) => {
        const isActive = tag.id === 0 ? activeTagId === null : activeTagId === tag.id;
        return (
          <button
            key={tag.id}
            onClick={() => {
              if (tag.id === 0) {
                onSelect(null);
              } else if (tag.id !== activeTagId) {
                onSelect(tag.id);
              }
            }}
            className={`tag-filter__item inline-flex items-center px-3 py-1 text-sm rounded-full transition-colors duration-150 ${
              isActive
                ? 'tag-filter__item--active bg-primary-500 text-white'
                : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {tag.name}
          </button>
        );
      })}
      {hasMore && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="tag-filter__more-btn text-sm text-primary-500 hover:text-primary-600 transition-colors duration-150 px-2"
        >
          更多...
        </button>
      )}
      {expanded && hasMore && (
        <button
          onClick={() => setExpanded(false)}
          className="tag-filter__more-btn text-sm text-primary-500 hover:text-primary-600 transition-colors duration-150 px-2"
        >
          收起
        </button>
      )}
    </div>
  );
}
