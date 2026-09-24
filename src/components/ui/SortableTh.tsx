import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SortDir } from '@/lib/sort';

interface SortableThProps {
  label: string;
  sortKey: string;
  activeKey: string | null;
  dir: SortDir | null;
  onSort: (key: string) => void;
  className?: string;
  width?: string;
}

/** A `<th>` with the same click-to-sort look everywhere: chevron-up/down when active, an idle double-chevron otherwise. */
export function SortableTh({ label, sortKey, activeKey, dir, onSort, className, width }: SortableThProps) {
  const active = activeKey === sortKey;
  return (
    <th
      className={cn('table-th cursor-pointer select-none hover:bg-surface-100', className)}
      style={width ? { width } : undefined}
      onClick={() => onSort(sortKey)}
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : undefined}
    >
      <span className="flex items-center gap-1">
        {label}
        <span className="text-surface-400">
          {active ? (
            dir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronsUpDown className="h-3 w-3" />
          )}
        </span>
      </span>
    </th>
  );
}
