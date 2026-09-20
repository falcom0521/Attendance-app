import { ChevronDown, GitBranch } from 'lucide-react';
import { useSubCompaniesByCompany } from '@/features/companies/hooks/useCompanies';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

interface SubCompanySelectorProps {
  companyId: string;
  companyName: string;
}

export function SubCompanySelector({ companyId, companyName }: SubCompanySelectorProps) {
  const { data: subCompanies = [] } = useSubCompaniesByCompany(companyId);
  const { selectedSubCompanyId, setSelectedSubCompany } = useUIStore();

  const selected = subCompanies.find((sc) => sc.id === selectedSubCompanyId);
  const label = selected ? selected.name : 'All Sub Companies';

  return (
    <div className="hidden sm:flex items-center gap-1.5 text-sm pl-2 border-l border-surface-200">
      {/* Company name (static) */}
      <span className="text-surface-500 font-medium">{companyName}</span>
      <span className="text-surface-300">/</span>

      {/* Sub-company dropdown */}
      <div className="relative group">
        <button
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors text-sm font-semibold',
            selectedSubCompanyId
              ? 'text-brand-700 bg-brand-50 hover:bg-brand-100'
              : 'text-surface-700 hover:bg-surface-100'
          )}
          aria-label="Select sub company"
        >
          <GitBranch className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
          <span className="max-w-[160px] truncate">{label}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-50 flex-shrink-0" />
        </button>

        {/* Dropdown */}
        <div className={cn(
          'absolute left-0 top-full mt-1.5 w-56 bg-white border border-surface-200 rounded-xl shadow-soft-lg z-50',
          'hidden group-hover:block group-focus-within:block',
          'animate-fade-in'
        )}>
          {/* All sub-companies option */}
          <button
            onClick={() => setSelectedSubCompany('')}
            className={cn(
              'flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-left rounded-t-xl transition-colors',
              !selectedSubCompanyId
                ? 'bg-brand-50 text-brand-700 font-semibold'
                : 'text-surface-700 hover:bg-surface-50'
            )}
          >
            <span className={cn(
              'h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
              !selectedSubCompanyId ? 'bg-brand-600 text-white' : 'bg-surface-100 text-surface-500'
            )}>
              ✦
            </span>
            <div>
              <p className="font-medium">All Sub Companies</p>
              <p className="text-xs opacity-60">{subCompanies.length} branches</p>
            </div>
          </button>

          {subCompanies.length > 0 && (
            <div className="border-t border-surface-100 py-1">
              {subCompanies.map((sc) => {
                const isActive = sc.id === selectedSubCompanyId;
                return (
                  <button
                    key={sc.id}
                    onClick={() => setSelectedSubCompany(sc.id)}
                    className={cn(
                      'flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-left last:rounded-b-xl transition-colors',
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-semibold'
                        : 'text-surface-700 hover:bg-surface-50'
                    )}
                  >
                    <span className={cn(
                      'h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                      isActive ? 'bg-brand-600 text-white' : 'bg-surface-100 text-surface-500'
                    )}>
                      {sc.name.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{sc.name}</p>
                      <p className="text-xs opacity-60 truncate">{sc.employeeCount} employees</p>
                    </div>
                    {isActive && (
                      <svg viewBox="0 0 12 12" className="h-3 w-3 text-brand-600 fill-current ml-auto flex-shrink-0">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
