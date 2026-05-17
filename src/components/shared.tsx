/**
 * Shared helper components built on shadcn primitives,
 * replacing the removed Compat wrappers.
 */
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
  Button,
} from '../components/ui';
import { AlertCircleIcon } from 'lucide-react';
import { generatePageNumbers } from '../utils/pagination';

/** Error state using shadcn Empty */
export function ErrorEmpty({
  title = '加载失败',
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <AlertCircleIcon className="text-red-500" />
        </EmptyMedia>
        <EmptyTitle className="text-red-500">{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {onRetry && (
        <EmptyContent>
          <Button variant="outline" size="sm" onClick={onRetry}>重试</Button>
        </EmptyContent>
      )}
    </Empty>
  );
}

/** Data-driven Pagination using shadcn Pagination primitives */
export function PaginationComponent({
  currentPage,
  total,
  pageSize,
  onPageChange,
  className,
}: {
  currentPage: number;
  total: number;
  pageSize: number;
  onPageChange: ((page: number) => void) | React.Dispatch<React.SetStateAction<number>>;
  className?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const handleChange = (p: number) => {
    if (typeof onPageChange === 'function') {
      (onPageChange as (page: number) => void)(p);
    }
  };

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => currentPage > 1 && handleChange(currentPage - 1)}
            aria-disabled={currentPage <= 1}
          />
        </PaginationItem>
        {generatePageNumbers(currentPage, totalPages).map((p, i) =>
          p === 'ellipsis' ? (
            <PaginationItem key={`e-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink isActive={p === currentPage} onClick={() => handleChange(p)}>
                {p}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext
            onClick={() => currentPage < totalPages && handleChange(currentPage + 1)}
            aria-disabled={currentPage >= totalPages}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
