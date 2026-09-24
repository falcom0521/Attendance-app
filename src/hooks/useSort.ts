import { useCallback, useMemo, useState } from 'react';
import { compareForSort, type SortDir } from '@/lib/sort';

export type { SortDir };

/**
 * Client-side sort for tables that already have their full dataset in hand (raw `<table>`
 * pages that fetch everything and paginate locally). For server-paginated lists, sort the
 * mock service's data before it slices the page instead — sorting only the visible page would
 * silently reorder just those rows.
 */
export function useSort<T>(data: T[], getValue: (row: T, key: string) => unknown) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir | null>(null);

  // Clicking a new column starts it at 'asc'; clicking the active column cycles asc -> desc -> none.
  const onSort = useCallback((key: string) => {
    setSortKey((prevKey) => {
      setSortDir((prevDir) => (prevKey !== key ? 'asc' : prevDir === 'asc' ? 'desc' : prevDir === 'desc' ? null : 'asc'));
      return key;
    });
  }, []);

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return data;
    return [...data].sort((a, b) => compareForSort(getValue(a, sortKey), getValue(b, sortKey), sortDir));
  }, [data, sortKey, sortDir, getValue]);

  return { sortKey, sortDir, onSort, sortedData };
}
