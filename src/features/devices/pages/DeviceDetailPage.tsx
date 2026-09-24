import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Monitor, Pencil, ArrowRightLeft, Unlink, Link as LinkIcon, Fingerprint, Users, Clock, Radio } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Tabs } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/utils/permissions';
import { isSuperAdminRole } from '@/config/permissions';
import { formatDate, formatDateTime, formatTime, addDaysToDate, todayISO } from '@/utils/date';
import type { DeviceAllocation, DevicePunchLog } from '@/types/device';
import { useDevice, useDeviceAllocations, useDevicePunchLogs, useDeviceStats } from '../hooks/useDevices';
import { DeviceFormDialog } from '../components/DeviceFormDialog';
import { AllocateDeviceDialog } from '../components/AllocateDeviceDialog';
import { DeallocateDeviceDialog } from '../components/DeallocateDeviceDialog';
import type { SortDir } from '@/lib/sort';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'allocations', label: 'Allocation History' },
  { id: 'punches', label: 'Punch Log' },
];

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-surface-50 last:border-0">
      <span className="text-xs text-surface-400 pt-0.5">{label}</span>
      <span className="text-sm font-medium text-surface-800 text-right">{value}</span>
    </div>
  );
}

export function DeviceDetailPage() {
  const { deviceId = '' } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = user?.role ?? 'ADMIN';
  const isSuperAdmin = isSuperAdminRole(role);
  const basePath = isSuperAdmin ? '/super-admin' : '/admin';
  const canUpdate = hasPermission(role, 'devices:update');
  const canAllocate = hasPermission(role, 'devices:allocate');
  const canDeallocate = hasPermission(role, 'devices:deallocate');

  const [tab, setTab] = useState('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [reallocateOpen, setReallocateOpen] = useState(false);
  const [deallocateOpen, setDeallocateOpen] = useState(false);
  const [from, setFrom] = useState(addDaysToDate(todayISO(), -6));
  const [to, setTo] = useState(todayISO());
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [punchSortKey, setPunchSortKey] = useState<string | null>(null);
  const [punchSortDir, setPunchSortDir] = useState<SortDir | null>(null);

  const rangeError = from && to && from > to ? 'From date must be on or before the To date' : '';
  const { data: device, isLoading, error, refetch } = useDevice(deviceId);
  const { data: stats } = useDeviceStats(deviceId);
  const { data: allocations = [], isLoading: loadingAlloc } = useDeviceAllocations(deviceId);
  const { data: logs, isLoading: loadingLogs } = useDevicePunchLogs(deviceId, {
    startDate: rangeError ? undefined : from || undefined,
    endDate: rangeError ? undefined : to || undefined,
    search: search || undefined,
    page,
    pageSize: 15,
    sortBy: punchSortKey ?? undefined,
    sortDir: punchSortDir ?? undefined,
  });

  if (isLoading) {
    return (
      <div className="page-container space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-28" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  // Admins may only open devices currently allocated to their own company.
  const forbidden = !!device && !isSuperAdmin && device.companyId !== user?.companyId;
  if (error || !device || forbidden) {
    return (
      <div className="page-container">
        <ErrorState title="Device not found" onRetry={refetch} />
      </div>
    );
  }

  const allocated = device.status !== 'UNALLOCATED';

  const allocationColumns: Column<DeviceAllocation>[] = [
    {
      key: 'subCompanyName', header: 'Allocated To', sortable: true, sortValue: (a) => a.subCompanyName,
      accessor: (a) => (
        <div>
          <p className="font-medium text-surface-900">{a.subCompanyName}</p>
          <p className="text-xs text-surface-400">{a.companyName}</p>
        </div>
      ),
    },
    {
      key: 'allocatedAt', header: 'Allocated', sortable: true, sortValue: (a) => a.allocatedAt,
      accessor: (a) => (
        <div>
          <p className="text-sm">{formatDateTime(a.allocatedAt)}</p>
          <p className="text-xs text-surface-400">by {a.allocatedBy}</p>
        </div>
      ),
    },
    {
      key: 'deallocatedAt', header: 'Ended', sortable: true, sortValue: (a) => a.deallocatedAt,
      accessor: (a) => a.deallocatedAt ? (
        <div>
          <p className="text-sm">{formatDateTime(a.deallocatedAt)}</p>
          {a.deallocatedBy && <p className="text-xs text-surface-400">by {a.deallocatedBy}</p>}
        </div>
      ) : <span className="text-surface-300">—</span>,
    },
    { key: 'status', header: 'Status', sortable: true, sortValue: (a) => (a.isActive ? 'Active' : 'Closed'), width: '100px', accessor: (a) => <Badge variant={a.isActive ? 'success' : 'surface'} size="sm">{a.isActive ? 'Active' : 'Closed'}</Badge> },
    { key: 'notes', header: 'Notes', accessor: (a) => <span className="text-sm text-surface-600">{a.deallocationReason ?? a.notes ?? '—'}</span> },
  ];

  const punchColumns: Column<DevicePunchLog>[] = [
    { key: 'punchTime', header: 'Time', sortable: true, sortValue: (p) => p.punchTime, width: '190px', accessor: (p) => <span className="font-mono text-xs">{formatDate(p.punchTime, 'dd MMM yyyy')} · {formatTime(p.punchTime)}</span> },
    {
      key: 'employeeName', header: 'Employee', sortable: true, sortValue: (p) => p.employeeName,
      accessor: (p) => (
        <div>
          <p className="font-medium text-surface-900">{p.employeeName}</p>
          <p className="text-xs text-surface-400">{p.employeeCode}</p>
        </div>
      ),
    },
    { key: 'punchType', header: 'Type', sortable: true, sortValue: (p) => p.punchType, width: '100px', accessor: (p) => <Badge variant={p.punchType === 'IN' ? 'success' : 'danger'} size="sm">{p.punchType}</Badge> },
  ];

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(`${basePath}/devices`)} leftIcon={<ArrowLeft className="h-4 w-4" />}>Back</Button>
        <div className="h-4 w-px bg-surface-200" />
        <nav className="flex items-center gap-1 text-xs text-surface-400">
          <span>{isSuperAdmin ? 'Super Admin' : 'Admin'}</span><span>/</span><span>Devices</span><span>/</span>
          <span className="text-surface-700 font-medium">{device.deviceId}</span>
        </nav>
      </div>

      <Card>
        <CardBody className="p-5">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="h-12 w-12 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Fingerprint className="h-6 w-6 text-brand-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-surface-900">{device.deviceId}</h2>
                <StatusBadge status={device.status} />
              </div>
              <p className="text-surface-500 mt-0.5">{device.name} · {device.modelNumber}</p>
              <p className="text-xs text-surface-400 mt-1">
                {allocated ? `${device.subCompanyName} · ${device.companyName}` : 'Not allocated to any sub company'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canUpdate && <Button variant="outline" size="sm" leftIcon={<Pencil className="h-4 w-4" />} onClick={() => setEditOpen(true)}>Edit</Button>}
              {canAllocate && !allocated && <Button size="sm" leftIcon={<LinkIcon className="h-4 w-4" />} onClick={() => setAllocateOpen(true)}>Allocate</Button>}
              {canAllocate && allocated && <Button variant="outline" size="sm" leftIcon={<ArrowRightLeft className="h-4 w-4" />} onClick={() => setReallocateOpen(true)}>Re-allocate</Button>}
              {canDeallocate && allocated && <Button variant="danger" size="sm" leftIcon={<Unlink className="h-4 w-4" />} onClick={() => setDeallocateOpen(true)}>Deallocate</Button>}
            </div>
          </div>
        </CardBody>
      </Card>

      <Tabs tabs={TABS} activeTab={tab} onChange={setTab} />

      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard title="Punches Today" value={stats?.punchesToday ?? 0} icon={<Fingerprint className="h-4 w-4" />} color="blue" subtitle="Recorded by this device" />
            <StatCard title="Last 7 Days" value={stats?.punchesLast7Days ?? 0} icon={<Clock className="h-4 w-4" />} color="purple" subtitle="Total punches" />
            <StatCard title="Employees Today" value={stats?.uniqueEmployeesToday ?? 0} icon={<Users className="h-4 w-4" />} color="green" subtitle="Unique punchers" />
            <StatCard title="Last Seen" value={device.lastSeen ? formatTime(device.lastSeen) : '—'} icon={<Radio className="h-4 w-4" />} color="cyan" subtitle={device.lastSeen ? formatDate(device.lastSeen) : 'Never'} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader title="Device Information" />
              <CardBody>
                <InfoRow label="Device ID" value={device.deviceId} />
                <InfoRow label="Name" value={device.name} />
                <InfoRow label="Model" value={device.modelNumber} />
                <InfoRow label="Serial number" value={<span className="font-mono text-xs">{device.serialNumber}</span>} />
                <InfoRow label="MAC address" value={<span className="font-mono text-xs">{device.macAddress}</span>} />
                <InfoRow label="IP address" value={<span className="font-mono text-xs">{device.ipAddress}</span>} />
                <InfoRow label="Firmware" value={device.firmwareVersion} />
                <InfoRow label="Added" value={formatDate(device.createdAt)} />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Current Allocation" />
              <CardBody>
                {allocated ? (
                  <>
                    <InfoRow label="Company" value={device.companyName} />
                    <InfoRow label="Sub company" value={device.subCompanyName} />
                    <InfoRow label="Allocated on" value={device.allocatedAt ? formatDateTime(device.allocatedAt) : '—'} />
                    <InfoRow label="Last punch" value={stats?.lastPunch ? formatDateTime(stats.lastPunch) : '—'} />
                  </>
                ) : (
                  <div className="py-8 text-center">
                    <Monitor className="h-8 w-8 text-surface-300 mx-auto mb-2" />
                    <p className="text-sm text-surface-500">This device is in the unallocated pool.</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </>
      )}

      {tab === 'allocations' && (
        <DataTable
          data={[...allocations].sort((a, b) => b.allocatedAt.localeCompare(a.allocatedAt))}
          columns={allocationColumns}
          keyExtractor={(a) => a.id}
          loading={loadingAlloc}
          emptyState={{ title: 'No allocation history', description: 'This device has never been allocated.', icon: <Monitor className="h-8 w-8" /> }}
        />
      )}

      {tab === 'punches' && (
        <>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="w-40"><Input label="From" type="date" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); setPage(1); }} /></div>
            <div className="w-40"><Input label="To" type="date" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); setPage(1); }} /></div>
          </div>
          {rangeError && <p className="form-error" role="alert">{rangeError}</p>}
          <DataTable
            data={logs?.data ?? []}
            columns={punchColumns}
            keyExtractor={(p) => p.id}
            loading={loadingLogs && !logs}
            searchable
            searchValue={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            searchPlaceholder="Search employee..."
            sortKey={punchSortKey}
            sortDir={punchSortDir}
            onSortChange={(key, dir) => { setPunchSortKey(key); setPunchSortDir(dir); setPage(1); }}
            pagination={logs ? { page, totalPages: logs.totalPages, total: logs.total, pageSize: logs.pageSize, onPageChange: setPage } : undefined}
            emptyState={{ title: 'No punches in this range', description: 'Try widening the date range.', icon: <Fingerprint className="h-8 w-8" /> }}
          />
        </>
      )}

      {canUpdate && <DeviceFormDialog open={editOpen} onClose={() => setEditOpen(false)} device={device} />}
      {allocateOpen && <AllocateDeviceDialog open device={device} onClose={() => setAllocateOpen(false)} />}
      {reallocateOpen && <AllocateDeviceDialog open mode="reallocate" device={device} onClose={() => setReallocateOpen(false)} />}
      {deallocateOpen && <DeallocateDeviceDialog open device={device} onClose={() => setDeallocateOpen(false)} />}
    </div>
  );
}
