import { Users, Clock, XCircle, AlertTriangle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { AttendanceTrendChart } from '@/components/charts/AttendanceTrendChart';
import { DepartmentAttendanceChart } from '@/components/charts/DepartmentAttendanceChart';
import { PageHeader } from '@/components/common/PageHeader';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { useHRDashboard } from '../hooks/useDashboard';
import { useAuthStore } from '@/store/authStore';
import { formatTime, minutesToDisplay, todayISO } from '@/utils/date';

export function HRDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { data, isLoading } = useHRDashboard(user?.subCompanyId ?? '');

  const toAttendance = (status?: string) => {
    const params = new URLSearchParams({ date: todayISO() });
    if (status) params.set('status', status);
    navigate(`/hr/attendance?${params.toString()}`);
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Sub Company Dashboard"
        subtitle={`${user?.subCompanyName ?? 'Sub Company'} — today's attendance overview`}
        breadcrumbs={[
          { label: user?.companyName ?? '' },
          { label: user?.subCompanyName ?? '' },
          { label: 'Dashboard' },
        ]}
      />

      {/* ── KPI cards: 5 only ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              title="Total"
              value={data?.totalEmployees ?? 0}
              icon={<Users className="h-4 w-4" />}
              color="blue"
              subtitle="Active employees"
              onClick={() => toAttendance()}
            />
            <StatCard
              title="Present"
              value={data?.presentToday ?? 0}
              icon={<Clock className="h-4 w-4" />}
              color="green"
              subtitle="On time + late"
              onClick={() => toAttendance('PRESENT')}
            />
            <StatCard
              title="Absent"
              value={data?.absentToday ?? 0}
              icon={<XCircle className="h-4 w-4" />}
              color="red"
              subtitle="No punch today"
              onClick={() => toAttendance('ABSENT')}
            />
            <StatCard
              title="Late"
              value={data?.lateToday ?? 0}
              icon={<AlertTriangle className="h-4 w-4" />}
              color="yellow"
              subtitle="Past grace period"
              onClick={() => toAttendance('LATE')}
            />
            <StatCard
              title="Early Out"
              value={data?.earlyOut ?? 0}
              icon={<LogOut className="h-4 w-4" />}
              color="orange"
              subtitle="Left before shift end"
              onClick={() => toAttendance('EARLY_OUT')}
            />
          </>
        )}
      </div>

      {/* ── Charts ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Weekly attendance area chart — 3 columns */}
        <Card className="lg:col-span-3">
          <CardHeader
            title="Weekly Attendance"
            subtitle="Last 7 days — present, absent & late"
          />
          <CardBody className="pt-2">
            <AttendanceTrendChart data={data?.weeklyAttendance ?? []} height={230} />
          </CardBody>
        </Card>

        {/* Department attendance — 2 columns, horizontal progress bars */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Department Attendance"
            subtitle="Today's attendance rate by department"
          />
          <CardBody className="pt-2">
            {isLoading ? (
              <div className="space-y-3.5 py-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between">
                      <div className="h-3 bg-surface-200 rounded w-24 animate-pulse" />
                      <div className="h-3 bg-surface-200 rounded w-10 animate-pulse" />
                    </div>
                    <div className="h-2 bg-surface-100 rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <DepartmentAttendanceChart data={data?.departmentAttendance ?? []} />
            )}
          </CardBody>
        </Card>
      </div>

      {/* ── Recent Attendance Table ────────────────────────────── */}
      <Card>
        <CardHeader
          title="Today's Attendance"
          subtitle="Recent employee punch records"
        />
        <CardBody className="p-0">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-th">Employee</th>
                  <th className="table-th">Shift</th>
                  <th className="table-th">Punch In</th>
                  <th className="table-th">Punch Out</th>
                  <th className="table-th">Working</th>
                  <th className="table-th">Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentAttendance ?? []).slice(0, 8).map((r) => (
                  <tr key={r.id} className="table-tr">
                    <td className="table-td">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={r.employeeName} size="xs" />
                        <div>
                          <p className="font-medium text-surface-900">{r.employeeName}</p>
                          <p className="text-xs text-surface-400">{r.employeeCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-td text-surface-600">{r.shiftName}</td>
                    <td className="table-td">
                      {r.firstPunchIn
                        ? <span className="font-mono text-xs">{formatTime(r.firstPunchIn)}</span>
                        : <span className="text-surface-300">—</span>}
                    </td>
                    <td className="table-td">
                      {r.lastPunchOut
                        ? <span className="font-mono text-xs">{formatTime(r.lastPunchOut)}</span>
                        : <span className="text-surface-300">—</span>}
                    </td>
                    <td className="table-td font-mono text-xs">
                      {r.workingMinutes > 0 ? minutesToDisplay(r.workingMinutes) : '—'}
                    </td>
                    <td className="table-td">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
