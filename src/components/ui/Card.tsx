import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

interface CardHeaderProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className, padding = false }: CardProps) {
  return (
    <div className={cn('card', padding && 'p-5', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, children, className }: CardHeaderProps) {
  return (
    <div className={cn('card-header flex items-center justify-between gap-4', className)}>
      <div className="min-w-0">
        {title && <h3 className="font-semibold text-surface-900 truncate">{title}</h3>}
        {subtitle && <p className="text-sm text-surface-500 mt-0.5">{subtitle}</p>}
        {children}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ children, className }: CardBodyProps) {
  return <div className={cn('card-body', className)}>{children}</div>;
}
