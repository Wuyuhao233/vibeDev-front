import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getReports, handleReport } from '../../api/admin';
import { getBoards, Board } from '../../api/board';
import type { AdminReport } from '../../types/admin';
import {
  Button,
  Pagination,
  Spinner,
  ErrorState,
  Empty,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui';

const PAGE_SIZE = 20;

export default function ReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [boardIdFilter, setBoardIdFilter] = useState<number | ''>('');
  const [boards, setBoards] = useState<Board[]>([]);

  // Quick handle from list
  const [quickTarget, setQuickTarget] = useState<AdminReport | null>(null);
  const [quickAction, setQuickAction] = useState<'ignore' | 'warn' | 'delete_post' | 'ban'>('ignore');
  const [quickNote, setQuickNote] = useState('');
  const [handling, setHandling] = useState(false);

  useEffect(() => {
    getBoards().then(setBoards).catch(() => {});
  }, []);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, pageSize: PAGE_SIZE };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      if (boardIdFilter) params.boardId = boardIdFilter;
      const data = await getReports(params);
      setReports(data.items || []);
      setTotal(data.total);
    } catch (err: any) {
      setError(err?.message || '加载举报列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter, boardIdFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  async function handleQuickAction() {
    if (!quickTarget || !quickNote.trim()) {
      return;
    }
    setHandling(true);
    try {
      await handleReport(quickTarget.id, { action: quickAction, note: quickNote });
      toast.success('处理完成');
      setQuickTarget(null);
      setQuickNote('');
      fetchReports();
    } catch (err: any) {
      toast.error(err?.message || '处理失败');
    } finally {
      setHandling(false);
    }
  }

  function openDetail(reportId: number) {
    navigate(`/admin/reports/${reportId}`);
  }

  const actionLabels: Record<string, string> = {
    ignore: '忽略',
    warn: '警告',
    delete_post: '删帖',
    ban: '禁言',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">举报管理</h1>

      <div className="flex items-center gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 border border-gray-200 rounded-md text-sm bg-white text-gray-600"
        >
          <option value="">全部状态</option>
          <option value="pending">待处理</option>
          <option value="handled">已处理</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 border border-gray-200 rounded-md text-sm bg-white text-gray-600"
        >
          <option value="">全部类型</option>
          <option value="post">帖子</option>
          <option value="reply">回复</option>
        </select>
        <select
          value={boardIdFilter}
          onChange={(e) => { setBoardIdFilter(e.target.value ? Number(e.target.value) : ''); setPage(1); }}
          className="h-9 px-3 border border-gray-200 rounded-md text-sm bg-white text-gray-600"
        >
          <option value="">全部版块</option>
          {boards.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
          <span className="ml-3 text-gray-500">加载中...</span>
        </div>
      ) : error ? (
        <ErrorState title="加载失败" description={error} onRetry={fetchReports} />
      ) : reports.length === 0 ? (
        <Empty title="暂无举报" description={statusFilter || typeFilter || boardIdFilter ? '没有匹配的举报' : undefined} />
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">类型</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">原因</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">举报人</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">版块</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">状态</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">时间</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        r.type === 'post' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'
                      }`}>
                        {r.type === 'post' ? '帖子' : '回复'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">{r.reason}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{r.reporter.username}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{r.boardName || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                        r.status === 'pending'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {r.status === 'pending' ? '待处理' : '已处理'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(r.createdAt).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === 'pending' && (
                        <button
                          onClick={() => setQuickTarget(r)}
                          className="text-xs text-primary-500 hover:text-primary-600 mr-2"
                        >
                          处理
                        </button>
                      )}
                      <button
                        onClick={() => openDetail(r.id)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        详情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <Pagination total={total} page={page} pageSize={PAGE_SIZE} onChange={setPage} />
          </div>
        </>
      )}

      {/* Quick handle dialog */}
      <Dialog open={!!quickTarget} onOpenChange={(v) => !v && setQuickTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>处理举报</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">处理方式</label>
              <select
                value={quickAction}
                onChange={(e) => setQuickAction(e.target.value as any)}
                className="h-9 w-full px-3 border border-gray-200 rounded-md text-sm bg-white"
              >
                <option value="ignore">忽略</option>
                <option value="warn">警告</option>
                <option value="delete_post">删帖</option>
                <option value="ban">禁言</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">处理说明 <span className="text-red-500">*</span></label>
              <textarea
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                className="w-full h-24 px-3 py-2 border border-gray-200 rounded-md text-sm resize-none focus:outline-none focus:border-primary-500"
                placeholder="请填写处理说明..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickTarget(null)}>取消</Button>
            <Button onClick={handleQuickAction} disabled={handling || !quickNote.trim()}>
              {handling ? '处理中...' : `确认${actionLabels[quickAction]}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
