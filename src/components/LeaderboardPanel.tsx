import { useState, useEffect, useCallback } from 'react';
import * as pointsApi from '../api/points';
import type { LeaderboardEntry } from '../api/points';
import { useAuthStore } from '../store/authStore';
import { Avatar, AvatarFallback, AvatarImage } from './ui';
import { Skeleton } from './ui';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from './ui';
import { ErrorEmpty } from './shared';

type Period = 'week' | 'month' | 'all';

const TABS: { key: Period; label: string }[] = [
  { key: 'week', label: '周榜' },
  { key: 'month', label: '月榜' },
  { key: 'all', label: '总榜' },
];

const PAGE_SIZE = 20;

export default function LeaderboardPanel() {
  const currentUser = useAuthStore((s) => s.user);
  const [period, setPeriod] = useState<Period>('week');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentUserRank = currentUser
    ? entries.find((e) => e.userId === currentUser.id)
    : null;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await pointsApi.getLeaderboard(period, PAGE_SIZE);
      setEntries(data.entries);
    } catch {
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
  };

  return (
    <div className="bg-card rounded-lg shadow-card">
      {/* Tabs */}
      <div className="flex items-center border-b border-border px-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handlePeriodChange(tab.key)}
            className={`px-4 py-3 text-sm font-medium transition-colors duration-150 border-b-2 -mb-px ${
              period === tab.key
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Current User Rank */}
      {currentUserRank && currentUser && (
        <div className="mx-6 mt-4 px-4 py-3 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-primary-600">
              我的排名：第 {currentUserRank.rank} 名
            </span>
            <span className="text-sm text-muted-foreground">
              {currentUserRank.points} 积分
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <ErrorEmpty
            description="请检查网络连接后重试"
            onRetry={fetchData}
          />
        ) : entries.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>暂无排行数据</EmptyTitle>
              <EmptyDescription>快去参与互动获取积分吧</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <div className="flex flex-col">
              {entries.map((entry) => {
                const isMe = currentUser?.id === entry.userId;
                return (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-4 px-3 py-2.5 rounded-md transition-colors duration-150 ${
                      isMe ? 'bg-primary/10' : 'hover:bg-muted/50'
                    }`}
                  >
                    {/* Rank */}
                    <span
                      className={`w-8 text-center text-sm font-semibold ${
                        entry.rank <= 3
                          ? ['text-amber-500', 'text-muted-foreground', 'text-amber-700'][entry.rank - 1]
                          : 'text-muted-foreground'
                      }`}
                    >
                      {entry.rank <= 3 ? (
                        <span className="text-lg">
                          {['🥇', '🥈', '🥉'][entry.rank - 1]}
                        </span>
                      ) : (
                        entry.rank
                      )}
                    </span>

                    {/* Avatar */}
                    <Avatar
                      size="sm"
                    >
                      {entry.avatarUrl && <AvatarImage src={entry.avatarUrl} alt={entry.username} />}
                      <AvatarFallback>{entry.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                    </Avatar>

                    {/* Username */}
                    <span className={`flex-1 text-sm truncate ${isMe ? 'font-medium text-primary-600' : 'text-foreground'}`}>
                      {entry.username}
                      {isMe && <span className="text-xs text-primary-400 ml-1">(我)</span>}
                    </span>

                    {/* Points */}
                    <span className="text-sm font-medium text-foreground">
                      {entry.points} 积分
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
