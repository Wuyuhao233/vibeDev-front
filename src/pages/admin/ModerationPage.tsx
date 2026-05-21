import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReviewQueue, getReports, getAppeals } from '../../api/admin';
import type { ReviewQueueItem, AdminReport, AppealItem } from '../../types/admin';
import { Spinner } from '../../components/ui';

export default function ModerationPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'review' | 'reports' | 'appeals'>('review');

  // Review stats
  const [reviewPending, setReviewPending] = useState(0);
  const [reportPending, setReportPending] = useState(0);
  const [appealPending, setAppealPending] = useState(0);
  const [loading, setLoading] = useState(true);

  // Review queue items
  const [reviewItems, setReviewItems] = useState<ReviewQueueItem[]>([]);
  const [reportItems, setReportItems] = useState<AdminReport[]>([]);
  const [appealItems, setAppealItems] = useState<AppealItem[]>([]);

  const fetchCounts = useCallback(async () => {
    setLoading(true);
    try {
      const [reviewData, reportData, appealData] = await Promise.all([
        getReviewQueue({ status: 'pending', page: 1, pageSize: 5 }),
        getReports({ status: 'pending', page: 1, pageSize: 5 }),
        getAppeals({ status: 'pending', page: 1, pageSize: 5 }),
      ]);
      setReviewPending(reviewData.stats?.pendingCount ?? reviewData.total);
      setReviewItems(reviewData.items);
      setReportPending(reportData.total);
      setReportItems(reportData.items);
      setAppealPending(appealData.total);
      setAppealItems(appealData.items);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const tabs = [
    { key: 'review' as const, label: 'AI 审核', count: reviewPending, path: '/admin/review-queue' },
    { key: 'reports' as const, label: '举报管理', count: reportPending, path: '/admin/reports' },
    { key: 'appeals' as const, label: '申诉复审', count: appealPending, path: '/admin/appeals' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">审核队列</h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-red-500 text-white">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
          <span className="ml-3 text-muted-foreground">加载中...</span>
        </div>
      ) : (
        <>
          {/* Review Queue Tab */}
          {activeTab === 'review' && (
            <div>
              {reviewItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <p className="text-base">暂无待审核内容</p>
                  <p className="text-sm mt-1">当前没有需要人工复审的帖子或回复</p>
                </div>
              ) : (
                <>
                  <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/30 border-b border-border">
                          <tr>
                            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">内容</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground w-20">作者</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground w-20">AI评分</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground w-32">提交时间</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {reviewItems.map((item) => (
                            <tr key={item.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => navigate('/admin/review-queue')}>
                              <td className="px-4 py-3">
                                <p className="text-foreground font-medium truncate max-w-xs">{item.targetTitle}</p>
                                <p className="text-muted-foreground text-xs mt-0.5 truncate max-w-xs">{item.contentExcerpt}</p>
                              </td>
                              <td className="px-4 py-3 text-foreground/80">{item.author.username}</td>
                              <td className="px-4 py-3">
                                <span className={`font-semibold ${item.aiScore >= 80 ? 'text-red-500' : item.aiScore >= 60 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                  {item.aiScore}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground text-xs">
                                {item.createdAt ? new Date(item.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {reviewPending > 5 && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => navigate('/admin/review-queue')}
                        className="text-sm text-primary hover:underline"
                      >
                        查看全部 {reviewPending} 条 →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div>
              {reportItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <p className="text-base">暂无待处理举报</p>
                </div>
              ) : (
                <>
                  <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/30 border-b border-border">
                          <tr>
                            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">举报原因</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground w-20">举报人</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground w-32">举报时间</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {reportItems.map((r) => (
                            <tr key={r.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => navigate('/admin/reports')}>
                              <td className="px-4 py-3">
                                <p className="text-foreground font-medium">{r.reasonType}</p>
                                <p className="text-muted-foreground text-xs mt-0.5 truncate max-w-xs">{r.description}</p>
                              </td>
                              <td className="px-4 py-3 text-foreground/80">{r.reporterId || '-'}</td>
                              <td className="px-4 py-3 text-muted-foreground text-xs">
                                {r.createdAt ? new Date(r.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {reportPending > 5 && (
                    <div className="mt-4 text-center">
                      <button onClick={() => navigate('/admin/reports')} className="text-sm text-primary hover:underline">
                        查看全部 {reportPending} 条 →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Appeals Tab */}
          {activeTab === 'appeals' && (
            <div>
              {appealItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <p className="text-base">暂无待处理申诉</p>
                </div>
              ) : (
                <>
                  <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/30 border-b border-border">
                          <tr>
                            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">申诉内容</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground w-20">申诉人</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground w-32">提交时间</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {appealItems.map((a) => (
                            <tr key={a.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => navigate('/admin/appeals')}>
                              <td className="px-4 py-3">
                                <p className="text-foreground truncate max-w-xs">{a.appealReason}</p>
                                <p className="text-muted-foreground text-xs mt-0.5 truncate max-w-xs">{a.reviewNote || '-'}</p>
                              </td>
                              <td className="px-4 py-3 text-foreground/80">{a.appellantUsername || '-'}</td>
                              <td className="px-4 py-3 text-muted-foreground text-xs">
                                {a.createdAt ? new Date(a.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {appealPending > 5 && (
                    <div className="mt-4 text-center">
                      <button onClick={() => navigate('/admin/appeals')} className="text-sm text-primary hover:underline">
                        查看全部 {appealPending} 条 →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
