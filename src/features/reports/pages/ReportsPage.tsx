import { useState, useMemo, useRef, useEffect } from 'react';
import { Download, FileBarChart, FileText, Users, Calendar, Search, X, CheckSquare, Square, ChevronDown, UserCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { pastOrTodayDate, dateField } from '@/lib/validation';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Tabs } from '@/components/ui/Tabs';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/components/feedback/ToastContext';
import { reportService } from '@/services/mock';
import { useAuthStore } from '@/store/authStore';
import { useSubCompanyScope } from '@/hooks/useSubCompanyScope';
import { useEmployees } from '@/features/employees/hooks/useEmployees';
import { useDepartments } from '@/features/configuration/hooks/useDepartments';
import { todayISO, MONTH_OPTIONS, YEAR_OPTIONS, currentMonthYear } from '@/utils/date';
import { cn } from '@/lib/utils';
import type { Employee } from '@/types/employee';
import type { ExportFormat } from '@/types/report';

const TABS = [
  { id: 'daily',    label: 'Daily Report',    icon: <Calendar className="h-4 w-4" /> },
  { id: 'monthly',  label: 'Monthly Report',  icon: <FileText className="h-4 w-4" /> },
  { id: 'employee', label: 'Employee Report', icon: <Users className="h-4 w-4" /> },
  { id: 'multi',    label: 'Multi Employee',  icon: <FileBarChart className="h-4 w-4" /> },
];

const FORMAT_OPTIONS = [
  { label: 'Excel (.xlsx)', value: 'EXCEL' },
  { label: 'PDF',           value: 'PDF'   },
  { label: 'CSV',           value: 'CSV'   },
];

// ── Validation ──────────────────────────────────────────────────────────────
const formatField = z.enum(['EXCEL', 'PDF', 'CSV'], { errorMap: () => ({ message: 'Choose an export format' }) });

/** A report month cannot be in the future. */
function refineNotFutureMonth(v: { month: string; year: string }, ctx: z.RefinementCtx) {
  const { month, year } = currentMonthYear();
  if (Number(v.year) * 12 + Number(v.month) > year * 12 + month) {
    ctx.addIssue({ code: 'custom', path: ['month'], message: 'Cannot generate a report for a future month' });
  }
}

const dailySchema = z.object({
  date: pastOrTodayDate('Date'),
  department: z.string(),
  format: formatField,
});
type DailyForm = z.infer<typeof dailySchema>;

const monthlySchema = z
  .object({
    month: z.string().min(1, 'Select a month'),
    year: z.string().min(1, 'Select a year'),
    department: z.string(),
    format: formatField,
  })
  .superRefine(refineNotFutureMonth);
type MonthlyForm = z.infer<typeof monthlySchema>;

const employeeSchema = z
  .object({
    employeeId: z.string().min(1, 'Select an employee'),
    month: z.string().min(1, 'Select a month'),
    year: z.string().min(1, 'Select a year'),
    format: formatField,
  })
  .superRefine(refineNotFutureMonth);
type EmployeeForm = z.infer<typeof employeeSchema>;

const MAX_RANGE_DAYS = 92;
const MAX_MULTI_EMPLOYEES = 100;

/** Validates the multi-employee report settings; returns field -> message. */
function validateMulti(start: string, end: string, employeeCount: number): { dates?: string; employees?: string } {
  const errors: { dates?: string; employees?: string } = {};
  const startCheck = pastOrTodayDate('From date').safeParse(start);
  const endCheck = pastOrTodayDate('To date').safeParse(end);
  if (!startCheck.success) errors.dates = startCheck.error.issues[0]?.message;
  else if (!endCheck.success) errors.dates = endCheck.error.issues[0]?.message;
  else if (dateField('Date').safeParse(start).success && end < start) errors.dates = 'To date must be on or after the from date';
  else if (differenceInCalendarDays(parseISO(end), parseISO(start)) + 1 > MAX_RANGE_DAYS) {
    errors.dates = `Date range cannot be longer than ${MAX_RANGE_DAYS} days`;
  }
  if (employeeCount === 0) errors.employees = 'Select at least one employee';
  else if (employeeCount > MAX_MULTI_EMPLOYEES) errors.employees = `Select at most ${MAX_MULTI_EMPLOYEES} employees`;
  return errors;
}

