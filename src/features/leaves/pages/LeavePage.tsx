import { useMemo, useState } from 'react';
import { Plus, CalendarOff } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Tabs } from '@/components/ui/Tabs';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import { useSubCompanyScope } from '@/hooks/useSubCompanyScope';
import { hasPermission } from '@/utils/permissions';
import { YEAR_OPTIONS } from '@/utils/date';
import type { AttendanceRequest, LeaveBalance, LeaveBucket } from '@/types/request';
import { useLeaveBalances, useRequests } from '@/features/requests/hooks/useRequests';
import { RequestsTable } from '@/features/requests/components/RequestsTable';
import { RequestFormDialog } from '@/features/requests/components/RequestFormDialog';
import { RequestReviewDialog } from '@/features/requests/components/RequestReviewDialog';

function Bucket({ bucket }: { bucket: LeaveBucket }) {
  const left = bucket.total - bucket.used - bucket.pending;
  return (
    <div>
      <p className="text-sm font-medium text-surface-900">
        {bucket.used}<span className="text-surface-400 font-normal"> / {bucket.total} used</span>
      </p>
      <p className="text-xs text-surface-400">
        {left} left{bucket.pending > 0 && <span className="text-warning-600"> · {bucket.pending} pending</span>}
      </p>
    </div>
  );
}

export function LeavePage() {
  const { user } = useAuthStore();
  const scope = useSubCompanyScope();
  const [tab, setTab] = useState('balances');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [historyPage, setHistoryPage] = useState(1);
  const [applyFor, setApplyFor] = useState<{ employeeId?: string } | null>(null);
  const [selected, setSelected] = useState<AttendanceRequest | null>(null);
  const [search, setSearch] = useState('');

  const { data: balances = [], isLoading, error, refetch } = useLeaveBalances({
    companyId: scope.companyId,
    subCompanyId: scope.subCompanyId,
    year: Number(year),
    search: search || undefined,
  });
  const { data: history = [], isLoading: loadingHistory, error: historyError, refetch: refetchHistory } = useRequests({
    companyId: scope.companyId,
    subCompanyId: scope.subCompanyId,
    type: 'LEAVE',
  });

  const canCreate = !!user && hasPermission(user.role, 'requests:create');
  const pendingCount = useMemo(() => history.filter((r) => r.status === 'PENDING').length, [history]);

  const columns: Column<LeaveBalance>[] = [
    {
      key: 'employee', header: 'Employee',
      accessor: (b) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={b.employeeName} size="xs" />
          <div>
            <p className="font-medium text-surface-900">{b.employeeName}</p>
            <p className="text-xs text-surface-400">{b.employeeCode} · {b.department}</p>
          </div>
        </div>
      ),
    },
    ...(scope.showSubCompany
      ? [{ key: 'sub', header: 'Sub Company', accessor: (b: LeaveBalance) => <span className="text-sm text-surface-600">{b.subCompanyName}</span> }]
      : []),
    { key: 'casual', header: 'Casual', accessor: (b) => <Bucket bucket={b.balances.CASUAL} /> },
    { key: 'sick', header: 'Sick', accessor: (b) => <Bucket bucket={b.balances.SICK} /> },
    { key: 'earned', header: 'Earned', accessor: (b) => <Bucket bucket={b.balances.EARNED} /> },
    {
      key: 'unpaid', header: 'Unpaid',
      accessor: (b) => <span className="text-sm text-surface-700">{b.balances.UNPAID.used} day(s)</span>,
    },
    ...(canCreate
      ? [{
          key: 'actions', header: 'Actions', width: '100px',
          accessor: (b: LeaveBalance) => (
            <Button size="sm" variant="outline" onClick={() => setApplyFor({ employeeId: b.employeeId })}>Apply</Button>
          ),
        }]
      : []),
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Leave Management"
        subtitle="Leave balances and leave requests across the workforce"
        breadcrumbs={[{ label: user?.role === 'ADMIN' ? 'Admin' : 'HR' }, { label: 'Leaves' }]}
        action={
          canCreate && (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setApplyFor({})}>
              Apply Leave
            </Button>
          )
        }
      />

      <Tabs
        tabs={[
          { id: 'balances', label: 'Balances' },
          { id: 'history', label: 'Leave Requests', badge: pendingCount > 0 ? `${pendingCount} pending` : undefined },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === 'balances' ? (
        <>
          <div className="flex flex-wrap gap-3">
            <div className="w-32">
              <Select options={YEAR_OPTIONS} value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
          </div>
          <DataTable
            data={balances}
            columns={columns}
            keyExtractor={(b) => b.employeeId}
            loading={isLoading}
            error={error ? 'Failed to load leave balances' : null}
            onRetry={refetch}
            searchable
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search employees..."
            emptyState={{ title: 'No employees found', icon: <CalendarOff className="h-8 w-8" /> }}
          />
        </>
      ) : (
        <RequestsTable
          requests={history}
          loading={loadingHistory}
          error={!!historyError}
          onRetry={refetchHistory}
          onRowClick={setSelected}
          showSubCompany={scope.showSubCompany}
          page={historyPage}
          onPageChange={setHistoryPage}
          emptyTitle="No leave requests yet"
        />
      )}

      {canCreate && (
        <RequestFormDialog
          open={!!applyFor}
          onClose={() => setApplyFor(null)}
          lockType
          initial={{ type: 'LEAVE', employeeId: applyFor?.employeeId }}
        />
      )}
      <RequestReviewDialog request={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
