import { cn } from '@/lib/utils';

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

/** Label / value pair used on detail pages. Empty values render as an em dash. */
export function DetailRow({ label, value, className }: DetailRowProps) {
  const empty = value === undefined || value === null || value === '';
  return (
    <div className={cn('flex items-start justify-between gap-4 py-2.5 border-b border-surface-50 last:border-0', className)}>
      <span className="text-xs text-surface-400 pt-0.5 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-surface-800 text-right break-words min-w-0">
        {empty ? <span className="text-surface-300">—</span> : value}
      </span>
    </div>
  );
}
