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
  /** Makes the card an interactive button (e.g. jump to the filtered list behind this number). */
  onClick?: () => void;
}

// A restrained, semantic palette: colour is reserved for metrics where it carries meaning
// (good / bad / needs attention / primary count). Everything else — headcounts, device
// counts, secondary totals — shares one neutral slate tone instead of a different hue each,
// which keeps a row of KPI cards from reading as a rainbow.
const colorConfig = {
  blue: { icon: 'bg-brand-50 text-brand-600' },
  green: { icon: 'bg-success-50 text-success-600' },
  red: { icon: 'bg-danger-50 text-danger-600' },
  yellow: { icon: 'bg-warning-50 text-warning-600' },
  purple: { icon: 'bg-surface-100 text-surface-500' },
  cyan: { icon: 'bg-surface-100 text-surface-500' },
  orange: { icon: 'bg-surface-100 text-surface-500' },
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
  onClick,
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

  const Container = onClick ? 'button' : 'div';

  return (
    <Container
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'card p-5 w-full text-left hover:border-surface-300 transition-colors duration-200',
        onClick && 'cursor-pointer hover:shadow-soft-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-surface-500 truncate">{title}</p>
          <p className="text-2xl font-bold mt-1 text-surface-900 tabular-nums">{value}</p>
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
          <div className={cn('flex-shrink-0 p-2.5 rounded-lg', colors.icon)}>
            {icon}
          </div>
        )}
      </div>
    </Container>
  );
}
