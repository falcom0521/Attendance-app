import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Building2, GitBranch, Users, Monitor, UserCog, Pencil, ToggleLeft, ToggleRight, Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { DetailRow } from '@/components/common/DetailRow';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useToast } from '@/components/feedback/ToastContext';
import { useCompany, useSubCompaniesByCompany, useToggleCompanyStatus } from '../hooks/useCompanies';
import { CompanyFormDialog } from '../components/CompanyFormDialog';
import { SubCompanyFormDialog } from '@/features/sub-companies/components/SubCompanyFormDialog';
import { useDevices } from '@/features/devices/hooks/useDevices';
import { useUsers } from '@/features/users/hooks/useUsers';
import { UserDetailDialog } from '@/features/users/components/UserDetailDialog';
import { UserFormDialog } from '@/features/users/components/UserFormDialog';
import { useActivityLogs } from '@/features/activity-logs/hooks/useActivityLogs';
import { ActivityLogTable } from '@/features/activity-logs/components/ActivityLogTable';
import { formatDate, formatDateTime } from '@/utils/date';
import type { SubCompany } from '@/types/company';
import type { Device } from '@/types/device';
import type { AppUser } from '@/types/user';

export function CompanyDetailPage() {
  const { companyId = '' } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [tab, setTab] = useState('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [addSubOpen, setAddSubOpen] = useState(false);
  const [toggleOpen, setToggleOpen] = useState(false);
  const [viewUser, setViewUser] = useState<AppUser | null>(null);
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [logPage, setLogPage] = useState(1);

  const { data: company, isLoading, error, refetch } = useCompany(companyId);
  const { data: subCompanies = [], isLoading: loadingSubs } = useSubCompaniesByCompany(companyId);
  const { data: deviceData, isLoading: loadingDevices } = useDevices({ companyId, page: 1, pageSize: 100 });
  const { data: userData, isLoading: loadingUsers } = useUsers({ companyId, page: 1, pageSize: 100 });
  const { data: logs, isLoading: loadingLogs } = useActivityLogs({ companyId, page: logPage, pageSize: 10 });
  const toggle = useToggleCompanyStatus();

  if (isLoading) {
    return (
      <div className="page-container space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-28" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (error || !company) {
    return <div className="page-container"><ErrorState title="Company not found" onRetry={refetch} /></div>;
  }

  const devices = deviceData?.data ?? [];
  const users = userData?.data ?? [];
  const online = devices.filter((d) => d.status === 'ONLINE').length;
  const admins = users.filter((u) => u.role === 'ADMIN').length;
  const hrs = users.filter((u) => u.role === 'HR').length;
  const active = company.status === 'ACTIVE';

  const subColumns: Column<SubCompany>[] = [
    {
      key: 'name', header: 'Sub Company',
      accessor: (r) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0"><GitBranch className="h-4 w-4 text-purple-600" /></div>
          <div><p className="font-medium text-surface-900">{r.name}</p><p className="text-xs text-surface-400">{r.code}</p></div>
        </div>
      ),
    },
    { key: 'city', header: 'Location', accessor: (r) => <span className="text-sm">{[r.city, r.state].filter(Boolean).join(', ') || '—'}</span> },
    { key: 'employees', header: 'Employees', width: '100px', accessor: (r) => <span className="font-medium">{r.employeeCount}</span> },
    { key: 'devices', header: 'Devices', width: '90px', accessor: (r) => <span className="font-medium">{r.deviceCount}</span> },
    { key: 'hr', header: 'HR Users', width: '90px', accessor: (r) => <span className="font-medium">{r.hrCount}</span> },
    { key: 'status', header: 'Status', width: '100px', accessor: (r) => <StatusBadge status={r.status} /> },
  ];

  const deviceColumns: Column<Device>[] = [
    { key: 'device', header: 'Device', accessor: (r) => <div><p className="font-medium text-surface-900">{r.deviceId}</p><p className="text-xs text-surface-400">{r.name}</p></div> },
    { key: 'model', header: 'Model', accessor: (r) => <span className="text-sm">{r.modelNumber}</span> },
    { key: 'sub', header: 'Sub Company', accessor: (r) => <span className="text-sm">{r.subCompanyName ?? '—'}</span> },
    { key: 'status', header: 'Status', width: '120px', accessor: (r) => <StatusBadge status={r.status} /> },
    { key: 'seen', header: 'Last Seen', accessor: (r) => r.lastSeen ? <span className="text-xs">{formatDateTime(r.lastSeen)}</span> : '—' },
  ];

  const userColumns: Column<AppUser>[] = [
    { key: 'user', header: 'User', accessor: (r) => <div><p className="font-medium text-surface-900">{r.fullName}</p><p className="text-xs text-surface-400">{r.email}</p></div> },
    { key: 'role', header: 'Role', width: '90px', accessor: (r) => <Badge variant={r.role === 'ADMIN' ? 'info' : 'success'} size="sm" label={r.role} /> },
    { key: 'sub', header: 'Sub Company', accessor: (r) => <span className="text-sm">{r.subCompanyName ?? 'All sub companies'}</span> },
    { key: 'status', header: 'Status', width: '100px', accessor: (r) => <StatusBadge status={r.status} /> },
    { key: 'login', header: 'Last Login', accessor: (r) => r.lastLogin ? <span className="text-xs">{formatDateTime(r.lastLogin)}</span> : '—' },
  ];

  async function handleToggle() {
    try {
      await toggle.mutateAsync(company!.id);
      toast.success(`Company ${active ? 'deactivated' : 'activated'}`, company!.name);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setToggleOpen(false);
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'sub-companies', label: 'Sub Companies', badge: subCompanies.length },
    { id: 'devices', label: 'Devices', badge: devices.length },
    { id: 'users', label: 'Users', badge: users.length },
    { id: 'activity', label: 'Activity' },
  ];

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/super-admin/companies')} leftIcon={<ArrowLeft className="h-4 w-4" />}>Back</Button>
        <div className="h-4 w-px bg-surface-200" />
        <nav className="flex items-center gap-1 text-xs text-surface-400">
          <span>Super Admin</span><span>/</span><span>Companies</span><span>/</span>
          <span className="text-surface-700 font-medium">{company.name}</span>
        </nav>
      </div>

      <Card>
        <CardBody className="p-5">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="h-12 w-12 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0"><Building2 className="h-6 w-6 text-brand-600" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-surface-900">{company.name}</h2>
                <StatusBadge status={company.status} />
              </div>
              <p className="text-sm text-surface-500 mt-0.5">{company.code} · {[company.city, company.state, company.country].filter(Boolean).join(', ')}</p>
              <p className="text-xs text-surface-400 mt-1">Registered {formatDate(company.createdAt)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" leftIcon={<Pencil className="h-4 w-4" />} onClick={() => setEditOpen(true)}>Edit</Button>
              <Button variant={active ? 'danger' : 'primary'} size="sm" leftIcon={active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />} onClick={() => setToggleOpen(true)}>
                {active ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Sub Companies" value={company.subCompanyCount} icon={<GitBranch className="h-4 w-4" />} color="purple" subtitle="Branches" />
        <StatCard title="Employees" value={company.employeeCount} icon={<Users className="h-4 w-4" />} color="green" subtitle="Across all branches" />
        <StatCard title="Devices" value={company.deviceCount} icon={<Monitor className="h-4 w-4" />} color="cyan" subtitle={`${online} online`} />
        <StatCard title="Users" value={users.length} icon={<UserCog className="h-4 w-4" />} color="orange" subtitle={`${admins} admin · ${hrs} HR`} />
      </div>

      <Tabs tabs={tabs} activeTab={tab} onChange={setTab} />

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader title="Company Information" />
            <CardBody>
              <DetailRow label="Company name" value={company.name} />
              <DetailRow label="Company code" value={company.code} />
              <DetailRow label="Registration no." value={<span className="font-mono text-xs">{company.registrationNumber}</span>} />
              <DetailRow label="Status" value={<StatusBadge status={company.status} />} />
              <DetailRow label="Created" value={formatDateTime(company.createdAt)} />
              <DetailRow label="Last updated" value={formatDateTime(company.updatedAt)} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Contact & Address" />
            <CardBody>
              <DetailRow label="Email" value={company.email} />
              <DetailRow label="Phone" value={company.phone} />
              <DetailRow label="Address" value={company.address} />
              <DetailRow label="City" value={company.city} />
              <DetailRow label="State" value={company.state} />
              <DetailRow label="Country" value={company.country} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Administrators" subtitle="Company-level Admin users" />
            <CardBody className="p-0 divide-y divide-surface-50">
              {loadingUsers ? <Skeleton className="h-20 m-4" /> : users.filter((u) => u.role === 'ADMIN').length === 0 ? (
                <p className="text-sm text-surface-400 text-center py-8">No Admin assigned yet</p>
              ) : users.filter((u) => u.role === 'ADMIN').map((u) => (
                <button key={u.id} onClick={() => setViewUser(u)} className="w-full flex items-center justify-between gap-3 px-5 py-3 text-left hover:bg-surface-50 transition-colors">
                  <div className="min-w-0"><p className="text-sm font-medium text-surface-900 truncate">{u.fullName}</p><p className="text-xs text-surface-400 truncate">{u.email}</p></div>
                  <StatusBadge status={u.status} />
                </button>
              ))}
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'sub-companies' && (
        <>
          <div className="flex justify-end">
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setAddSubOpen(true)}>Add Sub Company</Button>
          </div>
          <DataTable
            data={subCompanies} columns={subColumns} keyExtractor={(r) => r.id} loading={loadingSubs}
            onRowClick={(r) => navigate(`/super-admin/sub-companies/${r.id}`)}
            emptyState={{ title: 'No sub companies yet', description: 'Employees and devices belong to sub companies — add the first one.', icon: <GitBranch className="h-8 w-8" />, action: { label: 'Add Sub Company', onClick: () => setAddSubOpen(true), icon: <Plus className="h-4 w-4" /> } }}
          />
        </>
      )}

      {tab === 'devices' && (
        <DataTable
          data={devices} columns={deviceColumns} keyExtractor={(r) => r.id} loading={loadingDevices}
          onRowClick={(r) => navigate(`/super-admin/devices/${r.id}`)}
          emptyState={{ title: 'No devices allocated', description: 'Allocate a device from the Devices page.', icon: <Monitor className="h-8 w-8" /> }}
        />
      )}

      {tab === 'users' && (
        <DataTable
          data={users} columns={userColumns} keyExtractor={(r) => r.id} loading={loadingUsers}
          onRowClick={setViewUser}
          emptyState={{ title: 'No users', icon: <UserCog className="h-8 w-8" /> }}
        />
      )}

      {tab === 'activity' && (
        <ActivityLogTable
          logs={logs?.data ?? []} loading={loadingLogs && !logs} compact
          pagination={logs ? { page: logPage, totalPages: logs.totalPages, total: logs.total, pageSize: logs.pageSize, onPageChange: setLogPage } : undefined}
        />
      )}

      <CompanyFormDialog open={editOpen} onClose={() => setEditOpen(false)} company={company} />
      <SubCompanyFormDialog open={addSubOpen} onClose={() => setAddSubOpen(false)} defaultCompanyId={company.id} />
      <UserDetailDialog user={viewUser} onClose={() => setViewUser(null)} onEdit={(u) => { setViewUser(null); setEditUser(u); }} />
      <UserFormDialog open={!!editUser} onClose={() => setEditUser(null)} editUser={editUser} />
      <ConfirmDialog
        open={toggleOpen} onClose={() => setToggleOpen(false)} onConfirm={handleToggle}
        title={active ? 'Deactivate Company' : 'Activate Company'}
        description={`Are you sure you want to ${active ? 'deactivate' : 'activate'} "${company.name}"?`}
        confirmLabel={active ? 'Deactivate' : 'Activate'} variant={active ? 'danger' : 'primary'} loading={toggle.isPending}
      />
    </div>
  );
}
