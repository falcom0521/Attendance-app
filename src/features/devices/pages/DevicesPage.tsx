import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Monitor, Pencil, Link, Eye, ArrowRightLeft, Unlink } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/Badge';
import { useDevices } from '../hooks/useDevices';
import { DeviceFormDialog } from '../components/DeviceFormDialog';
import { AllocateDeviceDialog } from '../components/AllocateDeviceDialog';
import { DeallocateDeviceDialog } from '../components/DeallocateDeviceDialog';
import { useAuthStore } from '@/store/authStore';
import { useSubCompanyScope } from '@/hooks/useSubCompanyScope';
import { hasPermission } from '@/utils/permissions';
import { isSuperAdminRole } from '@/config/permissions';
import type { Device } from '@/types/device';
import { formatDateTime } from '@/utils/date';
import { cn } from '@/lib/utils';
import type { SortDir } from '@/lib/sort';

const STATUS_OPTIONS = [
  { label: 'All Status', value: '' },
  { label: 'Online', value: 'ONLINE' },
  { label: 'Offline', value: 'OFFLINE' },
  { label: 'Unallocated', value: 'UNALLOCATED' },
  { label: 'Maintenance', value: 'MAINTENANCE' },
];

const statusDot: Record<string, string> = {
  ONLINE: 'bg-success-500',
  OFFLINE: 'bg-danger-500',
  UNALLOCATED: 'bg-surface-400',
  MAINTENANCE: 'bg-warning-500',
};

