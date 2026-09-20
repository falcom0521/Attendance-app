import { useMemo, useState } from 'react';
import { Plus, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Tabs } from '@/components/ui/Tabs';
import { useAuthStore } from '@/store/authStore';
import { useSubCompanyScope } from '@/hooks/useSubCompanyScope';
import { hasPermission } from '@/utils/permissions';
import type { AttendanceRequest, RequestType } from '@/types/request';
import { useRequests } from '../hooks/useRequests';
import { RequestsTable } from '../components/RequestsTable';
import { RequestFormDialog } from '../components/RequestFormDialog';
import { RequestReviewDialog } from '../components/RequestReviewDialog';
import { REQUEST_TYPE_LABEL } from '../utils';

const TYPE_OPTIONS = [
  { label: 'All Types', value: '' },
  ...(Object.keys(REQUEST_TYPE_LABEL) as RequestType[]).map((t) => ({ label: REQUEST_TYPE_LABEL[t], value: t })),
];

export function RequestsPage() {
  const { user } = useAuthStore();
  const scope = useSubCompanyScope();
  const [tab, setTab] = useState('PENDING');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<AttendanceRequest | null>(null);

  const { data: all = [], isLoading, error, refetch } = useRequests({
    companyId: scope.companyId,
    subCompanyId: scope.subCompanyId,
  });

  const counts = useMemo(
    () => ({
      PENDING: all.filter((r) => r.status === 'PENDING').length,
      APPROVED: all.filter((r) => r.status === 'APPROVED').length,
      REJECTED: all.filter((r) => r.status === 'REJECTED').length,
    }),
    [all]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((r) => {
      if (tab !== 'ALL' && r.status !== tab) return false;
      if (type && r.type !== type) return false;
      if (q && !r.employeeName.toLowerCase().includes(q) && !r.employeeCode.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [all, tab, type, search]);

  const canCreate = !!user && hasPermission(user.role, 'requests:create');
  const canApprove = !!user && hasPermission(user.role, 'requests:approve');

  const tabs = [
    { id: 'PENDING', label: 'Pending', badge: counts.PENDING },
    { id: 'APPROVED', label: 'Approved', badge: counts.APPROVED },
    { id: 'REJECTED', label: 'Rejected', badge: counts.REJECTED },
    { id: 'ALL', label: 'All' },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Requests"
        subtitle={
          canApprove
            ? 'Review attendance corrections and leave requests raised by HR'
            : 'Attendance corrections and leave requests awaiting Admin approval'
        }
        breadcrumbs={[{ label: user?.role === 'ADMIN' ? 'Admin' : 'HR' }, { label: 'Requests' }]}
        action={
          canCreate && (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>
              New Request
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard title="Pending" value={counts.PENDING} icon={<Clock className="h-4 w-4" />} color="yellow" subtitle={canApprove ? 'Need your review' : 'Awaiting Admin'} />
        <StatCard title="Approved" value={counts.APPROVED} icon={<CheckCircle2 className="h-4 w-4" />} color="green" subtitle="Applied to attendance" />
        <StatCard title="Rejected" value={counts.REJECTED} icon={<XCircle className="h-4 w-4" />} color="red" subtitle="Not applied" />
      </div>

      <div>
        <Tabs tabs={tabs} activeTab={tab} onChange={(t) => { setTab(t); setPage(1); }} className="mb-3" />
        <div className="flex flex-wrap gap-3 mb-3">
          <div className="w-44">
            <Select options={TYPE_OPTIONS} value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} />
          </div>
          <div className="w-64">
            <Input placeholder="Search employee…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>
        <RequestsTable
          requests={filtered}
          loading={isLoading}
          error={!!error}
          onRetry={refetch}
          onRowClick={setSelected}
          showSubCompany={scope.showSubCompany}
          page={page}
          onPageChange={setPage}
          emptyTitle={tab === 'PENDING' ? 'No pending requests' : 'No requests found'}
        />
      </div>

      {canCreate && <RequestFormDialog open={formOpen} onClose={() => setFormOpen(false)} />}
      <RequestReviewDialog request={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
