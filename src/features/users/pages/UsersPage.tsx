import { useState } from 'react';
import { Plus, UserCog, ToggleLeft, ToggleRight, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { useUsers, useToggleUserStatus } from '../hooks/useUsers';
import { UserFormDialog } from '../components/UserFormDialog';
import { UserDetailDialog } from '../components/UserDetailDialog';
import { useToast } from '@/components/feedback/ToastContext';
import { useAuthStore } from '@/store/authStore';
import { useCompanies } from '@/features/companies/hooks/useCompanies';
import type { AppUser } from '@/types/user';
import { formatDate } from '@/utils/date';

const ROLE_OPTIONS = [
  { label: 'All Roles', value: '' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'HR', value: 'HR' },
];

const STATUS_OPTIONS = [
  { label: 'All Status', value: '' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];

const roleBadge: Record<string, 'brand' | 'info' | 'success'> = {
  SUPER_ADMIN: 'brand', ADMIN: 'info', HR: 'success',
};

export function UsersPage() {
  const toast = useToast();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [toggleTarget, setToggleTarget] = useState<AppUser | null>(null);
  const [viewUser, setViewUser] = useState<AppUser | null>(null);

  const { data, isLoading, error, refetch } = useUsers({
    page, pageSize: 10,
    search: search || undefined,
    role: role || undefined,
    status: (status as 'ACTIVE' | 'INACTIVE') || undefined,
    companyId: isSuperAdmin ? companyFilter || undefined : (user?.companyId ?? ''),
  });
  const { data: companiesData } = useCompanies(isSuperAdmin ? { page: 1, pageSize: 100 } : undefined);
  const toggleStatus = useToggleUserStatus();

  const columns: Column<AppUser>[] = [
    {
      key: 'name', header: 'User',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.fullName} size="sm" />
          <div>
            <p className="font-medium text-surface-900">{row.fullName}</p>
            <p className="text-xs text-surface-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'role', header: 'Role', accessor: (r) => <Badge variant={roleBadge[r.role] ?? 'surface'} label={r.role} />, width: '100px' },
    { key: 'companyName', header: 'Company', accessor: (r) => <span className="text-sm">{r.companyName ?? '—'}</span> },
    { key: 'subCompanyName', header: 'Sub Company', accessor: (r) => <span className="text-sm">{r.subCompanyName ?? (r.role === 'ADMIN' ? 'All sub companies' : '—')}</span> },
    { key: 'status', header: 'Status', accessor: (r) => <StatusBadge status={r.status} />, width: '100px' },
    { key: 'lastLogin', header: 'Last Login', accessor: (r) => r.lastLogin ? formatDate(r.lastLogin, 'dd MMM yyyy') : '—', width: '130px' },
    { key: 'createdAt', header: 'Created', accessor: (r) => formatDate(r.createdAt), width: '120px' },
    {
      key: 'actions', header: 'Actions', width: '90px',
      accessor: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); setEditUser(row); setFormOpen(true); }}
            className="p-1.5 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"><Pencil className="h-4 w-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); setToggleTarget(row); }}
            className="p-1.5 rounded-lg text-surface-400 hover:text-warning-600 hover:bg-warning-50 transition-colors"
            title={row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}>
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
      toast.success(`User ${toggleTarget.status === 'ACTIVE' ? 'deactivated' : 'activated'}`, toggleTarget.fullName);
    } catch { toast.error('Failed to update'); }
    finally { setToggleTarget(null); }
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Users"
        subtitle={isSuperAdmin ? "Manage Admin and HR users across the platform" : "Manage HR users for your company"}
        breadcrumbs={[{ label: isSuperAdmin ? 'Super Admin' : 'Admin' }, { label: 'Users' }]}
        action={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setEditUser(null); setFormOpen(true); }}>Add User</Button>}
      />
      <div className="flex flex-wrap gap-3">
        <div className="w-36">
          <Select options={ROLE_OPTIONS} value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} />
        </div>
        {isSuperAdmin && (
          <div className="w-56">
            <Select
              options={[{ label: 'All Companies', value: '' }, ...(companiesData?.data ?? []).map((c) => ({ label: c.name, value: c.id }))]}
              value={companyFilter}
              onChange={(e) => { setCompanyFilter(e.target.value); setPage(1); }}
            />
          </div>
        )}
        <div className="w-36">
          <Select options={STATUS_OPTIONS} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} />
        </div>
      </div>
      <DataTable
        data={data?.data ?? []} columns={columns} keyExtractor={(r) => r.id}
        loading={isLoading} error={error ? 'Failed to load users' : null} onRetry={refetch}
        searchable searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search users..."
        onRowClick={setViewUser}
        pagination={data ? { page, totalPages: data.totalPages, total: data.total, pageSize: data.pageSize, onPageChange: setPage } : undefined}
        emptyState={{ title: 'No users found', icon: <UserCog className="h-8 w-8" />, action: { label: 'Add User', onClick: () => setFormOpen(true), icon: <Plus className="h-4 w-4" /> } }}
      />
      <UserDetailDialog user={viewUser} onClose={() => setViewUser(null)} onEdit={(u) => { setViewUser(null); setEditUser(u); setFormOpen(true); }} />
      <UserFormDialog open={formOpen} onClose={() => { setFormOpen(false); setEditUser(null); }} editUser={editUser} />
      <ConfirmDialog open={!!toggleTarget} onClose={() => setToggleTarget(null)} onConfirm={handleToggle}
        title={`${toggleTarget?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} User`}
        description={`Are you sure you want to ${toggleTarget?.status === 'ACTIVE' ? 'deactivate' : 'activate'} "${toggleTarget?.fullName}"?`}
        confirmLabel={toggleTarget?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        variant={toggleTarget?.status === 'ACTIVE' ? 'danger' : 'primary'} loading={toggleStatus.isPending} />
    </div>
  );
}
