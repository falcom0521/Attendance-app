import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, Eye, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { useCompanies, useToggleCompanyStatus } from '../hooks/useCompanies';
import { CompanyFormDialog } from '../components/CompanyFormDialog';
import { useToast } from '@/components/feedback/ToastContext';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/config/permissions';
import type { Company } from '@/types/company';
import { formatDate } from '@/utils/date';

const STATUS_OPTIONS = [
  { label: 'All Status', value: '' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];

export function CompaniesPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canCreate = !!user && hasPermission(user.role, 'companies:create');
  const canUpdate = !!user && hasPermission(user.role, 'companies:update');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [toggleTarget, setToggleTarget] = useState<Company | null>(null);

  const { data, isLoading, error, refetch } = useCompanies({
    page,
    pageSize: 10,
    search: search || undefined,
    status: (status as 'ACTIVE' | 'INACTIVE') || undefined,
  });

  const toggleStatus = useToggleCompanyStatus();

  const columns: Column<Company>[] = [
    {
      key: 'name',
      header: 'Company',
      sortable: true,
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="h-4 w-4 text-brand-600" />
          </div>
          <div>
            <p className="font-medium text-surface-900">{row.name}</p>
            <p className="text-xs text-surface-400">{row.code}</p>
          </div>
        </div>
      ),
    },
    { key: 'location', header: 'Location', accessor: (r) => <span className="text-sm text-surface-600">{[r.city, r.state].filter(Boolean).join(', ') || '—'}</span> },
    { key: 'subCompanyCount', header: 'Sub Companies', accessor: (r) => <span className="font-medium">{r.subCompanyCount}</span>, width: '120px' },
    { key: 'deviceCount', header: 'Devices', accessor: (r) => <span className="font-medium">{r.deviceCount}</span>, width: '80px' },
    { key: 'employeeCount', header: 'Employees', accessor: (r) => <span className="font-medium">{r.employeeCount}</span>, width: '100px' },
    { key: 'status', header: 'Status', accessor: (r) => <StatusBadge status={r.status} />, width: '100px' },
    { key: 'createdAt', header: 'Created', sortable: true, accessor: (r) => formatDate(r.createdAt), width: '130px' },
    {
      key: 'actions',
      header: 'Actions',
      width: '120px',
      accessor: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); navigate(`/super-admin/companies/${row.id}`); }} className="p-1.5 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-colors" title="View details">
            <Eye className="h-4 w-4" />
          </button>
          {canUpdate && (<>
          <button
            onClick={(e) => { e.stopPropagation(); setEditCompany(row); setFormOpen(true); }}
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
            {row.status === 'ACTIVE' ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
          </button>
          </>)}
        </div>
      ),
    },
  ];

  async function handleToggleStatus() {
    if (!toggleTarget) return;
    try {
      await toggleStatus.mutateAsync(toggleTarget.id);
      toast.success(
        `Company ${toggleTarget.status === 'ACTIVE' ? 'deactivated' : 'activated'}`,
        toggleTarget.name
      );
    } catch {
      toast.error('Failed to update status');
    } finally {
      setToggleTarget(null);
    }
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Companies"
        subtitle="Manage all registered companies on the platform"
        breadcrumbs={[{ label: 'Super Admin' }, { label: 'Companies' }]}
        action={
          canCreate && <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => { setEditCompany(null); setFormOpen(true); }}
          >
            Add Company
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="w-40">
          <Select
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <DataTable
        data={data?.data ?? []}
        columns={columns}
        keyExtractor={(r) => r.id}
        loading={isLoading}
        error={error ? 'Failed to load companies' : null}
        onRetry={refetch}
        searchable
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search companies..."
        onRowClick={(row) => navigate(`/super-admin/companies/${row.id}`)}
        pagination={data ? {
          page,
          totalPages: data.totalPages,
          total: data.total,
          pageSize: data.pageSize,
          onPageChange: setPage,
        } : undefined}
        emptyState={{
          title: 'No companies found',
          description: 'Get started by adding your first company.',
          action: canCreate ? { label: 'Add Company', onClick: () => setFormOpen(true), icon: <Plus className="h-4 w-4" /> } : undefined,
          icon: <Building2 className="h-8 w-8" />,
        }}
      />

      <CompanyFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditCompany(null); }}
        company={editCompany}
      />

      <ConfirmDialog
        open={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleToggleStatus}
        title={toggleTarget?.status === 'ACTIVE' ? 'Deactivate Company' : 'Activate Company'}
        description={`Are you sure you want to ${toggleTarget?.status === 'ACTIVE' ? 'deactivate' : 'activate'} "${toggleTarget?.name}"?`}
        confirmLabel={toggleTarget?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        variant={toggleTarget?.status === 'ACTIVE' ? 'danger' : 'primary'}
        loading={toggleStatus.isPending}
      />
    </div>
  );
}
