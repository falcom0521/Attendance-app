import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'underline' | 'pill';
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, variant = 'underline', className }: TabsProps) {
  if (variant === 'pill') {
    return (
      <div className={cn('flex gap-1 p-1 bg-surface-100 rounded-xl w-fit', className)}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150',
              tab.id === activeTab
                ? 'bg-white text-surface-900 shadow-soft-sm'
                : 'text-surface-500 hover:text-surface-700'
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.badge !== undefined && (
              <span className={cn(
                'inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-xs font-semibold',
                tab.id === activeTab ? 'bg-brand-100 text-brand-700' : 'bg-surface-200 text-surface-600'
              )}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('border-b border-surface-200', className)}>
      <nav className="-mb-px flex gap-1" aria-label="Tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={tab.id === activeTab}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-150 whitespace-nowrap',
              tab.id === activeTab
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300'
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.badge !== undefined && (
              <span className={cn(
                'inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-xs font-semibold',
                tab.id === activeTab ? 'bg-brand-100 text-brand-700' : 'bg-surface-100 text-surface-500'
              )}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
