import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label?: string };
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'cyan' | 'orange';
  className?: string;
  loading?: boolean;
}

const colorConfig = {
  blue: { icon: 'bg-brand-50 text-brand-600', value: 'text-surface-900' },
  green: { icon: 'bg-success-50 text-success-600', value: 'text-success-700' },
  red: { icon: 'bg-danger-50 text-danger-600', value: 'text-danger-700' },
  yellow: { icon: 'bg-warning-50 text-warning-600', value: 'text-warning-700' },
  purple: { icon: 'bg-purple-50 text-purple-600', value: 'text-purple-700' },
  cyan: { icon: 'bg-cyan-50 text-cyan-600', value: 'text-cyan-700' },
  orange: { icon: 'bg-orange-50 text-orange-600', value: 'text-orange-700' },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
  className,
  loading = false,
}: StatCardProps) {
  const colors = colorConfig[color];
  const isPositive = trend && trend.value >= 0;

  if (loading) {
    return (
      <div className={cn('card p-5 animate-pulse', className)}>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-3 bg-surface-200 rounded w-1/2" />
            <div className="h-8 bg-surface-200 rounded w-1/3" />
            <div className="h-3 bg-surface-200 rounded w-2/3" />
          </div>
          <div className="h-10 w-10 bg-surface-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('card p-5 hover:shadow-soft transition-shadow duration-200', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-surface-500 truncate">{title}</p>
          <p className={cn('text-2xl font-bold mt-1', colors.value)}>{value}</p>
          <div className="flex items-center gap-2 mt-1.5">
            {trend !== undefined && (
              <span
                className={cn(
                  'flex items-center gap-0.5 text-xs font-medium',
                  isPositive ? 'text-success-600' : 'text-danger-600'
                )}
              >
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(trend.value)}%
              </span>
            )}
            {subtitle && <p className="text-xs text-surface-400 truncate">{subtitle}</p>}
          </div>
        </div>
        {icon && (
          <div className={cn('flex-shrink-0 p-2.5 rounded-xl', colors.icon)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
