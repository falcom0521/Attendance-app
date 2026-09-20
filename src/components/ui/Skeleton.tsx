import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-md bg-surface-200', className)} />;
}

export function TableSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-0">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-surface-50">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className={cn('h-4', j === 0 ? 'w-8' : 'flex-1')} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card p-5 animate-pulse space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-8 w-8 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-1/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}
