import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RelativeTime from './ui/RelativeTime';
import AvatarHoverCard from './AvatarHoverCard';
import InlineReplies from './InlineReplies';
import { formatCount } from '../utils/formatCount';
import type { PostCardData } from '../types/board';

interface PostGridCardProps {
  post: PostCardData;
  showBoard?: boolean;
}

function stripMarkdown(md: string, maxLen = 80): string {
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

export default function PostGridCard({ post, showBoard = false }: PostGridCardProps) {
  const navigate = useNavigate();
  const [showReplies, setShowReplies] = useState(false);

  const handleClick = () => {
    if (!showReplies) {
      navigate(`/post/${post.id}`);
    }
  };
  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/u/${post.author.username}`);
  };
  const handleAvatarClick = () => {
    navigate(`/u/${post.author.username}`);
  };

  return (
    <article
      className="post-grid-card bg-card rounded-lg shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden border border-border"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') handleClick(); }}
    >
      {/* Cover image */}
      {post.coverImageUrl ? (
        <div className="post-grid-card__cover aspect-[16/9] overflow-hidden bg-muted">
          <img
            src={post.coverImageUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      ) : (
        <div className="post-grid-card__cover-placeholder aspect-[16/9] bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
          <svg className="w-8 h-8 text-primary/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z" />
            <path d="M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </div>
      )}

      {/* Content */}
      <div className="post-grid-card__body p-3.5">
        {/* Title + Badges */}
        <div className="flex items-center gap-1.5 mb-1.5">
          {post.isPinned && (
            <span className="inline-flex items-center rounded-sm px-1.5 py-px text-[11px] font-medium text-blue-500 bg-blue-50 flex-shrink-0">
              置顶
            </span>
          )}
          {post.isEssence && (
            <span className="inline-flex items-center rounded-sm px-1.5 py-px text-[11px] font-medium text-essence bg-amber-50 flex-shrink-0">
              精
            </span>
          )}
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
            {post.title}
          </h3>
        </div>

        {/* Summary */}
        {(post.contentSummary || post.content) && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
            {stripMarkdown(post.contentSummary || post.content)}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AvatarHoverCard
              username={post.author.username}
              avatarUrl={post.author.avatarUrl}
              nickname={post.author.nickname}
              level={post.author.level}
              size="sm"
              onClick={handleAvatarClick}
            />
            <span
              className="text-xs text-foreground font-semibold truncate max-w-[60px] hover:text-primary cursor-pointer transition-colors duration-150"
              onClick={handleAuthorClick}
            >
              {post.author.nickname || post.author.username}
            </span>
            <RelativeTime date={post.createdAt} className="text-xs text-muted-foreground" />
          </div>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {showBoard && post.boardName && (
              <span className="text-xs text-muted-foreground">{post.boardName}</span>
            )}
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-red-500 transition-colors duration-150">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
              {formatCount(post.likeCount)}
            </span>
            <button
              className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-blue-500 transition-colors duration-150"
              onClick={(e) => {
                e.stopPropagation();
                setShowReplies((prev) => !prev);
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={showReplies ? 'text-blue-500' : ''}>
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              {formatCount(post.replyCount)}
            </button>
          </div>
        </div>
      </div>

      {/* Inline replies panel */}
      {showReplies && (
        <div id={`post-${post.id}`} className="px-3.5 pb-3">
          <InlineReplies
            postId={post.id}
            postAuthorId={post.author?.id}
            onClose={() => setShowReplies(false)}
          />
        </div>
      )}
    </article>
  );
}
