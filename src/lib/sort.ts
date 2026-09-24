import type { SortOrder } from '@/types/common';

export type SortDir = SortOrder;

/**
 * Compares two sort values consistently across every table in the app: numbers compare
 * numerically, everything else compares as a locale-aware, numeric-aware string (so "2" sorts
 * before "10", and ISO date/datetime strings sort chronologically without parsing). Nullish
 * values always sort to the end, regardless of direction, so unset fields don't jump around
 * when the direction is flipped.
 */
export function compareForSort(a: unknown, b: unknown, dir: SortDir): number {
  const av = a ?? null;
  const bv = b ?? null;
  if (av == null && bv == null) return 0;
  if (av == null) return 1;
  if (bv == null) return -1;
  const cmp =
    typeof av === 'number' && typeof bv === 'number'
      ? av - bv
      : String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });
  return dir === 'asc' ? cmp : -cmp;
}

/**
 * Sorts a full list by a dynamic field name before it's paginated — mock services call this so
 * "sort by X" actually reorders the whole list, not just whichever rows happen to land on the
 * current page. `getValue` maps a sort key to the value on a row; return `undefined` for a key
 * the service doesn't support and the list is returned unsorted (falls back to insertion order).
 */
export function sortRecords<T>(
  records: T[],
  sortBy: string | undefined,
  sortDir: SortDir | undefined,
  getValue: (row: T, key: string) => unknown
): T[] {
  if (!sortBy) return records;
  const dir = sortDir ?? 'asc';
  return [...records].sort((a, b) => compareForSort(getValue(a, sortBy), getValue(b, sortBy), dir));
}
