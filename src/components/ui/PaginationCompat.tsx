import {
  Pagination as ShadcnPagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from './Pagination'

interface PaginationCompatProps {
  total: number
  page?: number
  current?: number
  pageSize: number
  onChange: ((page: number) => void) | React.Dispatch<React.SetStateAction<number>>
  onPageSizeChange?: (size: number) => void
  className?: string
}

function PaginationCompat({ total, page, current, pageSize, onChange, onPageSizeChange: _onPageSizeChange, className }: PaginationCompatProps) {
  const currentPage = current ?? page ?? 1
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null

  const handleChange = (p: number) => {
    if (typeof onChange === 'function') {
      (onChange as (page: number) => void)(p)
    }
  }

  const getPages = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('ellipsis')
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i)
      }
      if (currentPage < totalPages - 2) pages.push('ellipsis')
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <ShadcnPagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => currentPage > 1 && handleChange(currentPage - 1)}
            aria-disabled={currentPage <= 1}
          />
        </PaginationItem>
        {getPages().map((p, i) =>
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
    </ShadcnPagination>
  )
}

export { PaginationCompat as Pagination }
