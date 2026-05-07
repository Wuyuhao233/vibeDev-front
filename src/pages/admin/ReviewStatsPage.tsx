import { useState, useEffect, useCallback } from 'react';
import { getReviewStats } from '../../api/admin';
import type { ReviewStatsResponse } from '../../types/admin';
import { Spinner, ErrorState } from '../../components/ui';

function formatPercent(v: number): string {
  return (v * 100).toFixed(1) + '%';
}

function DonutChart({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? value / total : 0;
  const offset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="6" />
        <circle
          cx="36" cy="36" r={radius} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 36 36)"
          className="transition-all duration-500"
        />
        <text x="36" y="36" textAnchor="middle" dominantBaseline="central" fill="#111827" fontSize="12" fontWeight="600">
          {formatPercent(pct)}
        </text>
      </svg>
      <span className="text-xs text-gray-500 mt-1">{label}</span>
    </div>
  );
}

function StatCard({ label, value, suffix = '', color = 'text-gray-900' }: { label: string; value: number | string; suffix?: string; color?: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}{suffix}</p>
    </div>
  );
}

export default function ReviewStatsPage() {
  const [data, setData] = useState<ReviewStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await getReviewStats();
      setData(stats);
    } catch (err: any) {
      setError(err?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
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

  if (!data) return null;

  const { queue, reports, quality, cost } = data;
  const totalProcessed = queue.todayApproved + queue.todayRejected;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">审核统计看板</h1>
      </div>

      {/* Queue stats */}
      <section className="mb-8">
        <h2 className="text-base font-semibold text-gray-700 mb-3">审核队列</h2>
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="待处理" value={queue.pendingCount} color="text-amber-500" />
          <StatCard label="申诉待处理" value={queue.appealCount} color="text-amber-500" />
          <StatCard label="今日放行" value={queue.todayApproved} color="text-emerald-500" />
          <StatCard label="今日驳回" value={queue.todayRejected} color="text-red-500" />
        </div>
      </section>

      {/* Quality stats */}
      <section className="mb-8">
        <h2 className="text-base font-semibold text-gray-700 mb-3">AI 准确率</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-8">
            <DonutChart label="通过率" value={totalProcessed} total={totalProcessed} color="#10b981" />
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>AI 通过率 (passThrough)</span>
                  <span className="font-medium text-gray-700">{formatPercent(quality.passRate)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${quality.passRate * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>AI 拦截率 (blockRate)</span>
                  <span className="font-medium text-gray-700">{formatPercent(quality.blockRate)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full transition-all" style={{ width: `${quality.blockRate * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>人工放行率</span>
                  <span className="font-medium text-gray-700">{formatPercent(quality.manualPassRate)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${quality.manualPassRate * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>误报率 (falsePositive)</span>
                  <span className={`font-medium ${quality.falsePositiveRate > 0.1 ? 'text-red-500' : 'text-gray-700'}`}>{formatPercent(quality.falsePositiveRate)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full transition-all" style={{ width: `${quality.falsePositiveRate * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>漏报率 (missRate)</span>
                  <span className={`font-medium ${quality.missRate > 0.1 ? 'text-red-500' : 'text-gray-700'}`}>{formatPercent(quality.missRate)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full transition-all" style={{ width: `${quality.missRate * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Report stats */}
      <section className="mb-8">
        <h2 className="text-base font-semibold text-gray-700 mb-3">举报处理</h2>
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="待处理举报" value={reports.pendingCount} color="text-amber-500" />
          <StatCard label="今日已处理" value={reports.todayResolved} color="text-emerald-500" />
        </div>
      </section>

      {/* Cost stats */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-3">AI 调用成本</h2>
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="月度预算" value={`¥${Number(cost.monthlyBudget).toFixed(0)}`} />
          <StatCard
            label="本月已花费"
            value={`¥${Number(cost.monthlyCost).toFixed(2)}`}
            color={cost.isBudgetExceeded ? 'text-red-500' : 'text-gray-900'}
          />
          <StatCard label="今日 API 调用" value={cost.dailyApiCalls} suffix=" 次" />
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">预算状态</p>
            <span className={`inline-block px-2 py-0.5 text-xs rounded ${
              cost.isBudgetExceeded
                ? 'bg-red-50 text-red-500'
                : 'bg-emerald-50 text-emerald-500'
            }`}>
              {cost.isBudgetExceeded ? '已超预算' : '正常'}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
