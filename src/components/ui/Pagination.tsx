import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  className,
}: PaginationProps) {
  const start = Math.min((page - 1) * pageSize + 1, total);
  const end = Math.min(page * pageSize, total);

  const pages = getPageNumbers(page, totalPages);

  if (totalPages <= 1 && total <= pageSize) return null;

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-surface-100',
        className
      )}
    >
      <p className="text-sm text-surface-500">
        Showing{' '}
        <span className="font-medium text-surface-700">{start}–{end}</span> of{' '}
        <span className="font-medium text-surface-700">{total}</span> results
      </p>
      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="flex items-center justify-center h-8 w-8 rounded-lg border border-surface-200 text-surface-500 hover:bg-surface-50 hover:text-surface-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="h-8 w-8 flex items-center justify-center text-sm text-surface-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(Number(p))}
              className={cn(
                'h-8 w-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors',
                Number(p) === page
                  ? 'bg-brand-600 text-white'
                  : 'border border-surface-200 text-surface-600 hover:bg-surface-50'
              )}
              aria-current={Number(p) === page ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="flex items-center justify-center h-8 w-8 rounded-lg border border-surface-200 text-surface-500 hover:bg-surface-50 hover:text-surface-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
}
