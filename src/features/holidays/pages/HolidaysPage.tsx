import { useState } from 'react';
import { Plus, CalendarDays, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { HolidayFormDialog } from '../components/HolidayFormDialog';
import { useHolidays, useDeleteHoliday } from '../hooks/useHolidays';
import { useToast } from '@/components/feedback/ToastContext';
import { useAuthStore } from '@/store/authStore';
import { useSubCompanyScope } from '@/hooks/useSubCompanyScope';
import type { Holiday } from '@/types/holiday';
import { formatDate, YEAR_OPTIONS } from '@/utils/date';

export function HolidaysPage() {
  const toast = useToast();
  const { user } = useAuthStore();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [formOpen, setFormOpen] = useState(false);
  const [editHoliday, setEditHoliday] = useState<Holiday | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Holiday | null>(null);

  const scope = useSubCompanyScope();
  const { data: holidays, isLoading, error, refetch } = useHolidays(scope.subCompanyId, year, scope.companyId);
  const subName = (id: string) => scope.subCompanies.find((sc) => sc.id === id)?.name ?? '—';
  const deleteHoliday = useDeleteHoliday();

  const columns: Column<Holiday>[] = [
    {
      key: 'name', header: 'Holiday',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <CalendarDays className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <p className="font-medium text-surface-900">{row.name}</p>
            {row.description && <p className="text-xs text-surface-400">{row.description}</p>}
          </div>
        </div>
      ),
    },
    ...(scope.showSubCompany
      ? [{ key: 'subCompany', header: 'Sub Company', accessor: (r: Holiday) => <span className="text-sm text-surface-600">{subName(r.subCompanyId)}</span> }]
      : []),
    { key: 'date', header: 'Date', sortable: true, accessor: (r) => formatDate(r.date, 'dd MMM yyyy (EEEE)'), width: '200px' },
    { key: 'status', header: 'Status', accessor: (r) => <StatusBadge status={r.status} />, width: '100px' },
    {
      key: 'actions', header: 'Actions', width: '90px',
      accessor: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => { setEditHoliday(row); setFormOpen(true); }} className="p-1.5 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => setDeleteTarget(row)} className="p-1.5 rounded-lg text-surface-400 hover:text-danger-600 hover:bg-danger-50 transition-colors"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteHoliday.mutateAsync(deleteTarget.id);
      toast.success('Holiday deleted', deleteTarget.name);
    } catch { toast.error('Failed'); }
    finally { setDeleteTarget(null); }
  }

  const role = user?.role === 'ADMIN' ? 'Admin' : 'HR';

  return (
    <div className="page-container">
      <PageHeader
        title="Public Holidays"
        subtitle="Manage official public holidays for the year"
        breadcrumbs={[{ label: role }, { label: 'Configuration' }, { label: 'Holidays' }]}
        action={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setEditHoliday(null); setFormOpen(true); }}>Add Holiday</Button>}
      />
      <div className="flex flex-wrap gap-3">
        <div className="w-36">
          <Select
            options={YEAR_OPTIONS}
            value={String(year)}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </div>
      </div>
      <DataTable
        data={holidays ?? []} columns={columns} keyExtractor={(r) => r.id}
        loading={isLoading} error={error ? 'Failed to load holidays' : null} onRetry={refetch}
        emptyState={{ title: `No holidays for ${year}`, icon: <CalendarDays className="h-8 w-8" />, action: { label: 'Add Holiday', onClick: () => setFormOpen(true), icon: <Plus className="h-4 w-4" /> } }}
      />
      <HolidayFormDialog open={formOpen} onClose={() => { setFormOpen(false); setEditHoliday(null); }} holiday={editHoliday} />
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Holiday" description={`Delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete" loading={deleteHoliday.isPending} />
    </div>
  );
}
