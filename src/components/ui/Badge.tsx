import { cn } from '@/lib/utils';
import { formatStatusLabel } from '@/utils/formatters';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'surface' | 'brand';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  label?: string;
  children?: React.ReactNode;
  dot?: boolean;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-success-50 text-success-700 ring-success-600/20',
  danger: 'bg-danger-50 text-danger-700 ring-danger-600/20',
  warning: 'bg-warning-50 text-warning-700 ring-warning-600/20',
  info: 'bg-info-50 text-info-700 ring-info-600/20',
  surface: 'bg-surface-100 text-surface-600 ring-surface-500/20',
  brand: 'bg-brand-50 text-brand-700 ring-brand-600/20',
};

const dotColorClasses: Record<BadgeVariant, string> = {
  success: 'bg-success-500',
  danger: 'bg-danger-500',
  warning: 'bg-warning-500',
  info: 'bg-info-500',
  surface: 'bg-surface-400',
  brand: 'bg-brand-500',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'text-2xs px-2 py-0.5 gap-1',
  md: 'text-xs px-2.5 py-1 gap-1.5',
};

export function Badge({
  variant = 'surface',
  size = 'md',
  label,
  children,
  dot = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium ring-1 ring-inset',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', dotColorClasses[variant])}
          aria-hidden="true"
        />
      )}
      {label ? formatStatusLabel(label) : children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, BadgeVariant> = {
    ACTIVE: 'success',
    INACTIVE: 'danger',
    ONLINE: 'success',
    OFFLINE: 'danger',
    UNALLOCATED: 'surface',
    MAINTENANCE: 'warning',
    PRESENT: 'success',
    ABSENT: 'danger',
    LATE: 'warning',
    EARLY_OUT: 'warning',
    INCOMPLETE: 'info',
    HOLIDAY: 'info',
    WEEKLY_OFF: 'surface',
    ON_LEAVE: 'info',
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
    CANCELLED: 'surface',
  };
  const variant = variantMap[status] ?? 'surface';
  return <Badge variant={variant} label={status} dot />;
}
