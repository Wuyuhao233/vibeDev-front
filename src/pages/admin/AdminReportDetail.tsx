import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getReportDetail, handleReport } from '../../api/admin';
import type { AdminReport } from '../../types/admin';
import {
  Button,
  Spinner,
} from '../../components/ui';
import { ErrorEmpty } from '../../components/shared';

export default function AdminReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<AdminReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [action, setAction] = useState<'ignore' | 'warn' | 'delete_post' | 'ban'>('ignore');
  const [note, setNote] = useState('');
  const [handling, setHandling] = useState(false);
  const [handled, setHandled] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getReportDetail(Number(id));
      setReport(data);
    } catch (err: any) {
      setError(err?.message || '加载举报详情失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  async function handleSubmit() {
    if (!report || !note.trim()) return;
    setHandling(true);
    try {
      await handleReport(report.id, { action, note });
      toast.success('处理完成');
      setHandled(true);
    } catch (err: any) {
      toast.error(err?.message || '处理失败');
    } finally {
      setHandling(false);
    }
  }

  const actionLabels: Record<string, string> = {
    ignore: '忽略',
    warn: '警告',
    delete_post: '删帖',
    ban: '禁言',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-500">加载中...</span>
      </div>
    );
  }

  if (error) {
    return <ErrorEmpty description={error} onRetry={fetchDetail} />;
  }

  if (!report) {
    return <ErrorEmpty title="举报不存在" description="该举报可能已被删除" />;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-primary-500">
          ← 返回
        </button>
        <h1 className="text-2xl font-bold text-gray-900">举报详情 #{report.id}</h1>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Report info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4">举报信息</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">类型</dt>
              <dd className="text-sm text-gray-900">{report.type === 'post' ? '帖子' : '回复'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">原因</dt>
              <dd className="text-sm text-gray-900">{report.reason}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">举报人</dt>
              <dd className="text-sm text-gray-900">{report.reporter.username}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">版块</dt>
              <dd className="text-sm text-gray-900">{report.boardName || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">状态</dt>
              <dd>
                <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                  report.status === 'pending'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {report.status === 'pending' ? '待处理' : '已处理'}
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">时间</dt>
              <dd className="text-sm text-gray-900">
                {new Date(report.createdAt).toLocaleString('zh-CN')}
              </dd>
            </div>
            {report.description && (
              <div>
                <dt className="text-sm text-gray-500 mb-1">详细描述</dt>
                <dd className="text-sm text-gray-700 bg-gray-50 rounded p-3">{report.description}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Target content */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4">被举报内容</h2>
          <div className="bg-gray-50 rounded p-4 text-sm text-gray-700 max-h-64 overflow-y-auto whitespace-pre-wrap">
            {report.targetContent || '(内容已无法显示)'}
          </div>
        </div>
      </div>

      {/* Handling panel */}
      {report.status === 'pending' && !handled ? (
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4">处理</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">处理方式</label>
              <div className="flex gap-2">
                {(['ignore', 'warn', 'delete_post', 'ban'] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => setAction(a)}
                    className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                      action === a
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {actionLabels[a]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                处理说明 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full h-28 px-3 py-2 border border-gray-200 rounded-md text-sm resize-none focus:outline-none focus:border-primary-500"
                placeholder="请填写处理原因和说明，将记录在系统中..."
              />
            </div>
            <Button onClick={handleSubmit} disabled={handling || !note.trim()}>
              {handling ? '处理中...' : `确认${actionLabels[action]}`}
            </Button>
          </div>
        </div>
      ) : handled ? (
        <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-600">
          处理完成
        </div>
      ) : null}
    </div>
  );
}
