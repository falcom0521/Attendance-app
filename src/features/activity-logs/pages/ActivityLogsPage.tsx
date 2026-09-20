import { useState } from 'react';
import { Activity } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useActivityLogs } from '../hooks/useActivityLogs';
import { ActivityLogTable } from '../components/ActivityLogTable';
import { useCompanies } from '@/features/companies/hooks/useCompanies';

const MODULE_OPTIONS = [
  'Companies', 'Sub Companies', 'Devices', 'Users', 'Employees', 'Shifts', 'Holidays',
  'Attendance', 'Requests', 'Configuration',
].map((m) => ({ label: m, value: m }));

const ACTION_OPTIONS = [
  'CREATED', 'UPDATED', 'DELETED', 'ACTIVATED', 'DEACTIVATED', 'ALLOCATED', 'DEALLOCATED', 'APPROVED', 'REJECTED', 'CANCELLED',
].map((a) => ({ label: a.charAt(0) + a.slice(1).toLowerCase(), value: a }));

const ROLE_OPTIONS = [
  { label: 'Super Admin', value: 'SUPER_ADMIN' },
  { label: 'Super Admin (Read-only)', value: 'SUPER_ADMIN_VIEWER' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'HR', value: 'HR' },
];

const all = (label: string, opts: { label: string; value: string }[]) => [{ label, value: '' }, ...opts];

export function ActivityLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [module, setModule] = useState('');
  const [action, setAction] = useState('');
  const [role, setRole] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const rangeError = startDate && endDate && startDate > endDate ? 'From date must be on or before the To date' : '';
  const { data: companies } = useCompanies({ page: 1, pageSize: 100 });
  const { data, isLoading, error, refetch } = useActivityLogs({
    page, pageSize: 15,
    search: search || undefined,
    module: module || undefined,
    action: action || undefined,
    role: role || undefined,
    companyId: companyId || undefined,
    // An impossible range is not sent to the server; the message below explains why nothing changed.
    startDate: rangeError ? undefined : startDate || undefined,
    endDate: rangeError ? undefined : endDate || undefined,
  });

  const filtered = !!(search || module || action || role || companyId || startDate || endDate);
  const reset = () => { setSearch(''); setModule(''); setAction(''); setRole(''); setCompanyId(''); setStartDate(''); setEndDate(''); setPage(1); };
  const on = (setter: (v: string) => void) => (v: string) => { setter(v); setPage(1); };

  return (
    <div className="page-container">
      <PageHeader
        title="Activity Logs"
        subtitle="Complete audit trail of all platform actions"
        breadcrumbs={[{ label: 'Super Admin' }, { label: 'Activity Logs' }]}
        action={<Activity className="h-5 w-5 text-surface-400" />}
      />
      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-44"><Select label="Module" options={all('All Modules', MODULE_OPTIONS)} value={module} onChange={(e) => on(setModule)(e.target.value)} /></div>
        <div className="w-40"><Select label="Action" options={all('All Actions', ACTION_OPTIONS)} value={action} onChange={(e) => on(setAction)(e.target.value)} /></div>
        <div className="w-40"><Select label="User role" options={all('All Roles', ROLE_OPTIONS)} value={role} onChange={(e) => on(setRole)(e.target.value)} /></div>
        <div className="w-56">
          <Select label="Company" options={all('All Companies', (companies?.data ?? []).map((c) => ({ label: c.name, value: c.id })))} value={companyId} onChange={(e) => on(setCompanyId)(e.target.value)} />
        </div>
        <div className="w-40"><Input label="From" type="date" value={startDate} max={endDate || undefined} onChange={(e) => on(setStartDate)(e.target.value)} /></div>
        <div className="w-40"><Input label="To" type="date" value={endDate} min={startDate || undefined} onChange={(e) => on(setEndDate)(e.target.value)} /></div>
        {filtered && <Button variant="ghost" size="sm" onClick={reset}>Clear filters</Button>}
      </div>
      {rangeError && <p className="form-error -mt-2" role="alert">{rangeError}</p>}
      <ActivityLogTable
        logs={data?.data ?? []}
        loading={isLoading && !data}
        error={!!error}
        onRetry={refetch}
        search={{ value: search, onChange: on(setSearch) }}
        pagination={data ? { page, totalPages: data.totalPages, total: data.total, pageSize: data.pageSize, onPageChange: setPage } : undefined}
      />
    </div>
  );
}
