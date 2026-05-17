import { useState, useEffect, useCallback, useRef } from 'react';
import { getDashboardStats } from '../../api/admin';
import type { DashboardStats, TrendItem } from '../../types/admin';
import { Spinner } from '../../components/ui';
import { ErrorEmpty } from '../../components/shared';

const DASHBOARD_REFRESH_INTERVAL = 60_000;

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const statsData = await getDashboardStats();
      setStats(statsData);
      setError(null);
    } catch (err: any) {
      setError(err?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

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
        <span className="ml-3 text-muted-foreground">加载中...</span>
      </div>
    );
  }

  if (error) {
    return <ErrorEmpty description={error} onRetry={fetchData} />;
  }

  const cards = stats
    ? [
        { label: '今日新增用户', value: stats.todayUsers, color: 'text-primary' },
        { label: '今日新增帖子', value: stats.todayPosts, color: 'text-emerald-500' },
        { label: '当前在线', value: stats.onlineUsers, color: 'text-amber-500' },
        { label: '用户总数', value: stats.totalUsers, color: 'text-foreground' },
        { label: '帖子总数', value: stats.totalPosts, color: 'text-foreground' },
        { label: '回复总数', value: stats.totalReplies, color: 'text-foreground' },
        { label: '待审核', value: stats.pendingAudits, color: 'text-orange-500' },
        { label: '待处理举报', value: stats.pendingReports, color: 'text-red-500' },
      ]
    : [];

  const trendData = stats?.postsTrend || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">仪表盘</h1>
        <span className="text-xs text-muted-foreground">每 60 秒自动刷新</span>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-card rounded-lg border border-border p-4 shadow-sm"
          >
            <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground mb-4">发帖趋势（近 7 天）</h2>
        {trendData.length > 0 ? (
          <TrendChart data={trendData} />
        ) : (
          <p className="text-center text-muted-foreground py-8 text-sm">暂无趋势数据</p>
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

  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const yScale = (v: number) => chartH - (v / maxVal) * chartH + padTop;

  const pts = data
    .map((d, i) => {
      const x = padLeft + (i / Math.max(data.length - 1, 1)) * chartW;
      const y = yScale(d.count);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
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
      <polyline points={pts} fill="none" stroke="#3b82f6" strokeWidth="2" />
      {data.map((d, i) => {
        const x = padLeft + (i / Math.max(data.length - 1, 1)) * chartW;
        const y = yScale(d.count);
        return <circle key={d.date} cx={x} cy={y} r="3" fill="#3b82f6" />;
      })}
      {data.map((d, i) => {
        const x = padLeft + (i / Math.max(data.length - 1, 1)) * chartW;
        return (
          <text key={d.date} x={x} y={H - 6} textAnchor="middle" fill="#9ca3af" fontSize="10">
            {d.date.slice(5)}
          </text>
        );
      })}
    </svg>
  );
}
