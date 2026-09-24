import { useEffect, useState } from 'react';
import { Clock, Users, XCircle, AlertTriangle, LogOut, Eye, CalendarDays, Plus, Timer, CalendarCheck } from 'lucide-react';
// ClipboardCheck  — used by the disabled Requests button below
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Pagination } from '@/components/ui/Pagination';
import { CardSkeleton, TableSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useDailyAttendance } from '../hooks/useAttendance';
import { useDepartments } from '@/features/configuration/hooks/useDepartments';
import { useAuthStore } from '@/store/authStore';
import { useSubCompanyScope } from '@/hooks/useSubCompanyScope';
import { hasPermission } from '@/utils/permissions';
// DISABLED (Requests & Leaves): commented out for now, re-enable later.
// import { useRequests } from '@/features/requests/hooks/useRequests';
import { formatDate, formatTime, minutesToDisplay, todayISO } from '@/utils/date';
import { ManualAttendanceDialog } from '../components/ManualAttendanceDialog';
import { MarkLeaveDialog } from '../components/MarkLeaveDialog';
import type { AttendanceRecord, AttendanceStatus } from '@/types/attendance';

const STATUS_OPTIONS = [
  { label: 'All Status', value: '' },
  { label: 'Present', value: 'PRESENT' },
  { label: 'Absent', value: 'ABSENT' },
  { label: 'Late', value: 'LATE' },
  { label: 'Early Out', value: 'EARLY_OUT' },
  { label: 'Incomplete', value: 'INCOMPLETE' },
  { label: 'Holiday', value: 'HOLIDAY' },
  { label: 'Weekly Off', value: 'WEEKLY_OFF' },
];

const VALID_STATUSES = new Set(STATUS_OPTIONS.map((o) => o.value).filter(Boolean));

