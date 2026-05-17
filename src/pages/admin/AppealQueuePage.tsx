import { useState, useEffect, useCallback } from 'react';
import { getAppeals, approveAppeal, rejectAppeal } from '../../api/admin';
import type { AppealItem } from '../../types/admin';
import { Spinner, Badge } from '../../components/ui';
import { ErrorEmpty, PaginationComponent } from '../../components/shared';
import { toast } from 'sonner';

export default function AppealQueuePage() {
  const [items, setItems] = useState<AppealItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const pageSize = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAppeals({ status: statusFilter, page, pageSize });
      setItems(data.items);
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
      await approveAppeal(id);
      toast.success('申诉已通过，内容已恢复');
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      toast.error(err?.message || '操作失败');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectId || !rejectNote.trim()) return;
    setActionLoading(rejectId);
    try {
      await rejectAppeal(rejectId, { result: 'rejected', note: rejectNote.trim() });
      toast.success('申诉已驳回');
      setItems((prev) => prev.filter((item) => item.id !== rejectId));
      setRejectId(null);
      setRejectNote('');
    } catch (err: any) {
      toast.error(err?.message || '操作失败');
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'approved') return <Badge variant="default">已通过</Badge>;
    if (status === 'rejected') return <Badge variant="destructive">已驳回</Badge>;
    return <Badge variant="outline">待处理</Badge>;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">申诉复审</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { value: 'pending', label: '待处理' },
          { value: 'approved', label: '已通过' },
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
          <p className="text-base font-medium text-gray-500">暂无申诉记录</p>
          <p className="text-sm mt-1">
            {statusFilter === 'pending' ? '当前没有待处理的申诉' : `当前没有${statusFilter === 'approved' ? '已通过' : '已驳回'}的申诉`}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">申诉原因</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-24">关联举报</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-20">状态</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-32">提交时间</th>
                    {statusFilter === 'pending' && (
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-40">操作</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="text-gray-900 truncate max-w-md">{item.reason}</p>
                        {item.handlerNote && (
                          <p className="text-gray-400 text-xs mt-0.5">处理备注: {item.handlerNote}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-500 font-mono text-xs">{item.reportId}</span>
                      </td>
                      <td className="px-4 py-3">{statusBadge(item.status)}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleString('zh-CN', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </td>
                      {statusFilter === 'pending' && (
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(item.id)}
                              disabled={actionLoading === item.id}
                              className="px-3 py-1 text-xs rounded bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                            >
                              {actionLoading === item.id ? '处理中...' : '通过'}
                            </button>
                            <button
                              onClick={() => setRejectId(item.id)}
                              disabled={actionLoading === item.id}
                              className="px-3 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                            >
                              驳回
                            </button>
                          </div>
                        </td>
                      )}
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">驳回申诉</h2>
            <label className="block text-sm text-gray-600 mb-2">
              驳回说明 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              rows={3}
              placeholder="请输入驳回说明（至少 5 个字符）"
              maxLength={500}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{rejectNote.length}/500</p>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => { setRejectId(null); setRejectNote(''); }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                disabled={rejectNote.trim().length < 5 || actionLoading === rejectId}
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
