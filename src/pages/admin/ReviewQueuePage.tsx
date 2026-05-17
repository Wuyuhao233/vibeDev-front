import { useState, useEffect, useCallback } from 'react';
import { getReviewQueue, approveReviewItem, rejectReviewItem } from '../../api/admin';
import type { ReviewQueueItem, ReviewQueueStats } from '../../types/admin';
import { Spinner, Badge, Button } from '../../components/ui';
import { ErrorEmpty, PaginationComponent } from '../../components/shared';
import { toast } from 'sonner';

export default function ReviewQueuePage() {
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [stats, setStats] = useState<ReviewQueueStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const pageSize = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReviewQueue({ status: statusFilter, page, pageSize });
      setItems(data.items);
      setStats(data.stats);
      setTotal(data.total);
    } catch (err: any) {
      setError(err?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await approveReviewItem(id);
      toast.success('已放行');
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      toast.error(err?.message || '操作失败');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) return;
    setActionLoading(rejectId);
    try {
      await rejectReviewItem(rejectId, rejectReason.trim());
      toast.success('已驳回');
      setItems((prev) => prev.filter((item) => item.id !== rejectId));
      setRejectId(null);
      setRejectReason('');
    } catch (err: any) {
      toast.error(err?.message || '操作失败');
    } finally {
      setActionLoading(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-emerald-500';
  };

  const getCategoryLabel = (cat: string) => {
    const map: Record<string, string> = {
      political: '涉政',
      spam: '垃圾广告',
      abuse: '辱骂',
      adult: '色情',
      normal: '正常',
    };
    return map[cat] || cat;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI 审核队列</h1>
        {stats && (
          <div className="flex gap-4 text-xs text-gray-500">
            <span>待处理: <strong className="text-amber-500">{stats.pendingCount}</strong></span>
            <span>今日放行: <strong className="text-emerald-500">{stats.todayApproved}</strong></span>
            <span>今日驳回: <strong className="text-red-500">{stats.todayRejected}</strong></span>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { value: 'pending', label: '待处理' },
          { value: 'approved', label: '已放行' },
          { value: 'rejected', label: '已驳回' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              statusFilter === tab.value
                ? 'bg-primary-50 text-primary-500 font-medium'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
          <span className="ml-3 text-gray-500">加载中...</span>
        </div>
      ) : error ? (
        <ErrorEmpty description={error} onRetry={fetchData} />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <p className="text-base font-medium text-gray-500">暂无审核内容</p>
          <p className="text-sm mt-1">当前没有需要人工复审的内容</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">内容</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-20">作者</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-20">AI 评分</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-20">类别</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-32">提交时间</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-40">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="text-gray-900 font-medium truncate max-w-xs">{item.targetTitle}</p>
                        <p className="text-gray-400 text-xs mt-0.5 truncate max-w-xs">{item.contentExcerpt}</p>
                        {item.boardName && (
                          <span className="inline-block mt-1 text-xs text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
                            {item.boardName}
                          </span>
                        )}
                        {item.aiDegraded && (
                          <Badge variant="outline" className="ml-1 text-xs bg-amber-50 text-amber-600 border-amber-200">
                            AI 降级
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{item.author.username}</td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${getScoreColor(item.aiScore)}`}>
                          {item.aiScore}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-600">{getCategoryLabel(item.aiCategory)}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {statusFilter === 'pending' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(item.id)}
                              disabled={actionLoading === item.id}
                              className="px-3 py-1 text-xs rounded bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                            >
                              {actionLoading === item.id ? '处理中...' : '放行'}
                            </button>
                            <button
                              onClick={() => setRejectId(item.id)}
                              disabled={actionLoading === item.id}
                              className="px-3 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                            >
                              驳回
                            </button>
                          </div>
                        ) : (
                          <Badge variant={statusFilter === 'approved' ? 'default' : 'destructive'}>
                            {statusFilter === 'approved' ? '已放行' : '已驳回'}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {total > pageSize && (
            <div className="mt-4">
              <PaginationComponent
                currentPage={page}
                total={total}
                pageSize={pageSize}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}

      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 z-30 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setRejectId(null)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 z-40">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">驳回审核</h2>
            <label className="block text-sm text-gray-600 mb-2">
              驳回原因 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              rows={3}
              placeholder="请输入驳回原因（至少 5 个字符）"
              maxLength={500}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{rejectReason.length}/500</p>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => { setRejectId(null); setRejectReason(''); }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                disabled={rejectReason.trim().length < 5 || actionLoading === rejectId}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {actionLoading === rejectId ? '处理中...' : '确认驳回'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
