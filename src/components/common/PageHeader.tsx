import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  className?: string;
}

export function PageHeader({ title, subtitle, action, breadcrumbs, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4', className)}>
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 mb-1.5">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-surface-300">/</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="text-xs text-surface-400 hover:text-surface-600 transition-colors">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-xs text-surface-400">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-xl font-bold text-surface-900">{title}</h1>
        {subtitle && <p className="text-sm text-surface-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-3 flex-shrink-0">{action}</div>}
    </div>
  );
}