export function AttendancePage() {
  const { user } = useAuthStore();
  const scope = useSubCompanyScope();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // Dashboard KPI cards link here with a status (and date) pre-applied — read it once on
  // arrival, then drop it from the URL so it doesn't linger while the user changes filters.
  const initialStatus = searchParams.get('status') ?? '';
  const initialDate = searchParams.get('date') ?? '';
  const [date, setDate] = useState(() => (initialDate && initialDate <= todayISO() ? initialDate : todayISO()));
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(() => (VALID_STATUSES.has(initialStatus) ? initialStatus : ''));
  const [department, setDepartment] = useState('');
  const [page, setPage] = useState(1);
  const [manualOpen, setManualOpen] = useState(false);
  const [leaveTarget, setLeaveTarget] = useState<AttendanceRecord | null>(null);
  const PAGE_SIZE = 10;

  useEffect(() => {
    if (searchParams.has('status') || searchParams.has('date')) setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: departments = [] } = useDepartments(user?.companyId);
  const deptOptions = [
    { label: 'All Departments', value: '' },
    ...departments
      .filter((d) => d.status === 'ACTIVE')
      .map((d) => ({ label: d.name, value: d.name })),
  ];

  const { data, isLoading, error, refetch } = useDailyAttendance({
    date,
    search: search || undefined,
    status: (status as AttendanceStatus) || undefined,
    departmentId: department || undefined,
    companyId: scope.companyId,
    subCompanyId: scope.subCompanyId,
  });

  // DISABLED (Requests & Leaves): commented out for now, re-enable later.
  // const { data: pendingRequests = [] } = useRequests({
  //   companyId: scope.companyId,
  //   subCompanyId: scope.subCompanyId,
  //   status: 'PENDING',
  // });

  const basePath = scope.basePath;
  const canManage = !!user && hasPermission(user.role, 'attendance:manage');
  // const canViewRequests = !!user && hasPermission(user.role, 'requests:view');
  const records = data?.records ?? [];
  const paged = records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const stats = data?.stats;

  return (
    <div className="page-container">
      <PageHeader
        title="Attendance"
        subtitle="Daily attendance records and status"
        breadcrumbs={[{ label: user?.role === 'ADMIN' ? 'Admin' : 'HR' }, { label: 'Attendance' }]}
        action={
          <div className="flex items-center gap-2">
            {/* DISABLED (Requests & Leaves): re-enable later.
            {canViewRequests && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ClipboardCheck className="h-4 w-4" />}
                onClick={() => navigate(`${basePath}/requests`)}
              >
                Requests{pendingRequests.length > 0 && ` (${pendingRequests.length})`}
              </Button>
            )}
            */}
            {canManage && (
              <Button
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setManualOpen(true)}
              >
                Add Attendance
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              leftIcon={<CalendarDays className="h-4 w-4" />}
              onClick={() => navigate(`${basePath}/attendance/monthly`)}
            >
              Monthly View
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="form-label">Date</label>
          <Input type="date" value={date} max={todayISO()} onChange={(e) => { if (!e.target.value) return; setDate(e.target.value); setPage(1); }} className="w-44" aria-label="Attendance date" />
        </div>
        <div className="w-44">
          <Select options={STATUS_OPTIONS} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} />
        </div>
        <div className="w-48">
          <Select options={deptOptions} value={department} onChange={(e) => { setDepartment(e.target.value); setPage(1); }} />
        </div>
        <div className="flex-1 min-w-[200px]">
          <Input placeholder="Search employees..." maxLength={100} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      {/* Stats — 5 cards: Total, Present, Absent, Late, Early Out */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {isLoading ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />) : (
          <>
            <StatCard title="Total" value={stats?.total ?? 0} icon={<Users className="h-4 w-4" />} color="blue" subtitle="Employees" />
            <StatCard title="Present" value={stats?.present ?? 0} icon={<Clock className="h-4 w-4" />} color="green" subtitle="On time + late" />
            <StatCard title="Absent" value={stats?.absent ?? 0} icon={<XCircle className="h-4 w-4" />} color="red" subtitle="No punch" />
            <StatCard title="Late" value={stats?.late ?? 0} icon={<AlertTriangle className="h-4 w-4" />} color="yellow" subtitle="Past grace period" />
            <StatCard title="Early Out" value={stats?.earlyOut ?? 0} icon={<LogOut className="h-4 w-4" />} color="orange" subtitle="Left early" />
            <StatCard title="Overtime" value={minutesToDisplay(stats?.overtimeMinutes ?? 0)} icon={<Timer className="h-4 w-4" />} color="purple" subtitle="Total this day" />
          </>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardHeader
          title={`Attendance — ${formatDate(date)}`}
          subtitle={`${records.length} records`}
        />
        <CardBody className="p-0">
          {isLoading ? <TableSkeleton rows={8} columns={8} /> : error ? (
            <ErrorState message="Failed to load attendance" onRetry={refetch} />
          ) : records.length === 0 ? (
            <EmptyState icon={<Clock className="h-8 w-8" />} title="No attendance records" description="No records found for the selected filters." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="table-th">Employee</th>
                      {scope.showSubCompany && <th className="table-th">Sub Company</th>}
                      <th className="table-th">Department</th>
                      <th className="table-th">Shift</th>
                      <th className="table-th">Punch In</th>
                      <th className="table-th">Punch Out</th>
                      <th className="table-th">Working</th>
                      <th className="table-th">Late</th>
                      <th className="table-th">OT</th>
                      <th className="table-th">Status</th>
                      <th className="table-th">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((r) => (
                      <tr key={r.id} className="table-tr">
                        <td className="table-td">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={r.employeeName} size="xs" />
                            <div>
                              <p className="font-medium text-surface-900 whitespace-nowrap">{r.employeeName}</p>
                              <p className="text-xs text-surface-400">{r.employeeCode}</p>
                            </div>
                          </div>
                        </td>
                        {scope.showSubCompany && <td className="table-td text-surface-600 whitespace-nowrap">{r.subCompanyName ?? '—'}</td>}
                        <td className="table-td text-surface-600">{r.department}</td>
                        <td className="table-td text-surface-600">{r.shiftName}</td>
                        <td className="table-td">{r.firstPunchIn ? <span className="font-mono text-xs">{formatTime(r.firstPunchIn)}</span> : <span className="text-surface-400">—</span>}</td>
                        <td className="table-td">{r.lastPunchOut ? <span className="font-mono text-xs">{formatTime(r.lastPunchOut)}</span> : <span className="text-surface-400">—</span>}</td>
                        <td className="table-td font-mono text-xs">{r.workingMinutes > 0 ? minutesToDisplay(r.workingMinutes) : '—'}</td>
                        <td className="table-td">{r.lateMinutes > 0 ? <span className="text-xs text-warning-600 font-medium">{minutesToDisplay(r.lateMinutes)}</span> : <span className="text-surface-300">—</span>}</td>
                        <td className="table-td">{r.overtimeMinutes > 0 ? <span className="text-xs text-brand-600 font-medium">{minutesToDisplay(r.overtimeMinutes)}</span> : <span className="text-surface-300">—</span>}</td>
                        <td className="table-td">
                          <div className="flex items-center gap-1.5">
                            <StatusBadge status={r.status} />
                            {r.isManual && <Badge variant="brand" size="sm">Manual</Badge>}
                          </div>
                        </td>
                        <td className="table-td">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => navigate(`${basePath}/attendance/${r.employeeId}?date=${date}`)}
                              className="p-1.5 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {canManage && r.status === 'ABSENT' && date <= todayISO() && (
                              <button
                                onClick={() => setLeaveTarget(r)}
                                className="p-1.5 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                                title="Mark as leave"
                              >
                                <CalendarCheck className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={page}
                totalPages={Math.ceil(records.length / PAGE_SIZE)}
                total={records.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </>
          )}
        </CardBody>
      </Card>
      {/* Manual attendance dialog — HR and Admin */}
      {canManage && (
        <ManualAttendanceDialog
          open={manualOpen}
          onClose={() => setManualOpen(false)}
        />
      )}
      {leaveTarget && (
        <MarkLeaveDialog
          open
          onClose={() => setLeaveTarget(null)}
          employeeId={leaveTarget.employeeId}
          employeeName={leaveTarget.employeeName}
          date={date}
        />
      )}
    </div>
  );
}
