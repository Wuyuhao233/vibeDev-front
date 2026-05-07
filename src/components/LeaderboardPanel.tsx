import { useState, useEffect, useCallback } from 'react';
import * as pointsApi from '../api/points';
import type { LeaderboardEntry } from '../api/points';
import { useAuthStore } from '../store/authStore';
import { Avatar } from './ui';
import { Skeleton } from './ui';
import { Empty } from './ui';
import { ErrorState } from './ui';
import { Pagination } from './ui';

type Period = 'weekly' | 'monthly' | 'all';

const TABS: { key: Period; label: string }[] = [
  { key: 'weekly', label: '周榜' },
  { key: 'monthly', label: '月榜' },
  { key: 'all', label: '总榜' },
];

const PAGE_SIZE = 20;

export default function LeaderboardPanel() {
  const currentUser = useAuthStore((s) => s.user);
  const [period, setPeriod] = useState<Period>('weekly');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserRank, setCurrentUserRank] = useState<{ rank: number; points: number } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await pointsApi.getLeaderboard(period, page, PAGE_SIZE);
      setEntries(data.items);
      setTotal(data.total);
      setCurrentUserRank(data.currentUser);
    } catch {
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  }, [period, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
    setPage(1);
  };

  return (
    <div className="bg-white rounded-lg shadow-card">
      {/* Tabs */}
      <div className="flex items-center border-b border-gray-200 px-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handlePeriodChange(tab.key)}
            className={`px-4 py-3 text-sm font-medium transition-colors duration-150 border-b-2 -mb-px ${
              period === tab.key
                ? 'text-primary-500 border-primary-500'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Current User Rank */}
      {currentUserRank && currentUser && (
        <div className="mx-6 mt-4 px-4 py-3 bg-primary-50 border border-primary-100 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-primary-600">
              我的排名：第 {currentUserRank.rank} 名
            </span>
            <span className="text-sm text-gray-500">
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
          <ErrorState
            title="排行榜加载失败"
            description="请检查网络连接后重试"
            onRetry={fetchData}
          />
        ) : entries.length === 0 ? (
          <Empty
            title="暂无排行数据"
            description="快去参与互动获取积分吧"
          />
        ) : (
          <>
            <div className="flex flex-col">
              {entries.map((entry) => {
                const isMe = currentUser?.id === entry.userId;
                return (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-4 px-3 py-2.5 rounded-md transition-colors duration-150 ${
                      isMe ? 'bg-primary-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Rank */}
                    <span
                      className={`w-8 text-center text-sm font-semibold ${
                        entry.rank <= 3
                          ? ['text-amber-500', 'text-gray-400', 'text-amber-700'][entry.rank - 1]
                          : 'text-gray-500'
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
                      src={entry.avatar || undefined}
                      name={entry.username}
                      size="sm"
                    />

                    {/* Username */}
                    <span className={`flex-1 text-sm truncate ${isMe ? 'font-medium text-primary-600' : 'text-gray-900'}`}>
                      {entry.username}
                      {isMe && <span className="text-xs text-primary-400 ml-1">(我)</span>}
                    </span>

                    {/* Points */}
                    <span className="text-sm font-medium text-gray-700">
                      {entry.points} 积分
                    </span>
                  </div>
                );
              })}
            </div>
            <Pagination
              current={page}
              total={total}
              pageSize={PAGE_SIZE}
              onChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
