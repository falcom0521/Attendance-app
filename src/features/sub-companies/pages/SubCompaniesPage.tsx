import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, GitBranch, Eye, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { useSubCompanies, useToggleSubCompanyStatus } from '@/features/companies/hooks/useCompanies';
import { SubCompanyFormDialog } from '../components/SubCompanyFormDialog';
import { useToast } from '@/components/feedback/ToastContext';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/config/permissions';
import type { SubCompany } from '@/types/company';
import { formatDate } from '@/utils/date';
import type { SortDir } from '@/lib/sort';

const STATUS_OPTIONS = [
  { label: 'All Status', value: '' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];

export function SubCompaniesPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canCreate = !!user && hasPermission(user.role, 'subCompanies:create');
  const canUpdate = !!user && hasPermission(user.role, 'subCompanies:update');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editSub, setEditSub] = useState<SubCompany | null>(null);
  const [toggleTarget, setToggleTarget] = useState<SubCompany | null>(null);

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir | null>(null);

  const { data, isLoading, error, refetch } = useSubCompanies({
    page, pageSize: 10,
    search: search || undefined,
    status: (status as 'ACTIVE' | 'INACTIVE') || undefined,
    sortBy: sortKey ?? undefined,
    sortDir: sortDir ?? undefined,
  });
  const toggleStatus = useToggleSubCompanyStatus();

  const columns: Column<SubCompany>[] = [
    {
      key: 'name', header: 'Sub Company', sortable: true, sortValue: (r) => r.name,
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <GitBranch className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-surface-900">{row.name}</p>
            <p className="text-xs text-surface-400">{row.code}</p>
          </div>
        </div>
      ),
    },
    { key: 'companyName', header: 'Parent Company', sortable: true, sortValue: (r) => r.companyName, accessor: (r) => <span className="text-sm">{r.companyName}</span> },
    { key: 'location', header: 'Location', accessor: (r) => <span className="text-sm text-surface-600">{[r.city, r.state].filter(Boolean).join(', ') || '—'}</span> },
    { key: 'employeeCount', header: 'Employees', sortable: true, sortValue: (r) => r.employeeCount, accessor: (r) => <span className="font-medium">{r.employeeCount}</span>, width: '100px' },
    { key: 'deviceCount', header: 'Devices', sortable: true, sortValue: (r) => r.deviceCount, accessor: (r) => <span className="font-medium">{r.deviceCount}</span>, width: '80px' },
    { key: 'hrCount', header: 'HR Users', sortable: true, sortValue: (r) => r.hrCount, accessor: (r) => <span className="font-medium">{r.hrCount}</span>, width: '90px' },
    { key: 'status', header: 'Status', sortable: true, sortValue: (r) => r.status, accessor: (r) => <StatusBadge status={r.status} />, width: '100px' },
    { key: 'createdAt', header: 'Created', sortable: true, sortValue: (r) => r.createdAt, accessor: (r) => formatDate(r.createdAt), width: '120px' },
    {
      key: 'actions', header: 'Actions', width: '110px',
      accessor: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); navigate(`/super-admin/sub-companies/${row.id}`); }} className="p-1.5 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-colors" title="View details">
            <Eye className="h-4 w-4" />
          </button>
          {canUpdate && (<>
          <button onClick={(e) => { e.stopPropagation(); setEditSub(row); setFormOpen(true); }}
            className="p-1.5 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-colors" title="Edit">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setToggleTarget(row); }}
            className="p-1.5 rounded-lg text-surface-400 hover:text-warning-600 hover:bg-warning-50 transition-colors"
            title={row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}>
            {row.status === 'ACTIVE' ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
          </button>
          </>)}
        </div>
      ),
    },
  ];

  async function handleToggle() {
    if (!toggleTarget) return;
    try {
      await toggleStatus.mutateAsync(toggleTarget.id);
      toast.success(`Sub company ${toggleTarget.status === 'ACTIVE' ? 'deactivated' : 'activated'}`, toggleTarget.name);
    } catch { toast.error('Failed to update status'); }
    finally { setToggleTarget(null); }
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Sub Companies"
        subtitle="Manage all branch offices and sub companies"
        breadcrumbs={[{ label: 'Super Admin' }, { label: 'Sub Companies' }]}
        action={canCreate && <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setEditSub(null); setFormOpen(true); }}>Add Sub Company</Button>}
      />
      <div className="flex flex-wrap gap-3">
        <div className="w-40">
          <Select options={STATUS_OPTIONS} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} />
        </div>
      </div>
      <DataTable
        data={data?.data ?? []} columns={columns} keyExtractor={(r) => r.id}
        loading={isLoading} error={error ? 'Failed to load sub companies' : null} onRetry={refetch}
        searchable searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search sub companies..."
        onRowClick={(row) => navigate(`/super-admin/sub-companies/${row.id}`)}
        sortKey={sortKey}
        sortDir={sortDir}
        onSortChange={(key, dir) => { setSortKey(key); setSortDir(dir); setPage(1); }}
        pagination={data ? { page, totalPages: data.totalPages, total: data.total, pageSize: data.pageSize, onPageChange: setPage } : undefined}
        emptyState={{ title: 'No sub companies found', icon: <GitBranch className="h-8 w-8" />, action: canCreate ? { label: 'Add Sub Company', onClick: () => setFormOpen(true), icon: <Plus className="h-4 w-4" /> } : undefined }}
      />
      <SubCompanyFormDialog open={formOpen} onClose={() => { setFormOpen(false); setEditSub(null); }} subCompany={editSub} />
      <ConfirmDialog open={!!toggleTarget} onClose={() => setToggleTarget(null)} onConfirm={handleToggle}
        title={toggleTarget?.status === 'ACTIVE' ? 'Deactivate Sub Company' : 'Activate Sub Company'}
        description={`Are you sure you want to ${toggleTarget?.status === 'ACTIVE' ? 'deactivate' : 'activate'} "${toggleTarget?.name}"?`}
        confirmLabel={toggleTarget?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        variant={toggleTarget?.status === 'ACTIVE' ? 'danger' : 'primary'} loading={toggleStatus.isPending} />
    </div>
  );
}
