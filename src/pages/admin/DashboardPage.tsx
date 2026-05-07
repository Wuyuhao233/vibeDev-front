import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { getDashboardStats, getTrendData } from '../../api/admin';
import type { DashboardStats, TrendItem } from '../../types/admin';
import { Spinner, ErrorState } from '../../components/ui';

const DASHBOARD_REFRESH_INTERVAL = 60_000;

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trendData, setTrendData] = useState<TrendItem[]>([]);
  const [trendDays, setTrendDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [statsData, trend] = await Promise.all([
        getDashboardStats(),
        getTrendData({ days: trendDays }),
      ]);
      setStats(statsData);
      setTrendData(trend || []);
      setError(null);
    } catch (err: any) {
      setError(err?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [trendDays]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    intervalRef.current = setInterval(fetchData, DASHBOARD_REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-500">加载中...</span>
      </div>
    );
  }

  if (error) {
    return <ErrorState title="加载失败" description={error} onRetry={fetchData} />;
  }

  const cards = stats
    ? [
        { label: '今日新增用户', value: stats.todayNewUsers, color: 'text-primary-500' },
        { label: '今日新增帖子', value: stats.todayNewPosts, color: 'text-emerald-500' },
        { label: '今日新增回复', value: stats.todayNewReplies, color: 'text-amber-500' },
        { label: '用户总数', value: stats.totalUsers, color: 'text-gray-700' },
        { label: '帖子总数', value: stats.totalPosts, color: 'text-gray-700' },
        { label: '回复总数', value: stats.totalReplies, color: 'text-gray-700' },
        { label: '待处理举报', value: stats.pendingReports, color: 'text-red-500' },
      ]
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
        <span className="text-xs text-gray-400">每 60 秒自动刷新</span>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
          >
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">趋势图</h2>
          <div className="flex gap-1">
            {[7, 30].map((d) => (
              <button
                key={d}
                onClick={() => setTrendDays(d)}
                className={`px-3 py-1 text-xs rounded ${
                  trendDays === d
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                近 {d} 天
              </button>
            ))}
          </div>
        </div>
        {trendData.length > 0 ? (
          <TrendChart data={trendData} />
        ) : (
          <p className="text-center text-gray-400 py-8 text-sm">暂无趋势数据</p>
        )}
      </div>
    </div>
  );
}

function TrendChart({ data }: { data: TrendItem[] }) {
  const W = 800;
  const H = 220;
  const padLeft = 40;
  const padRight = 20;
  const padTop = 10;
  const padBottom = 30;
  const chartW = W - padLeft - padRight;
  const chartH = H - padTop - padBottom;

  const allVals = data.flatMap((d) => [d.users, d.posts, d.replies]);
  const maxVal = Math.max(...allVals, 1);
  const yScale = (v: number) => chartH - (v / maxVal) * chartH + padTop;

  const lines = [
    { key: 'users' as const, color: '#3b82f6', label: '用户' },
    { key: 'posts' as const, color: '#10b981', label: '帖子' },
    { key: 'replies' as const, color: '#f59e0b', label: '回复' },
  ];

  const points = lines.map((line) => {
    const pts = data.map((d, i) => {
      const x = padLeft + (i / Math.max(data.length - 1, 1)) * chartW;
      const y = yScale(d[line.key]);
      return `${x},${y}`;
    });
    return { ...line, pts };
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {/* Y axis grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
        const y = yScale(maxVal * frac);
        return (
          <g key={frac}>
            <line x1={padLeft} y1={y} x2={W - padRight} y2={y} stroke="#e5e7eb" strokeWidth="1" />
            <text x={padLeft - 6} y={y + 4} textAnchor="end" fill="#9ca3af" fontSize="10">
              {Math.round(maxVal * frac)}
            </text>
          </g>
        );
      })}
      {/* Data lines */}
      {points.map((line) => (
        <polyline
          key={line.key}
          points={line.pts.join(' ')}
          fill="none"
          stroke={line.color}
          strokeWidth="2"
        />
      ))}
      {/* X axis labels */}
      {data.map((d, i) => {
        const x = padLeft + (i / Math.max(data.length - 1, 1)) * chartW;
        const label = d.date.slice(5);
        return (
          <text key={d.date} x={x} y={H - 6} textAnchor="middle" fill="#9ca3af" fontSize="10">
            {label}
          </text>
        );
      })}
      {/* Legend */}
      {points.map((line, idx) => (
        <g key={line.key} transform={`translate(${W - padRight - 160 + idx * 55}, 4)`}>
          <rect width="10" height="10" fill={line.color} rx="2" />
          <text x="14" y="9" fill="#6b7280" fontSize="11">
            {line.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
