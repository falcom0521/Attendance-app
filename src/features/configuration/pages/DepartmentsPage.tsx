import { useState } from 'react';
import { Plus, Layers, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { DepartmentFormDialog } from '../components/DepartmentFormDialog';
import {
  useDepartments,
  useDeleteDepartment,
  useToggleDepartmentStatus,
} from '../hooks/useDepartments';
import { useToast } from '@/components/feedback/ToastContext';
import { useAuthStore } from '@/store/authStore';
import { formatDate } from '@/utils/date';
import type { Department } from '@/types/department';

export function DepartmentsPage() {
  const toast = useToast();
  const { user } = useAuthStore();
  const companyId = user?.companyId ?? '';

  const [formOpen, setFormOpen] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [toggleTarget, setToggleTarget] = useState<Department | null>(null);

  const { data: departments = [], isLoading, error, refetch } = useDepartments(companyId);
  const deleteDept = useDeleteDepartment();
  const toggleStatus = useToggleDepartmentStatus();

  function openEdit(dept: Department) {
    setEditDept(dept);
    setFormOpen(true);
  }

  function openCreate() {
    setEditDept(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditDept(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteDept.mutateAsync(deleteTarget.id);
      toast.success('Department deleted', deleteTarget.name);
    } catch (err) {
      toast.error('Delete failed', err instanceof Error ? err.message : undefined);
    } finally {
      setDeleteTarget(null);
    }
  }

  async function handleToggle() {
    if (!toggleTarget) return;
    try {
      await toggleStatus.mutateAsync(toggleTarget.id);
      const next = toggleTarget.status === 'ACTIVE' ? 'deactivated' : 'activated';
      toast.success(`Department ${next}`, toggleTarget.name);
    } catch (err) {
      toast.error('Failed to update status', err instanceof Error ? err.message : undefined);
    } finally {
      setToggleTarget(null);
    }
  }

  const columns: Column<Department>[] = [
    {
      key: 'name',
      header: 'Department',
      sortable: true,
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Layers className="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <p className="font-medium text-surface-900">{row.name}</p>
            {row.description && (
              <p className="text-xs text-surface-400 truncate max-w-xs">{row.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      accessor: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      width: '130px',
      accessor: (row) => (
        <span className="text-sm text-surface-500">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Last Updated',
      sortable: true,
      width: '130px',
      accessor: (row) => (
        <span className="text-sm text-surface-500">{formatDate(row.updatedAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '110px',
      accessor: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(row); }}
            className="p-1.5 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setToggleTarget(row); }}
            className="p-1.5 rounded-lg text-surface-400 hover:text-warning-600 hover:bg-warning-50 transition-colors"
            title={row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          >
            {row.status === 'ACTIVE'
              ? <ToggleRight className="h-4 w-4" />
              : <ToggleLeft className="h-4 w-4" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}
            className="p-1.5 rounded-lg text-surface-400 hover:text-danger-600 hover:bg-danger-50 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const activeCount = departments.filter((d) => d.status === 'ACTIVE').length;

  return (
    <>
      {/* Header row — inline within the config page, no outer page-container */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-surface-500">
            <span className="font-semibold text-surface-900">{activeCount}</span> active
            {departments.length !== activeCount && (
              <> · <span className="font-semibold text-surface-900">{departments.length - activeCount}</span> inactive</>
            )}{' '}
            · shared across all sub-companies
          </p>
        </div>
        <Button
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={openCreate}
        >
          Add Department
        </Button>
      </div>

      <DataTable
        data={departments}
        columns={columns}
        keyExtractor={(r) => r.id}
        loading={isLoading}
        error={error ? 'Failed to load departments' : null}
        onRetry={refetch}
        searchable
        searchPlaceholder="Search departments..."
        emptyState={{
          title: 'No departments yet',
          description:
            'Departments are shared across all sub-companies in your organisation. Add your first one to get started.',
          action: {
            label: 'Add Department',
            onClick: openCreate,
            icon: <Plus className="h-4 w-4" />,
          },
          icon: <Layers className="h-8 w-8" />,
        }}
      />

      <DepartmentFormDialog
        open={formOpen}
        onClose={closeForm}
        department={editDept}
      />

      <ConfirmDialog
        open={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleToggle}
        title={toggleTarget?.status === 'ACTIVE' ? 'Deactivate Department' : 'Activate Department'}
        description={
          toggleTarget?.status === 'ACTIVE'
            ? `Deactivating "${toggleTarget?.name}" will hide it from employee forms and filters. Existing employees assigned to this department are not affected.`
            : `Activate "${toggleTarget?.name}" to make it available in employee forms and filters again.`
        }
        confirmLabel={toggleTarget?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        variant={toggleTarget?.status === 'ACTIVE' ? 'danger' : 'primary'}
        loading={toggleStatus.isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Department"
        description={`Permanently delete "${deleteTarget?.name}"? This cannot be undone. Employees already assigned to this department will retain their current department name.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteDept.isPending}
      />
    </>
  );
}
