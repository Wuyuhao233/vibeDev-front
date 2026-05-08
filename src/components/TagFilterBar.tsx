import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { toast } from '../components/ui';

interface Tag {
  id: string;
  name: string;
  sortOrder: number;
}

interface TagFilterBarProps {
  tags: Tag[];
  activeTagId: string | null;
  onSelect: (tagId: string | null) => void;
  followedTagIds?: Set<string>;
  onToggleFollow?: (tag: Tag) => void;
}

const MAX_VISIBLE = 8;

export default function TagFilterBar({ tags, activeTagId, onSelect, followedTagIds, onToggleFollow }: TagFilterBarProps) {
  const [expanded, setExpanded] = useState(false);
  const { isAuthenticated } = useAuthStore();

  const sorted = [{ id: '', name: '全部', sortOrder: -1 }, ...tags].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  const visible = expanded ? sorted : sorted.slice(0, MAX_VISIBLE);
  const hasMore = sorted.length > MAX_VISIBLE;

  const isFollowed = (tagId: string) => followedTagIds?.has(tagId) ?? false;

  const handleToggleFollow = (tag: Tag) => {
    if (!isAuthenticated) {
      toast.info('请先登录后关注标签');
      return;
    }
    onToggleFollow?.(tag);
  };

  return (
    <div className="tag-filter flex flex-wrap items-center gap-2 mb-4">
      {visible.map((tag) => {
        const isActive = tag.id === '' ? activeTagId === null : activeTagId === tag.id;
        const followed = tag.id !== '' && isFollowed(tag.id);
        return (
          <button
            key={tag.id}
            onClick={() => {
              if (tag.id === '') {
                onSelect(null);
              } else if (tag.id !== activeTagId) {
                onSelect(tag.id);
              }
            }}
            className={`tag-filter__item group inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full transition-colors duration-150 ${
              isActive
                ? 'tag-filter__item--active bg-primary-500 text-white'
                : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {tag.name}
            {tag.id !== '' && (
              <span
                className={`tag-filter__follow-toggle inline-flex items-center transition-opacity duration-150 ${
                  followed ? '' : 'opacity-0 group-hover:opacity-100'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleFollow(tag);
                }}
                title={followed ? '取消关注' : '关注'}
              >
                {followed ? (
                  <svg className="w-3.5 h-3.5 text-red-400 hover:text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 hover:text-primary-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                )}
              </span>
            )}
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
