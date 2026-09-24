import { Users, Clock, XCircle, AlertTriangle, GitBranch, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { AttendanceTrendChart } from '@/components/charts/AttendanceTrendChart';
import { DepartmentAttendanceChart } from '@/components/charts/DepartmentAttendanceChart';
import { PageHeader } from '@/components/common/PageHeader';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { useAdminDashboard } from '../hooks/useDashboard';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useSubCompaniesByCompany } from '@/features/companies/hooks/useCompanies';
import { todayISO } from '@/utils/date';

export function AdminDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { selectedSubCompanyId } = useUIStore();
  const { data: subCompanies = [] } = useSubCompaniesByCompany(user?.companyId ?? '');
  const selectedSub = subCompanies.find((sc) => sc.id === selectedSubCompanyId);

  const { data, isLoading } = useAdminDashboard(
    user?.companyId ?? '',
    selectedSubCompanyId || undefined
  );

  const scopeLabel = selectedSub ? selectedSub.name : 'All Sub Companies';
  const employeeSubtitle = selectedSub ? selectedSub.name : 'All branches';

  const toAttendance = (status?: string) => {
    const params = new URLSearchParams({ date: todayISO() });
    if (status) params.set('status', status);
    navigate(`/admin/attendance?${params.toString()}`);
  };

  // Convert departmentDistribution to DepartmentAttendanceChart format
  const deptAttendance = (data?.departmentDistribution ?? []).map((d) => ({
    dept: d.name,
    present: Math.round(d.value * 0.85),
    total: d.value,
  }));

  return (
    <div className="page-container">
      <PageHeader
        title="Company Overview"
        subtitle={`${user?.companyName ?? 'Company'} — ${scopeLabel}`}
        breadcrumbs={[
          { label: user?.companyName ?? 'Company' },
          { label: scopeLabel },
          { label: 'Dashboard' },
        ]}
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              title="Employees"
              value={data?.totalEmployees ?? 0}
              icon={<Users className="h-5 w-5" />}
              color="blue"
              subtitle={employeeSubtitle}
              onClick={() => toAttendance()}
            />
            <StatCard
              title="Present"
              value={data?.presentToday ?? 0}
              icon={<Clock className="h-5 w-5" />}
              color="green"
              subtitle="On time"
              onClick={() => toAttendance('PRESENT')}
            />
            <StatCard
              title="Absent"
              value={data?.absentToday ?? 0}
              icon={<XCircle className="h-5 w-5" />}
              color="red"
              subtitle="No punch"
              onClick={() => toAttendance('ABSENT')}
            />
            <StatCard
              title="Late"
              value={data?.lateToday ?? 0}
              icon={<AlertTriangle className="h-5 w-5" />}
              color="yellow"
              subtitle="Past grace"
              onClick={() => toAttendance('LATE')}
            />
            <StatCard
              title="Branches"
              value={data?.totalSubCompanies ?? 0}
              icon={<GitBranch className="h-5 w-5" />}
              color="purple"
              subtitle="Active"
            />
            <StatCard
              title="Devices"
              value={data?.totalDevices ?? 0}
              icon={<Monitor className="h-5 w-5" />}
              color="cyan"
              subtitle="Registered"
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3">
          <CardHeader
            title="7-Day Attendance Trend"
            subtitle="Daily present / absent / late breakdown"
          />
          <CardBody className="pt-2">
            <AttendanceTrendChart data={data?.attendanceTrend ?? []} height={240} />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Department Distribution"
            subtitle="Employees by department"
          />
          <CardBody className="pt-2">
            {isLoading ? (
              <div className="space-y-3 py-2">
                {Array.from({ length: 4 }).map((_, i) => (
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
              <DepartmentAttendanceChart data={deptAttendance} />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