export function DevicesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const scope = useSubCompanyScope();
  const role = user?.role ?? 'ADMIN';
  const isSuperAdmin = isSuperAdminRole(role);
  const basePath = isSuperAdmin ? '/super-admin' : '/admin';
  const canCreate = hasPermission(role, 'devices:create');
  const canUpdate = hasPermission(role, 'devices:update');
  const canAllocate = hasPermission(role, 'devices:allocate');
  const canDeallocate = hasPermission(role, 'devices:deallocate');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<Device | null>(null);
  const [allocateDevice, setAllocateDevice] = useState<Device | null>(null);
  const [reallocateDevice, setReallocateDevice] = useState<Device | null>(null);
  const [deallocateDevice, setDeallocateDevice] = useState<Device | null>(null);

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir | null>(null);

  // Admin only sees their own company's devices (narrowed by the sub-company selector); Super Admin sees all.
  const { data, isLoading, error, refetch } = useDevices({
    page,
    pageSize: 10,
    search: search || undefined,
    status: status || undefined,
    companyId: isSuperAdmin ? undefined : scope.companyId,
    subCompanyId: isSuperAdmin ? undefined : scope.subCompanyId,
    sortBy: sortKey ?? undefined,
    sortDir: sortDir ?? undefined,
  });

  const columns: Column<Device>[] = [
    {
      key: 'deviceId', header: 'Device', sortable: true, sortValue: (r) => r.deviceId,
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className={cn('h-2 w-2 rounded-full flex-shrink-0', statusDot[row.status] ?? 'bg-surface-400')} />
          <div>
            <p className="font-medium text-surface-900">{row.deviceId}</p>
            <p className="text-xs text-surface-400">{row.name}</p>
          </div>
        </div>
      ),
    },
    { key: 'modelNumber', header: 'Model', sortable: true, sortValue: (r) => r.modelNumber, accessor: (r) => <span className="text-sm">{r.modelNumber}</span> },
    { key: 'serialNumber', header: 'Serial Number', sortable: true, sortValue: (r) => r.serialNumber, accessor: (r) => <span className="font-mono text-xs text-surface-600">{r.serialNumber}</span> },
    {
      key: 'subCompanyName', header: 'Allocated To', sortable: true, sortValue: (r) => r.subCompanyName,
      accessor: (r) => r.subCompanyName ? (
        <div>
          <p className="text-sm font-medium">{r.subCompanyName}</p>
          <p className="text-xs text-surface-400">{r.companyName}</p>
        </div>
      ) : <span className="text-surface-400 text-sm">—</span>,
    },
    { key: 'status', header: 'Status', sortable: true, sortValue: (r) => r.status, accessor: (r) => <StatusBadge status={r.status} />, width: '120px' },
    { key: 'lastSeen', header: 'Last Seen', sortable: true, sortValue: (r) => r.lastSeen, accessor: (r) => r.lastSeen ? <span className="text-xs">{formatDateTime(r.lastSeen)}</span> : '—' },
    {
      key: 'actions', header: 'Actions', width: '150px',
      accessor: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => navigate(`${basePath}/devices/${row.id}`)} title="View details" className="p-1.5 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"><Eye className="h-4 w-4" /></button>
          {canUpdate && (
            <button onClick={() => { setEditDevice(row); setFormOpen(true); }} title="Edit" className="p-1.5 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"><Pencil className="h-4 w-4" /></button>
          )}
          {canAllocate && row.status === 'UNALLOCATED' && (
            <button onClick={() => setAllocateDevice(row)} className="p-1.5 rounded-lg text-surface-400 hover:text-success-600 hover:bg-success-50 transition-colors" title="Allocate">
              <Link className="h-4 w-4" />
            </button>
          )}
          {canAllocate && row.status !== 'UNALLOCATED' && (
            <button onClick={() => setReallocateDevice(row)} className="p-1.5 rounded-lg text-surface-400 hover:text-info-600 hover:bg-info-50 transition-colors" title="Re-allocate">
              <ArrowRightLeft className="h-4 w-4" />
            </button>
          )}
          {canDeallocate && row.status !== 'UNALLOCATED' && (
            <button onClick={() => setDeallocateDevice(row)} className="p-1.5 rounded-lg text-surface-400 hover:text-danger-600 hover:bg-danger-50 transition-colors" title="Deallocate">
              <Unlink className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Devices"
        subtitle={isSuperAdmin ? 'Manage biometric punch devices across all companies' : 'Punch devices allocated to your sub companies (view only)'}
        breadcrumbs={[{ label: isSuperAdmin ? 'Super Admin' : 'Admin' }, { label: 'Devices' }]}
        action={canCreate && <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setEditDevice(null); setFormOpen(true); }}>Add Device</Button>}
      />
      <div className="flex flex-wrap gap-3">
        <div className="w-44">
          <Select options={STATUS_OPTIONS} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} />
        </div>
      </div>
      <DataTable
        data={data?.data ?? []} columns={columns} keyExtractor={(r) => r.id}
        loading={isLoading} error={error ? 'Failed to load devices' : null} onRetry={refetch}
        searchable searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search devices..."
        pagination={data ? { page, totalPages: data.totalPages, total: data.total, pageSize: data.pageSize, onPageChange: setPage } : undefined}
        sortKey={sortKey}
        sortDir={sortDir}
        onSortChange={(key, dir) => { setSortKey(key); setSortDir(dir); setPage(1); }}
        onRowClick={(row) => navigate(`${basePath}/devices/${row.id}`)}
        emptyState={{ title: 'No devices found', icon: <Monitor className="h-8 w-8" />, action: canCreate ? { label: 'Add Device', onClick: () => setFormOpen(true), icon: <Plus className="h-4 w-4" /> } : undefined }}
      />
      {canCreate && <DeviceFormDialog open={formOpen} onClose={() => { setFormOpen(false); setEditDevice(null); }} device={editDevice} />}
      {allocateDevice && (
        <AllocateDeviceDialog open device={allocateDevice} onClose={() => setAllocateDevice(null)} />
      )}
      {reallocateDevice && (
        <AllocateDeviceDialog open mode="reallocate" device={reallocateDevice} onClose={() => setReallocateDevice(null)} />
      )}
      {deallocateDevice && (
        <DeallocateDeviceDialog open device={deallocateDevice} onClose={() => setDeallocateDevice(null)} />
      )}
    </div>
  );
}
