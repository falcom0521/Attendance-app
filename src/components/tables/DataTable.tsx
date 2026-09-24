import { useState } from 'react';
import { cn } from '@/lib/utils';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { SortableTh } from '@/components/ui/SortableTh';
import { compareForSort, type SortDir } from '@/lib/sort';
import { Search } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  /**
   * The value to sort by, if it differs from what's rendered (composite cells, badges, derived
   * counts, etc). Falls back to `accessor` when it's a plain field name; a column whose
   * `accessor` is a render function needs this to be sortable at all.
   */
  sortValue?: (row: T) => string | number | null | undefined;
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
  /**
   * Controlled sort — pass these (alongside `pagination`) when `data` is only the current page
   * from a server-paginated list, so the parent can sort the whole list (via the service) before
   * slicing it, instead of DataTable re-sorting just the visible rows. Omit all three to let
   * DataTable manage sorting itself over the full `data` array (the common case for lists that
   * are fetched in full).
   */
  sortKey?: string | null;
  sortDir?: SortDir | null;
  onSortChange?: (key: string | null, dir: SortDir | null) => void;
}

function getSortValue<T>(row: T, col: Column<T>): string | number | null | undefined {
  if (col.sortValue) return col.sortValue(row);
  if (col.accessor && typeof col.accessor !== 'function') {
    return row[col.accessor] as string | number | null | undefined;
  }
  return null;
}

/** asc -> desc -> none, matching the same cycle everywhere sort is used in the app. */
function nextSort(key: string, activeKey: string | null, activeDir: SortDir | null): { key: string | null; dir: SortDir | null } {
  if (activeKey !== key) return { key, dir: 'asc' };
  if (activeDir === 'asc') return { key, dir: 'desc' };
  return { key: null, dir: null };
}

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
  sortKey: controlledSortKey,
  sortDir: controlledSortDir,
  onSortChange,
}: DataTableProps<T>) {
  const controlled = !!onSortChange;
  const [localSortKey, setLocalSortKey] = useState<string | null>(null);
  const [localSortDir, setLocalSortDir] = useState<SortDir | null>(null);

  const sortKey = controlled ? controlledSortKey ?? null : localSortKey;
  const sortDir = controlled ? controlledSortDir ?? null : localSortDir;

  function handleSort(key: string) {
    const next = nextSort(key, sortKey, sortDir);
    if (controlled) {
      onSortChange!(next.key, next.dir);
    } else {
      setLocalSortKey(next.key);
      setLocalSortDir(next.dir);
    }
  }

  // In controlled mode `data` is assumed already sorted (and paginated) by the caller.
  const sortedData = controlled || !sortKey || !sortDir
    ? data
    : [...data].sort((a, b) => {
        const col = columns.find((c) => c.key === sortKey);
        if (!col) return 0;
        return compareForSort(getSortValue(a, col), getSortValue(b, col), sortDir);
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
              {columns.map((col) =>
                col.sortable ? (
                  <SortableTh
                    key={col.key}
                    label={col.header}
                    sortKey={col.key}
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                    className={col.headerClassName}
                    width={col.width}
                  />
                ) : (
                  <th
                    key={col.key}
                    className={cn('table-th', col.headerClassName)}
                    style={col.width ? { width: col.width } : undefined}
                  >
                    {col.header}
                  </th>
                )
              )}
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
