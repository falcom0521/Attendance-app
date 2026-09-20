import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { Search } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  width?: string;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyState?: {
    title: string;
    description?: string;
    action?: { label: string; onClick: () => void; icon?: React.ReactNode };
    icon?: React.ReactNode;
  };
  pagination?: {
    page: number;
    totalPages: number;
    total: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  searchValue?: string;
  rowClassName?: (row: T) => string;
  onRowClick?: (row: T) => void;
  stickyHeader?: boolean;
  className?: string;
  compact?: boolean;
}

type SortDirection = 'asc' | 'desc' | null;

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  loading = false,
  error,
  onRetry,
  emptyState,
  pagination,
  searchable,
  searchPlaceholder = 'Search...',
  onSearchChange,
  searchValue,
  rowClassName,
  onRowClick,
  stickyHeader = false,
  className,
  compact = false,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'));
      if (sortDir === 'desc') setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey || !sortDir) return 0;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.accessor || typeof col.accessor === 'function') return 0;
    const aVal = String(a[col.accessor] ?? '');
    const bVal = String(b[col.accessor] ?? '');
    return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });

  return (
    <div className={cn('card overflow-hidden', className)}>
      {searchable && (
        <div className="px-4 py-3 border-b border-surface-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-surface-400 pointer-events-none" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue ?? ''}
              maxLength={100}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="form-input pl-8 text-sm h-8"
              aria-label="Search"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead className={cn(stickyHeader && 'sticky top-0 z-10')}>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'table-th',
                    col.sortable && 'cursor-pointer select-none hover:bg-surface-100',
                    col.headerClassName
                  )}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  aria-sort={
                    sortKey === col.key
                      ? sortDir === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                >
                  <span className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <span className="text-surface-400">
                        {sortKey === col.key ? (
                          sortDir === 'asc' ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )
                        ) : (
                          <ChevronsUpDown className="h-3 w-3" />
                        )}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  <TableSkeleton rows={5} columns={columns.length} />
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={columns.length}>
                  <ErrorState message={error} onRetry={onRetry} />
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  {emptyState ? (
                    <EmptyState {...emptyState} />
                  ) : (
                    <EmptyState title="No data found" description="There are no records to display." />
                  )}
                </td>
              </tr>
            ) : (
              sortedData.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  className={cn(
                    'table-tr',
                    onRowClick && 'cursor-pointer',
                    rowClassName?.(row)
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn('table-td', compact && 'py-2', col.className)}
                    >
                      {typeof col.accessor === 'function'
                        ? col.accessor(row)
                        : col.accessor
                          ? String(row[col.accessor] ?? '-')
                          : '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && !loading && !error && (
        <Pagination {...pagination} />
      )}
    </div>
  );
}
