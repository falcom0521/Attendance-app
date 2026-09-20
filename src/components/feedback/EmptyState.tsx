import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      {icon && (
        <div className="mb-4 p-4 bg-surface-100 rounded-2xl text-surface-400">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-surface-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-surface-500 max-w-sm">{description}</p>
      )}
      {action && (
        <div className="mt-5">
          <Button onClick={action.onClick} leftIcon={action.icon}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
