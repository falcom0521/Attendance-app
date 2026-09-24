import { useState } from 'react';
import { Plus, Users, Eye, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { useEmployees, useToggleEmployeeStatus } from '../hooks/useEmployees';
import { EmployeeFormDialog } from '../components/EmployeeFormDialog';
import { useToast } from '@/components/feedback/ToastContext';
import { useAuthStore } from '@/store/authStore';
import { useSubCompanyScope } from '@/hooks/useSubCompanyScope';
import { useDepartments } from '@/features/configuration/hooks/useDepartments';
import type { Employee } from '@/types/employee';
import { formatDate } from '@/utils/date';
import type { SortDir } from '@/lib/sort';

const STATUS_OPTIONS = [
  { label: 'All Status', value: '' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];

export function EmployeesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuthStore();
  const scope = useSubCompanyScope();
  const { data: departments = [] } = useDepartments(user?.companyId);

  const deptOptions = [
    { label: 'All Departments', value: '' },
    ...departments
      .filter((d) => d.status === 'ACTIVE')
      .map((d) => ({ label: d.name, value: d.name })),
  ];
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [department, setDepartment] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editEmp, setEditEmp] = useState<Employee | null>(null);
  const [toggleTarget, setToggleTarget] = useState<Employee | null>(null);

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir | null>(null);

  const { data, isLoading, error, refetch } = useEmployees({
    page, pageSize: 12,
    search: search || undefined,
    status: (status as 'ACTIVE' | 'INACTIVE') || undefined,
    department: department || undefined,
    subCompanyId: scope.subCompanyId,
    companyId: scope.companyId,
    sortBy: sortKey ?? undefined,
    sortDir: sortDir ?? undefined,
  });

  const toggleStatus = useToggleEmployeeStatus();

  const basePath = scope.basePath;

  const columns: Column<Employee>[] = [
    {
      key: 'fullName', header: 'Employee', sortable: true, sortValue: (r) => r.fullName,
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.fullName} size="sm" />
          <div>
            <p className="font-medium text-surface-900">{row.fullName}</p>
            <p className="text-xs text-surface-400">{row.employeeCode}</p>
          </div>
        </div>
      ),
    },
    ...(scope.showSubCompany
      ? [{ key: 'subCompanyName', header: 'Sub Company', sortable: true, sortValue: (r: Employee) => r.subCompanyName, accessor: (r: Employee) => <span className="text-sm text-surface-600">{r.subCompanyName}</span> }]
      : []),
    { key: 'department', header: 'Department', sortable: true, sortValue: (r) => r.department, accessor: (r) => <span className="text-sm">{r.department}</span> },
    { key: 'designation', header: 'Designation', sortable: true, sortValue: (r) => r.designation, accessor: (r) => <span className="text-sm text-surface-600">{r.designation}</span> },
    { key: 'shiftName', header: 'Shift', sortable: true, sortValue: (r) => r.shiftName, accessor: (r) => r.shiftName ? <span className="text-sm">{r.shiftName}</span> : <span className="text-surface-400 text-sm">—</span> },
    { key: 'joiningDate', header: 'Joining Date', sortable: true, sortValue: (r) => r.joiningDate, accessor: (r) => formatDate(r.joiningDate), width: '120px' },
    { key: 'status', header: 'Status', sortable: true, sortValue: (r) => r.status, accessor: (r) => <StatusBadge status={r.status} />, width: '100px' },
    {
      key: 'actions', header: 'Actions', width: '110px',
      accessor: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); navigate(`${basePath}/employees/${row.id}`); }}
            className="p-1.5 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"><Eye className="h-4 w-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); setEditEmp(row); setFormOpen(true); }}
            className="p-1.5 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"><Pencil className="h-4 w-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); setToggleTarget(row); }}
            className="p-1.5 rounded-lg text-surface-400 hover:text-warning-600 hover:bg-warning-50 transition-colors">
            {row.status === 'ACTIVE' ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
          </button>
        </div>
      ),
    },
  ];

  async function handleToggle() {
    if (!toggleTarget) return;
    try {
      await toggleStatus.mutateAsync(toggleTarget.id);
      toast.success(`Employee ${toggleTarget.status === 'ACTIVE' ? 'deactivated' : 'activated'}`, toggleTarget.fullName);
    } catch { toast.error('Failed'); }
    finally { setToggleTarget(null); }
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Employees"
        subtitle="Manage employee records and assignments"
        breadcrumbs={[{ label: user?.role === 'ADMIN' ? 'Admin' : 'HR' }, { label: 'Employees' }]}
        action={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setEditEmp(null); setFormOpen(true); }}>Add Employee</Button>}
      />
      <div className="flex flex-wrap gap-3">
        <div className="w-40">
          <Select options={STATUS_OPTIONS} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} />
        </div>
        <div className="w-48">
          <Select options={deptOptions} value={department} onChange={(e) => { setDepartment(e.target.value); setPage(1); }} />
        </div>
      </div>
      <DataTable
        data={data?.data ?? []} columns={columns} keyExtractor={(r) => r.id}
        loading={isLoading} error={error ? 'Failed to load employees' : null} onRetry={refetch}
        searchable searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search employees..."
        pagination={data ? { page, totalPages: data.totalPages, total: data.total, pageSize: data.pageSize, onPageChange: setPage } : undefined}
        sortKey={sortKey}
        sortDir={sortDir}
        onSortChange={(key, dir) => { setSortKey(key); setSortDir(dir); setPage(1); }}
        onRowClick={(row) => navigate(`${basePath}/employees/${row.id}`)}
        emptyState={{ title: 'No employees found', icon: <Users className="h-8 w-8" />, action: { label: 'Add Employee', onClick: () => setFormOpen(true), icon: <Plus className="h-4 w-4" /> } }}
      />
      <EmployeeFormDialog open={formOpen} onClose={() => { setFormOpen(false); setEditEmp(null); }} employee={editEmp} />
      <ConfirmDialog open={!!toggleTarget} onClose={() => setToggleTarget(null)} onConfirm={handleToggle}
        title={`${toggleTarget?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} Employee`}
        description={`Update status for "${toggleTarget?.fullName}"?`}
        confirmLabel={toggleTarget?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        variant={toggleTarget?.status === 'ACTIVE' ? 'danger' : 'primary'} loading={toggleStatus.isPending} />
    </div>
  );
}
