import { useState, useEffect, useCallback } from 'react';
import * as pointsApi from '../api/points';
import type { PointsRecord } from '../api/points';
import { Skeleton } from './ui';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from './ui';
import { ErrorEmpty, PaginationComponent } from './shared';
import { formatRelativeTime } from '../utils/relativeTime';

interface PointsHistoryProps {
  username: string;
}

const PAGE_SIZE = 20;

export default function PointsHistory({ username }: PointsHistoryProps) {
  const [records, setRecords] = useState<PointsRecord[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await pointsApi.getPointsHistory(username, page, PAGE_SIZE);
      setRecords(data.items);
      setTotal(data.total);
    } catch {
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  }, [username, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorEmpty
        description="请检查网络连接后重试"
        onRetry={fetchData}
      />
    );
  }

  if (records.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>暂无积分记录</EmptyTitle>
          <EmptyDescription>参与签到、发帖、回复等操作获取积分</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-2">
        {records.map((record) => (
          <div
            key={record.id}
            className="flex items-center justify-between px-4 py-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors duration-150"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">{record.reasonLabel}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatRelativeTime(record.createdAt)}
              </p>
            </div>
            <span
              className={`flex-shrink-0 ml-4 text-sm font-medium ${
                record.amount >= 0 ? 'text-emerald-500' : 'text-red-500'
              }`}
            >
              {record.amount > 0 ? '+' : ''}{record.amount}
            </span>
          </div>
        ))}
      </div>
      <PaginationComponent
        currentPage={page}
        total={total}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  );
}
