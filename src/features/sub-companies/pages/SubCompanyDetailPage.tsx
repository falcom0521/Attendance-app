import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, GitBranch, Users, Monitor, UserCog, Pencil, ToggleLeft, ToggleRight, Clock, CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Tabs } from '@/components/ui/Tabs';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { DetailRow } from '@/components/common/DetailRow';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useToast } from '@/components/feedback/ToastContext';
import { useSubCompany, useToggleSubCompanyStatus } from '@/features/companies/hooks/useCompanies';
import { SubCompanyFormDialog } from '../components/SubCompanyFormDialog';
import { useEmployees } from '@/features/employees/hooks/useEmployees';
import { useDevices } from '@/features/devices/hooks/useDevices';
import { useUsers } from '@/features/users/hooks/useUsers';
import { UserDetailDialog } from '@/features/users/components/UserDetailDialog';
import { UserFormDialog } from '@/features/users/components/UserFormDialog';
import { useDailyAttendance } from '@/features/attendance/hooks/useAttendance';
import { useShifts } from '@/features/shifts/hooks/useShifts';
import { useHolidays } from '@/features/holidays/hooks/useHolidays';
import { formatDate, formatDateTime, todayISO } from '@/utils/date';
import type { Employee } from '@/types/employee';
import type { Device } from '@/types/device';
import type { AppUser } from '@/types/user';

const ALL_DAYS = [
  ['MONDAY', 'Mon'], ['TUESDAY', 'Tue'], ['WEDNESDAY', 'Wed'], ['THURSDAY', 'Thu'],
  ['FRIDAY', 'Fri'], ['SATURDAY', 'Sat'], ['SUNDAY', 'Sun'],
] as const;

const PAGE_SIZE = 10;

