import { useState } from 'react';
import { Plus, Timer, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/Button';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { ShiftFormDialog } from '../components/ShiftFormDialog';
import { useShifts, useDeleteShift, useToggleShiftStatus } from '../hooks/useShifts';
import { useToast } from '@/components/feedback/ToastContext';
import { useAuthStore } from '@/store/authStore';
import { useSubCompanyScope } from '@/hooks/useSubCompanyScope';
import type { Shift } from '@/types/shift';

export function ShiftsPage() {
  const toast = useToast();
  const { user } = useAuthStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editShift, setEditShift] = useState<Shift | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Shift | null>(null);
  const [toggleTarget, setToggleTarget] = useState<Shift | null>(null);

  const scope = useSubCompanyScope();
  const { data: shifts, isLoading, error, refetch } = useShifts(scope.subCompanyId, scope.companyId);
  const subName = (id: string) => scope.subCompanies.find((sc) => sc.id === id)?.name ?? '—';
  const deleteShift = useDeleteShift();
  const toggleStatus = useToggleShiftStatus();

  const columns: Column<Shift>[] = [
    {
      key: 'name', header: 'Shift Name',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Timer className="h-4 w-4 text-orange-600" />
          </div>
          <div>
            <p className="font-medium text-surface-900">{row.name}</p>
            {row.isOvernight && <Badge variant="info" size="sm">Overnight</Badge>}
          </div>
        </div>
      ),
    },
    ...(scope.showSubCompany
      ? [{ key: 'subCompany', header: 'Sub Company', accessor: (r: Shift) => <span className="text-sm text-surface-600">{subName(r.subCompanyId)}</span> }]
      : []),
    { key: 'startTime', header: 'Start Time', accessor: (r) => <span className="font-mono font-semibold text-surface-700">{r.startTime}</span>, width: '110px' },
    { key: 'endTime', header: 'End Time', accessor: (r) => <span className="font-mono font-semibold text-surface-700">{r.endTime}</span>, width: '100px' },
    { key: 'breakStartTime', header: 'Break', accessor: (r) => r.breakStartTime ? <span className="text-sm text-surface-500">{r.breakStartTime} – {r.breakEndTime}</span> : <span className="text-surface-300">—</span> },
    { key: 'gracePeriodMinutes', header: 'Grace Period', accessor: (r) => <span className="text-sm">{r.gracePeriodMinutes} min</span>, width: '110px' },
    { key: 'status', header: 'Status', accessor: (r) => <StatusBadge status={r.status} />, width: '100px' },
    {
      key: 'actions', header: 'Actions', width: '110px',
      accessor: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); setEditShift(row); setFormOpen(true); }} className="p-1.5 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"><Pencil className="h-4 w-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); setToggleTarget(row); }} className="p-1.5 rounded-lg text-surface-400 hover:text-warning-600 hover:bg-warning-50 transition-colors">
            {row.status === 'ACTIVE' ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }} className="p-1.5 rounded-lg text-surface-400 hover:text-danger-600 hover:bg-danger-50 transition-colors"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  const role = user?.role === 'ADMIN' ? 'Admin' : 'HR';

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteShift.mutateAsync(deleteTarget.id);
      toast.success('Shift deleted', deleteTarget.name);
    } catch { toast.error('Failed to delete'); }
    finally { setDeleteTarget(null); }
  }

  async function handleToggle() {
    if (!toggleTarget) return;
    try {
      await toggleStatus.mutateAsync(toggleTarget.id);
      toast.success(`Shift ${toggleTarget.status === 'ACTIVE' ? 'deactivated' : 'activated'}`, toggleTarget.name);
    } catch { toast.error('Failed'); }
    finally { setToggleTarget(null); }
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Shift Management"
        subtitle="Configure work shifts and schedules"
        breadcrumbs={[{ label: role }, { label: 'Configuration' }, { label: 'Shifts' }]}
        action={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setEditShift(null); setFormOpen(true); }}>Add Shift</Button>}
      />
      <DataTable
        data={shifts ?? []} columns={columns} keyExtractor={(r) => r.id}
        loading={isLoading} error={error ? 'Failed to load shifts' : null} onRetry={refetch}
        emptyState={{ title: 'No shifts configured', icon: <Timer className="h-8 w-8" />, action: { label: 'Add Shift', onClick: () => setFormOpen(true), icon: <Plus className="h-4 w-4" /> } }}
      />
      <ShiftFormDialog open={formOpen} onClose={() => { setFormOpen(false); setEditShift(null); }} shift={editShift} />
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Shift" description={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete" loading={deleteShift.isPending} />
      <ConfirmDialog open={!!toggleTarget} onClose={() => setToggleTarget(null)} onConfirm={handleToggle}
        title={`${toggleTarget?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} Shift`}
        description={`${toggleTarget?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} "${toggleTarget?.name}"?`}
        confirmLabel={toggleTarget?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        variant={toggleTarget?.status === 'ACTIVE' ? 'danger' : 'primary'} loading={toggleStatus.isPending} />
    </div>
  );
}
