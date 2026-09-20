import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Employee } from '@/types/employee';

interface EmployeeSelectProps {
  employees: Employee[];
  value: string;
  onChange: (id: string) => void;
  error?: string;
  /** Show which sub company each employee belongs to (Admin viewing several). */
  showSubCompany?: boolean;
  label?: string;
}

export function EmployeeSelect({
  employees,
  value,
  onChange,
  error,
  showSubCompany = false,
  label = 'Employee',
}: EmployeeSelectProps) {
  const [search, setSearch] = useState('');
  const selected = employees.find((e) => e.id === value);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.fullName.toLowerCase().includes(q) ||
        e.employeeCode.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q)
    );
  }, [employees, search]);

  return (
    <div>
      <label className="form-label">
        {label} <span className="text-danger-500">*</span>
      </label>

      <div className="relative mb-1.5">
        <input
          type="text"
          placeholder="Search by name, code or department…"
          value={search}
          maxLength={100}
          onChange={(e) => setSearch(e.target.value)}
          className={cn('form-input pr-8 text-sm', error && 'form-input-error')}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      <div className={cn('border rounded-lg overflow-hidden', error ? 'border-danger-400' : 'border-surface-200')}>
        <ul className="max-h-44 overflow-y-auto scrollbar-thin divide-y divide-surface-50">
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-sm text-surface-400 text-center">No employees found</li>
          ) : (
            filtered.map((emp) => {
              const isSelected = emp.id === value;
              return (
                <li key={emp.id}>
                  <button
                    type="button"
                    onClick={() => { onChange(emp.id); setSearch(''); }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                      isSelected ? 'bg-brand-50' : 'hover:bg-surface-50'
                    )}
                  >
                    <span className={cn(
                      'h-7 w-7 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0',
                      isSelected ? 'bg-brand-600 text-white' : 'bg-surface-100 text-surface-600'
                    )}>
                      {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-sm font-medium truncate', isSelected ? 'text-brand-700' : 'text-surface-900')}>
                        {emp.fullName}
                      </p>
                      <p className="text-xs text-surface-400 truncate">
                        {emp.employeeCode} · {emp.department}
                        {showSubCompany && ` · ${emp.subCompanyName}`}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="h-4 w-4 rounded-full bg-brand-600 flex-shrink-0 flex items-center justify-center">
                        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-white fill-current">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    )}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {selected && (
        <div className="mt-1.5 flex items-center gap-1.5 px-2 py-1.5 bg-brand-50 rounded-lg">
          <span className="h-5 w-5 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
            {selected.firstName.charAt(0)}{selected.lastName.charAt(0)}
          </span>
          <span className="text-xs font-medium text-brand-700">{selected.fullName}</span>
          <span className="text-xs text-brand-500">· {selected.shiftName ?? 'No shift'}</span>
        </div>
      )}

      {error && <p className="form-error mt-1">{error}</p>}
    </div>
  );
}