export function SubCompanyDetailPage() {
  const { subCompanyId = '' } = useParams<{ subCompanyId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [tab, setTab] = useState('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [toggleOpen, setToggleOpen] = useState(false);
  const [viewUser, setViewUser] = useState<AppUser | null>(null);
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [empPage, setEmpPage] = useState(1);
  const [empSearch, setEmpSearch] = useState('');

  const { data: sub, isLoading, error, refetch } = useSubCompany(subCompanyId);
  const { data: empData, isLoading: loadingEmp } = useEmployees({ subCompanyId, page: 1, pageSize: 200 });
  const { data: deviceData, isLoading: loadingDevices } = useDevices({ subCompanyId, page: 1, pageSize: 100 });
  const { data: userData, isLoading: loadingUsers } = useUsers({ subCompanyId, page: 1, pageSize: 100 });
  const { data: attendance } = useDailyAttendance({ date: todayISO(), subCompanyId });
  const { data: shifts = [] } = useShifts(subCompanyId);
  const { data: holidays = [] } = useHolidays(subCompanyId, new Date().getFullYear());
  const toggle = useToggleSubCompanyStatus();

  const employees = useMemo(() => empData?.data ?? [], [empData]);
  const filteredEmployees = useMemo(() => {
    const q = empSearch.trim().toLowerCase();
    return q
      ? employees.filter((e) => `${e.fullName} ${e.employeeCode} ${e.department} ${e.designation}`.toLowerCase().includes(q))
      : employees;
  }, [employees, empSearch]);
  const departments = useMemo(() => {
    const counts = new Map<string, number>();
    employees.forEach((e) => counts.set(e.department, (counts.get(e.department) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [employees]);

  if (isLoading) {
    return (
      <div className="page-container space-y-4">
        <Skeleton className="h-8 w-48" /><Skeleton className="h-28" /><Skeleton className="h-64" />
      </div>
    );
  }
  if (error || !sub) {
    return <div className="page-container"><ErrorState title="Sub company not found" onRetry={refetch} /></div>;
  }

  const devices = deviceData?.data ?? [];
  const users = userData?.data ?? [];
  const active = sub.status === 'ACTIVE';
  const stats = attendance?.stats;
  const attended = (stats?.present ?? 0) + (stats?.late ?? 0) + (stats?.earlyOut ?? 0);

  const employeeColumns: Column<Employee>[] = [
    {
      key: 'name', header: 'Employee',
      accessor: (r) => (
        <div className="flex items-center gap-3"><Avatar name={r.fullName} size="sm" />
          <div><p className="font-medium text-surface-900">{r.fullName}</p><p className="text-xs text-surface-400">{r.employeeCode}</p></div>
        </div>
      ),
    },
    { key: 'department', header: 'Department', accessor: (r) => <span className="text-sm">{r.department}</span> },
    { key: 'designation', header: 'Designation', accessor: (r) => <span className="text-sm text-surface-600">{r.designation}</span> },
    { key: 'shift', header: 'Shift', accessor: (r) => r.shiftName ?? '—' },
    { key: 'joined', header: 'Joined', width: '120px', accessor: (r) => formatDate(r.joiningDate) },
    { key: 'status', header: 'Status', width: '100px', accessor: (r) => <StatusBadge status={r.status} /> },
  ];

  const deviceColumns: Column<Device>[] = [
    { key: 'device', header: 'Device', accessor: (r) => <div><p className="font-medium text-surface-900">{r.deviceId}</p><p className="text-xs text-surface-400">{r.name}</p></div> },
    { key: 'model', header: 'Model', accessor: (r) => <span className="text-sm">{r.modelNumber}</span> },
    { key: 'ip', header: 'IP', accessor: (r) => <span className="font-mono text-xs">{r.ipAddress}</span> },
    { key: 'status', header: 'Status', width: '120px', accessor: (r) => <StatusBadge status={r.status} /> },
    { key: 'seen', header: 'Last Seen', accessor: (r) => r.lastSeen ? <span className="text-xs">{formatDateTime(r.lastSeen)}</span> : '—' },
  ];

  const userColumns: Column<AppUser>[] = [
    { key: 'user', header: 'User', accessor: (r) => <div><p className="font-medium text-surface-900">{r.fullName}</p><p className="text-xs text-surface-400">{r.email}</p></div> },
    { key: 'role', header: 'Role', width: '90px', accessor: (r) => <Badge variant="success" size="sm" label={r.role} /> },
    { key: 'status', header: 'Status', width: '100px', accessor: (r) => <StatusBadge status={r.status} /> },
    { key: 'login', header: 'Last Login', accessor: (r) => r.lastLogin ? <span className="text-xs">{formatDateTime(r.lastLogin)}</span> : '—' },
  ];

  async function handleToggle() {
    try {
      await toggle.mutateAsync(sub!.id);
      toast.success(`Sub company ${active ? 'deactivated' : 'activated'}`, sub!.name);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setToggleOpen(false);
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'employees', label: 'Employees', badge: sub.employeeCount },
    { id: 'devices', label: 'Devices', badge: devices.length },
    { id: 'users', label: 'HR Users', badge: users.length },
  ];

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/super-admin/sub-companies')} leftIcon={<ArrowLeft className="h-4 w-4" />}>Back</Button>
        <div className="h-4 w-px bg-surface-200" />
        <nav className="flex items-center gap-1 text-xs text-surface-400">
          <span>Super Admin</span><span>/</span><span>Sub Companies</span><span>/</span>
          <span className="text-surface-700 font-medium">{sub.name}</span>
        </nav>
      </div>

      <Card>
        <CardBody className="p-5">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="h-12 w-12 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0"><GitBranch className="h-6 w-6 text-purple-600" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-surface-900">{sub.name}</h2>
                <StatusBadge status={sub.status} />
              </div>
              <p className="text-sm text-surface-500 mt-0.5">
                {sub.code} · part of{' '}
                <button className="text-brand-600 hover:underline font-medium" onClick={() => navigate(`/super-admin/companies/${sub.companyId}`)}>{sub.companyName}</button>
              </p>
              <p className="text-xs text-surface-400 mt-1">{[sub.city, sub.state, sub.country].filter(Boolean).join(', ')}</p>
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
        <StatCard title="Employees" value={sub.employeeCount} icon={<Users className="h-4 w-4" />} color="green" subtitle={`${departments.length} departments`} />
        <StatCard title="Devices" value={sub.deviceCount} icon={<Monitor className="h-4 w-4" />} color="cyan" subtitle={`${devices.filter((d) => d.status === 'ONLINE').length} online`} />
        <StatCard title="HR Users" value={sub.hrCount} icon={<UserCog className="h-4 w-4" />} color="orange" subtitle="Manage this branch" />
        <StatCard title="Present Today" value={attended} icon={<Clock className="h-4 w-4" />} color="blue" subtitle={`of ${stats?.total ?? 0} · ${stats?.absent ?? 0} absent`} />
      </div>

      <Tabs tabs={tabs} activeTab={tab} onChange={setTab} />

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader title="Sub Company Information" />
            <CardBody>
              <DetailRow label="Name" value={sub.name} />
              <DetailRow label="Code" value={sub.code} />
              <DetailRow label="Parent company" value={sub.companyName} />
              <DetailRow label="Status" value={<StatusBadge status={sub.status} />} />
              <DetailRow label="Created" value={formatDateTime(sub.createdAt)} />
              <DetailRow label="Last updated" value={formatDateTime(sub.updatedAt)} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Contact & Address" />
            <CardBody>
              <DetailRow label="Email" value={sub.email} />
              <DetailRow label="Phone" value={sub.phone} />
              <DetailRow label="Address" value={sub.address} />
              <DetailRow label="City" value={sub.city} />
              <DetailRow label="State" value={sub.state} />
              <DetailRow label="Country" value={sub.country} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Work Schedule" />
            <CardBody>
              <DetailRow label="Timezone" value={sub.timezone} />
              <div className="py-2.5 border-b border-surface-50">
                <p className="text-xs text-surface-400 mb-2">Working days</p>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_DAYS.map(([value, label]) => {
                    const on = sub.workingDays?.includes(value);
                    return (
                      <span key={value} className={`px-2.5 py-1 rounded-md text-xs font-medium ${on ? 'bg-brand-50 text-brand-700' : 'bg-surface-100 text-surface-400'}`}>{label}</span>
                    );
                  })}
                </div>
              </div>
              <DetailRow label="Shifts" value={shifts.length ? shifts.map((s) => `${s.name} (${s.startTime}–${s.endTime})`).join(', ') : undefined} />
              <DetailRow label="Holidays this year" value={<span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5 text-surface-400" />{holidays.length}</span>} />
            </CardBody>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader title="Employees by Department" />
            <CardBody>
              {loadingEmp ? <Skeleton className="h-16" /> : departments.length === 0 ? (
                <p className="text-sm text-surface-400 text-center py-4">No employees in this sub company yet</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {departments.map(([name, count]) => (
                    <div key={name} className="rounded-xl bg-surface-50 px-3 py-2.5">
                      <p className="text-lg font-bold text-surface-900">{count}</p>
                      <p className="text-xs text-surface-500 truncate">{name}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'employees' && (
        <DataTable
          data={filteredEmployees.slice((empPage - 1) * PAGE_SIZE, empPage * PAGE_SIZE)}
          columns={employeeColumns} keyExtractor={(r) => r.id} loading={loadingEmp}
          searchable searchValue={empSearch} onSearchChange={(v) => { setEmpSearch(v); setEmpPage(1); }} searchPlaceholder="Search employees..."
          pagination={{ page: empPage, totalPages: Math.max(1, Math.ceil(filteredEmployees.length / PAGE_SIZE)), total: filteredEmployees.length, pageSize: PAGE_SIZE, onPageChange: setEmpPage }}
          emptyState={{ title: 'No employees found', icon: <Users className="h-8 w-8" /> }}
        />
      )}

      {tab === 'devices' && (
        <DataTable
          data={devices} columns={deviceColumns} keyExtractor={(r) => r.id} loading={loadingDevices}
          onRowClick={(r) => navigate(`/super-admin/devices/${r.id}`)}
          emptyState={{ title: 'No devices allocated', icon: <Monitor className="h-8 w-8" /> }}
        />
      )}

      {tab === 'users' && (
        <DataTable
          data={users} columns={userColumns} keyExtractor={(r) => r.id} loading={loadingUsers} onRowClick={setViewUser}
          emptyState={{ title: 'No HR users yet', description: 'Add an HR user from the Users page.', icon: <UserCog className="h-8 w-8" /> }}
        />
      )}

      <SubCompanyFormDialog open={editOpen} onClose={() => setEditOpen(false)} subCompany={sub} />
      <UserDetailDialog user={viewUser} onClose={() => setViewUser(null)} onEdit={(u) => { setViewUser(null); setEditUser(u); }} />
      <UserFormDialog open={!!editUser} onClose={() => setEditUser(null)} editUser={editUser} />
      <ConfirmDialog
        open={toggleOpen} onClose={() => setToggleOpen(false)} onConfirm={handleToggle}
        title={active ? 'Deactivate Sub Company' : 'Activate Sub Company'}
        description={`Are you sure you want to ${active ? 'deactivate' : 'activate'} "${sub.name}"?`}
        confirmLabel={active ? 'Deactivate' : 'Activate'} variant={active ? 'danger' : 'primary'} loading={toggle.isPending}
      />
    </div>
  );
}
