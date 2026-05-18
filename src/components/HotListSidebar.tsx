import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHomeFeed, type FeedItem } from '../api/feed';
import { Avatar, AvatarFallback, AvatarImage } from './ui';
import { formatCount } from '../utils/formatCount';
import { normalizeImageUrl } from '../utils/imageUrl';

export default function HotListSidebar() {
  const navigate = useNavigate();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHomeFeed({ tab: 'trending', page: 1, limit: 8 })
      .then((result) => setItems(result.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <aside className="w-[280px] flex-shrink-0 sticky top-[5rem] self-start max-h-[calc(100vh-5rem)] overflow-y-auto">
      <div className="bg-card rounded-lg shadow-card border border-border">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 px-4 py-3 border-b border-border">
          <svg className="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
          </svg>
          <h3 className="text-base font-semibold text-foreground">热榜</h3>
        </div>

        {/* Loading */}
        {loading && (
          <div className="px-4 py-3 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-shimmer rounded bg-muted" />
            ))}
          </div>
        )}

        {/* List */}
        {!loading && items.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">暂无热帖</div>
        )}

        {!loading && items.length > 0 && (
          <ul className="divide-y divide-border">
            {items.map((item, idx) => (
              <li
                key={item.id}
                className="hot-list__item flex items-start gap-2.5 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors duration-150"
                onClick={() => navigate(`/post/${item.id}`)}
              >
                {/* Rank */}
                <span
                  className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-xs font-bold mt-0.5 ${
                    idx === 0
                      ? 'bg-amber-500 text-white'
                      : idx === 1
                        ? 'bg-amber-400 text-white'
                        : idx === 2
                          ? 'bg-amber-300 text-white'
                          : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {idx + 1}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground font-medium line-clamp-2 leading-snug">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex items-center gap-1">
                      <Avatar size="sm">
                        {item.author.avatarUrl && <AvatarImage src={normalizeImageUrl(item.author.avatarUrl)} alt="" />}
                        <AvatarFallback className="text-[10px]">
                          {item.author.username?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground truncate max-w-[60px]">
                        {item.author.nickname || item.author.username}
                      </span>
                    </div>
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      {formatCount(item.likeCount + item.replyCount)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
