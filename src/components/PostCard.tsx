import { /*Link,*/ useNavigate } from 'react-router-dom';
import { Avatar } from './ui';
import LevelBadge from './ui/LevelBadge';
import RelativeTime from './ui/RelativeTime';
import { formatCount } from '../utils/formatCount';
import type { PostCardData } from '../types/board';

interface PostCardProps {
  post: PostCardData;
  showBoard?: boolean;
}

function stripMarkdown(md: string, maxLen = 200): string {
  let text = md
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/>\s/g, '')
    .replace(/[-*+]\s/g, '')
    .replace(/\n+/g, ' ')
    .trim();
  if (text.length > maxLen) text = text.slice(0, maxLen) + '...';
  return text || '';
}

export default function PostCard({ post, showBoard = false }: PostCardProps) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/post/${post.id}`);
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/u/${post.author.username}`);
  };

  const handleTagClick = (e: React.MouseEvent, tag: PostCardData['tags'][0]) => {
    e.stopPropagation();
    if (post.boardId) {
      navigate(`/board/${post.boardId}?tag=${tag.id}`);
    }
  };

  const visibleTags = post.tags.slice(0, 3);
  const overflowCount = post.tags.length - 3;

  return (
    <article
      className="post-card bg-white rounded-lg p-4 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') handleCardClick(); }}
    >
      <div className="post-card__main flex gap-4">
        <div className="flex-1 min-w-0">
          {/* Title + Badges */}
          <div className="post-card__title flex items-center gap-2 mb-1.5">
            {post.isPinned && (
              <span className="post-card__badge--pinned inline-flex items-center rounded-sm px-1.5 py-px text-[11px] font-medium text-blue-500 bg-blue-50 flex-shrink-0">
                置顶
              </span>
            )}
            {post.isEssence && (
              <span className="post-card__badge--essence inline-flex items-center rounded-sm px-1.5 py-px text-[11px] font-medium text-essence bg-amber-50 flex-shrink-0">
                精
              </span>
            )}
            <h3 className="post-card__title-text text-lg font-medium text-gray-900 truncate hover:text-primary-500 transition-colors duration-150">
              {post.title}
            </h3>
          </div>

          {/* Summary */}
          {post.contentSummary || post.content ? (
            <p className="post-card__summary text-sm text-gray-500 line-clamp-2 mb-2">
              {stripMarkdown(post.contentSummary || post.content)}
            </p>
          ) : null}

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="post-card__tags flex items-center gap-1.5 mb-2">
              {visibleTags.map((tag) => (
                <button
                  key={tag.id}
                  className="tag-chip inline-flex items-center rounded px-2 py-px text-xs text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors duration-150"
                  onClick={(e) => handleTagClick(e, tag)}
                >
                  {tag.name}
                </button>
              ))}
              {overflowCount > 0 && (
                <span className="text-xs text-gray-400">+{overflowCount}</span>
              )}
            </div>
          )}

          {/* Meta row */}
          <div className="post-card__meta flex items-center gap-3">
            <div
              className="post-card__author flex items-center gap-1.5 cursor-pointer"
              onClick={handleAuthorClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAuthorClick(e as any); }}
            >
              <Avatar
                src={post.author.avatarUrl || undefined}
                name={post.author.username}
                size={28}
                className="post-card__author-avatar"
              />
              <span className="post-card__author-name text-sm text-gray-500 max-w-[80px] truncate">
                {post.author.username}
              </span>
              <LevelBadge level={Math.min(Math.max(post.author.level, 1), 6) as 1 | 2 | 3 | 4 | 5 | 6} />
            </div>

            <RelativeTime date={post.createdAt} className="text-xs text-gray-400" />

            {showBoard && post.boardName && (
              <span className="post-card__board text-xs text-gray-400">
                {post.boardName}
              </span>
            )}

            <div className="post-card__stats flex items-center gap-3 ml-auto">
              <span className="post-card__stat--like inline-flex items-center gap-1 text-xs text-gray-400">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
                {formatCount(post.likeCount)}
              </span>
              <span className="post-card__stat--reply inline-flex items-center gap-1 text-xs text-gray-400">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
                {formatCount(post.replyCount)}
              </span>
              <span className="post-card__stat--collect inline-flex items-center gap-1 text-xs text-gray-400">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
                {formatCount(post.collectCount)}
              </span>
            </div>
          </div>
        </div>

        {/* Cover image */}
        {post.coverImageUrl && (
          <div className="post-card__cover flex-shrink-0">
            <img
              src={post.coverImageUrl}
              alt=""
              className="w-[120px] h-20 rounded object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        )}
      </div>
    </article>
  );
}

export { type PostCardProps };