// ── Employee combobox ─────────────────────────────────────────────────────
interface EmployeeComboboxProps {
  employees: Employee[];
  value: string;
  onChange: (id: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  filtered: Employee[];
  error?: string;
}

function EmployeeCombobox({
  employees,
  value,
  onChange,
  search,
  onSearchChange,
  filtered,
  error,
}: EmployeeComboboxProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = employees.find((e) => e.id === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(id: string) {
    onChange(id);
    onSearchChange('');
    setOpen(false);
  }

  function handleClear() {
    onChange('');
    onSearchChange('');
  }

  return (
    <div ref={ref} className="relative">
      <p className="form-label">
        Employee <span className="text-danger-500">*</span>
      </p>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm transition-all duration-150',
          'bg-white text-left focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
          open ? 'border-brand-500 ring-2 ring-brand-500' : error ? 'border-danger-400' : 'border-surface-300 hover:border-surface-400',
        )}
      >
        {selected ? (
          <>
            {/* Avatar initial */}
            <span className="h-6 w-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
              {selected.firstName.charAt(0)}{selected.lastName.charAt(0)}
            </span>
            <span className="flex-1 min-w-0">
              <span className="font-medium text-surface-900">{selected.fullName}</span>
              <span className="text-surface-400 ml-2 text-xs">{selected.employeeCode}</span>
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleClear(); }}
              className="text-surface-300 hover:text-surface-600 transition-colors flex-shrink-0"
              aria-label="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <>
            <UserCircle className="h-4 w-4 text-surface-300 flex-shrink-0" />
            <span className="flex-1 text-surface-400">Select an employee…</span>
            <ChevronDown className={cn('h-4 w-4 text-surface-400 transition-transform flex-shrink-0', open && 'rotate-180')} />
          </>
        )}
      </button>

      {error && (
        <p className="form-error mt-1" role="alert">{error}</p>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-surface-200 rounded-xl shadow-soft-lg overflow-hidden animate-slide-down">
          {/* Search */}
          <div className="p-2 border-b border-surface-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-surface-400 pointer-events-none" />
              <input
                autoFocus
                maxLength={100}
                type="text"
                placeholder="Search by name, code or department…"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-surface-50 border border-surface-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-400 focus:border-brand-400 placeholder-surface-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options list */}
          <ul className="max-h-56 overflow-y-auto scrollbar-thin py-1" role="listbox">
            {filtered.length === 0 ? (
              <li className="px-4 py-6 text-center">
                <Search className="h-5 w-5 text-surface-300 mx-auto mb-1.5" />
                <p className="text-sm text-surface-400">No employees match{search ? ` "${search}"` : ''}</p>
              </li>
            ) : (
              filtered.map((emp) => {
                const isSelected = emp.id === value;
                return (
                  <li key={emp.id} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => handleSelect(emp.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                        isSelected
                          ? 'bg-brand-50'
                          : 'hover:bg-surface-50'
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
                        </p>
                      </div>
                      {isSelected && (
                        <span className="h-4 w-4 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
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

          {/* Footer count */}
          {filtered.length > 0 && (
            <div className="px-3 py-2 border-t border-surface-50 bg-surface-50">
              <p className="text-xs text-surface-400">
                {filtered.length} employee{filtered.length !== 1 ? 's' : ''}
                {search ? ' match' : ' total'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── ReportsPage ───────────────────────────────────────────────────────────────
export function ReportsPage() {
  const toast = useToast();
  const { user } = useAuthStore();
  const scope = useSubCompanyScope();
  const [activeTab, setActiveTab] = useState('daily');
  const [generating, setGenerating] = useState('');
  const { month: curMonth, year: curYear } = currentMonthYear();

  // ── Department options ──────────────────────────────────────────
  const { data: departments = [] } = useDepartments(user?.companyId);
  const deptOptions = useMemo(() => [
    { label: 'All Departments', value: '' },
    ...departments
      .filter((d) => d.status === 'ACTIVE')
      .map((d) => ({ label: d.name, value: d.name })),
  ], [departments]);

  // ── Employees ───────────────────────────────────────────────────
  const { data: employeesData } = useEmployees({
    page: 1, pageSize: 200,
    subCompanyId: scope.subCompanyId,
    companyId: scope.companyId,
    status: 'ACTIVE',
  });
  const employees = useMemo(() => employeesData?.data ?? [], [employeesData]);

  // ── Employee Report: search-filtered select ──────────────────────
  const [empSearch, setEmpSearch] = useState('');
  const filteredEmpOptions = useMemo(() => {
    const q = empSearch.toLowerCase();
    return employees.filter(
      (e) =>
        e.fullName.toLowerCase().includes(q) ||
        e.employeeCode.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q)
    );
  }, [employees, empSearch]);

  // ── Multi Employee ──────────────────────────────────────────────
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [multiSearch, setMultiSearch] = useState('');
  const [multiFormat, setMultiFormat] = useState<ExportFormat>('EXCEL');
  const [multiStartDate, setMultiStartDate] = useState(todayISO());
  const [multiEndDate, setMultiEndDate] = useState(todayISO());

  const filteredMultiEmployees = useMemo(() => {
    const q = multiSearch.toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.fullName.toLowerCase().includes(q) ||
        e.employeeCode.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q) ||
        e.designation.toLowerCase().includes(q)
    );
  }, [employees, multiSearch]);

  const allFilteredSelected =
    filteredMultiEmployees.length > 0 &&
    filteredMultiEmployees.every((e) => selectedEmployees.includes(e.id));

  function toggleSelectAll() {
    const ids = filteredMultiEmployees.map((e) => e.id);
    if (allFilteredSelected) {
      setSelectedEmployees((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedEmployees((prev) => Array.from(new Set([...prev, ...ids])));
    }
  }

  // ── React Hook Form ─────────────────────────────────────────────
  const { register: regDaily, handleSubmit: submitDaily, formState: { errors: dailyErrors } } = useForm<DailyForm>({
    resolver: zodResolver(dailySchema), mode: 'onTouched',
    defaultValues: { date: todayISO(), department: '', format: 'EXCEL' },
  });
  const { register: regMonthly, handleSubmit: submitMonthly, formState: { errors: monthlyErrors } } = useForm<MonthlyForm>({
    resolver: zodResolver(monthlySchema), mode: 'onTouched',
    defaultValues: { month: String(curMonth), year: String(curYear), department: '', format: 'EXCEL' },
  });
  const { register: regEmployee, handleSubmit: submitEmployee, watch, setValue, formState: { errors: employeeErrors } } = useForm<EmployeeForm>({
    resolver: zodResolver(employeeSchema), mode: 'onTouched',
    defaultValues: { employeeId: '', month: String(curMonth), year: String(curYear), format: 'EXCEL' },
  });
  const [multiErrors, setMultiErrors] = useState<{ dates?: string; employees?: string }>({});

  // ── Handlers ────────────────────────────────────────────────────
  async function handleDaily(data: DailyForm) {
    setGenerating('daily');
    try {
      await reportService.exportDailyReport(data.date, {}, data.format as ExportFormat);
      toast.success('Daily report exported', `${data.format} file ready`);
    } catch { toast.error('Export failed'); }
    finally { setGenerating(''); }
  }

  async function handleMonthly(data: MonthlyForm) {
    setGenerating('monthly');
    try {
      await reportService.exportMonthlyReport(Number(data.month), Number(data.year), {}, data.format as ExportFormat);
      toast.success('Monthly report exported');
    } catch { toast.error('Export failed'); }
    finally { setGenerating(''); }
  }

  async function handleEmployee(data: EmployeeForm) {
    setGenerating('employee');
    try {
      await reportService.generateReport({
        type: 'EMPLOYEE',
        employeeIds: [data.employeeId],
        month: Number(data.month),
        year: Number(data.year),
        format: data.format as ExportFormat,
      });
      toast.success('Employee report generated');
    } catch { toast.error('Export failed'); }
    finally { setGenerating(''); }
  }

  async function handleMulti() {
    const found = validateMulti(multiStartDate, multiEndDate, selectedEmployees.length);
    setMultiErrors(found);
    if (found.dates || found.employees) return;
    setGenerating('multi');
    try {
      await reportService.generateReport({
        type: 'MULTI_EMPLOYEE',
        employeeIds: selectedEmployees,
        startDate: multiStartDate,
        endDate: multiEndDate,
        format: multiFormat,
      });
      toast.success(`Report generated for ${selectedEmployees.length} employee${selectedEmployees.length > 1 ? 's' : ''}`);
    } catch { toast.error('Export failed'); }
    finally { setGenerating(''); }
  }

  const role = user?.role === 'ADMIN' ? 'Admin' : 'HR';

  return (
    <div className="page-container">
      <PageHeader
        title="Reports"
        subtitle="Generate and export attendance reports"
        breadcrumbs={[{ label: role }, { label: 'Reports' }]}
      />

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} className="mb-4" />

      {/* ── Daily ──────────────────────────────────────────────────── */}
      {activeTab === 'daily' && (
        <Card>
          <CardHeader
            title="Daily Attendance Report"
            subtitle="Generate attendance report for a specific date"
          />
          <CardBody>
            <form noValidate onSubmit={submitDaily(handleDaily)} className="space-y-4 max-w-md">
              <Input label="Date" type="date" required max={todayISO()} error={dailyErrors.date?.message} {...regDaily('date')} />
              <Select label="Department" options={deptOptions} {...regDaily('department')} />
              <Select label="Export Format" options={FORMAT_OPTIONS} {...regDaily('format')} />
              <Button type="submit" leftIcon={<Download className="h-4 w-4" />} loading={generating === 'daily'}>
                Export Report
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      {/* ── Monthly ────────────────────────────────────────────────── */}
      {activeTab === 'monthly' && (
        <Card>
          <CardHeader
            title="Monthly Attendance Report"
            subtitle="Generate attendance report for a full month"
          />
          <CardBody>
            <form noValidate onSubmit={submitMonthly(handleMonthly)} className="space-y-4 max-w-md">
              <div className="grid grid-cols-2 gap-4">
                <Select label="Month" options={MONTH_OPTIONS} required error={monthlyErrors.month?.message} {...regMonthly('month')} />
                <Select label="Year"  options={YEAR_OPTIONS}  required error={monthlyErrors.year?.message} {...regMonthly('year')} />
              </div>
              <Select label="Department" options={deptOptions} {...regMonthly('department')} />
              <Select label="Export Format" options={FORMAT_OPTIONS} {...regMonthly('format')} />
              <Button type="submit" leftIcon={<Download className="h-4 w-4" />} loading={generating === 'monthly'}>
                Export Report
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      {/* ── Employee ───────────────────────────────────────────────── */}
      {activeTab === 'employee' && (
        <Card>
          <CardHeader
            title="Employee Report"
            subtitle="Individual employee attendance report"
          />
          <CardBody>
            <form noValidate onSubmit={submitEmployee(handleEmployee)} className="space-y-4 max-w-md">

              {/* Searchable employee combobox */}
              <EmployeeCombobox
                employees={employees}
                value={watch('employeeId')}
                onChange={(id) => setValue('employeeId', id, { shouldValidate: true })}
                search={empSearch}
                onSearchChange={setEmpSearch}
                filtered={filteredEmpOptions}
                error={employeeErrors.employeeId?.message}
              />

              <div className="grid grid-cols-2 gap-4">
                <Select label="Month" options={MONTH_OPTIONS} required error={employeeErrors.month?.message} {...regEmployee('month')} />
                <Select label="Year"  options={YEAR_OPTIONS}  required error={employeeErrors.year?.message} {...regEmployee('year')} />
              </div>
              <Select label="Export Format" options={FORMAT_OPTIONS} {...regEmployee('format')} />
              <Button type="submit" leftIcon={<Download className="h-4 w-4" />} loading={generating === 'employee'}>
                Export Report
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      {/* ── Multi Employee ─────────────────────────────────────────── */}
      {activeTab === 'multi' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Employee selection panel */}
          <Card>
            <CardHeader
              title="Select Employees"
              subtitle={
                selectedEmployees.length > 0
                  ? `${selectedEmployees.length} of ${employees.length} selected`
                  : `${employees.length} employees`
              }
              action={
                selectedEmployees.length > 0 && (
                  <button
                    onClick={() => setSelectedEmployees([])}
                    className="text-xs text-danger-500 hover:text-danger-700 font-medium transition-colors"
                  >
                    Clear all
                  </button>
                )
              }
            />
            <CardBody className="p-0">
              {/* Search bar */}
              <div className="px-4 pt-3 pb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-surface-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by name, code, department…"
                    value={multiSearch}
                    onChange={(e) => setMultiSearch(e.target.value)}
                    className="form-input pl-8 text-sm h-8 w-full"
                  />
                  {multiSearch && (
                    <button
                      type="button"
                      onClick={() => setMultiSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                      aria-label="Clear search"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Select-all row */}
              {filteredMultiEmployees.length > 0 && (
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-3 w-full px-4 py-2 text-xs font-semibold text-surface-500 hover:bg-surface-50 border-b border-surface-100 transition-colors"
                >
                  {allFilteredSelected
                    ? <CheckSquare className="h-4 w-4 text-brand-600 flex-shrink-0" />
                    : <Square className="h-4 w-4 text-surface-300 flex-shrink-0" />}
                  {allFilteredSelected
                    ? `Deselect all ${filteredMultiEmployees.length} shown`
                    : `Select all ${filteredMultiEmployees.length} shown`}
                </button>
              )}

              {/* Employee list */}
              <div className="max-h-72 overflow-y-auto scrollbar-thin">
                {filteredMultiEmployees.length === 0 ? (
                  <div className="py-10 text-center">
                    <Search className="h-6 w-6 text-surface-300 mx-auto mb-2" />
                    <p className="text-sm text-surface-400">
                      No employees match{multiSearch ? ` "${multiSearch}"` : ''}
                    </p>
                  </div>
                ) : (
                  filteredMultiEmployees.map((emp) => {
                    const checked = selectedEmployees.includes(emp.id);
                    return (
                      <label
                        key={emp.id}
                        className={cn(
                          'flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors',
                          checked ? 'bg-brand-50' : 'hover:bg-surface-50'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedEmployees((p) => [...p, emp.id]);
                            else setSelectedEmployees((p) => p.filter((id) => id !== emp.id));
                          }}
                          className="rounded border-surface-300 text-brand-600 focus:ring-brand-500 flex-shrink-0"
                        />
                        <Avatar name={emp.fullName} size="xs" />
                        <div className="min-w-0">
                          <p className={cn('text-sm font-medium truncate', checked ? 'text-brand-700' : 'text-surface-900')}>
                            {emp.fullName}
                          </p>
                          <p className="text-xs text-surface-400 truncate">
                            {emp.department} · {emp.employeeCode}
                          </p>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>

              {/* Footer count */}
              {selectedEmployees.length > 0 && (
                <div className="px-4 py-2.5 border-t border-surface-100 bg-brand-50">
                  <p className="text-xs font-medium text-brand-700">
                    {selectedEmployees.length} employee{selectedEmployees.length > 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Settings panel */}
          <Card>
            <CardHeader title="Report Settings" subtitle="Configure date range and export format" />
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="From Date"
                  type="date"
                  required
                  max={todayISO()}
                  value={multiStartDate}
                  onChange={(e) => { setMultiStartDate(e.target.value); setMultiErrors((m) => ({ ...m, dates: undefined })); }}
                />
                <Input
                  label="To Date"
                  type="date"
                  required
                  min={multiStartDate || undefined}
                  max={todayISO()}
                  value={multiEndDate}
                  onChange={(e) => { setMultiEndDate(e.target.value); setMultiErrors((m) => ({ ...m, dates: undefined })); }}
                />
              </div>
              {multiErrors.dates && <p className="form-error -mt-2" role="alert">{multiErrors.dates}</p>}
              <Select
                label="Export Format"
                options={FORMAT_OPTIONS}
                value={multiFormat}
                onChange={(e) => setMultiFormat(e.target.value as ExportFormat)}
              />

              {/* Selected employee chips */}
              {selectedEmployees.length > 0 && (
                <div>
                  <p className="form-label">Selected</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEmployees.slice(0, 8).map((id) => {
                      const emp = employees.find((e) => e.id === id);
                      if (!emp) return null;
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-brand-50 text-brand-700 text-xs font-medium rounded-lg ring-1 ring-brand-200"
                        >
                          {emp.firstName}
                          <button
                            type="button"
                            onClick={() => setSelectedEmployees((p) => p.filter((i) => i !== id))}
                            className="text-brand-400 hover:text-brand-700 transition-colors"
                            aria-label={`Remove ${emp.fullName}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                    {selectedEmployees.length > 8 && (
                      <span className="inline-flex items-center px-2 py-1 bg-surface-100 text-surface-600 text-xs font-medium rounded-lg">
                        +{selectedEmployees.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <Button
                  onClick={handleMulti}
                  leftIcon={<Download className="h-4 w-4" />}
                  loading={generating === 'multi'}
                  className="w-full"
                >
                  {selectedEmployees.length === 0
                    ? 'Generate Report'
                    : `Generate Report (${selectedEmployees.length} employee${selectedEmployees.length > 1 ? 's' : ''})`}
                </Button>
                {multiErrors.employees && <p className="form-error mt-2 text-center" role="alert">{multiErrors.employees}</p>}
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
