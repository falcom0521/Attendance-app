import { useNavigate } from 'react-router-dom';
import { Building2, GitBranch, Monitor, Wifi, WifiOff, Activity, Users, UserCog } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BarChart } from '@/components/charts/BarChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { PageHeader } from '@/components/common/PageHeader';
import { useSuperAdminDashboard } from '../hooks/useDashboard';
import { formatDateTime } from '@/utils/date';
import { CardSkeleton } from '@/components/ui/Skeleton';

const ACTION_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'surface'> = {
  CREATED: 'success', UPDATED: 'info', ACTIVATED: 'success', APPROVED: 'success', ALLOCATED: 'info',
  DEACTIVATED: 'danger', DELETED: 'danger', REJECTED: 'danger', DEALLOCATED: 'warning', CANCELLED: 'surface',
};

export function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useSuperAdminDashboard();

  return (
    <div className="page-container">
      <PageHeader
        title="Platform Overview"
        subtitle="Monitor all companies, devices and system health"
        breadcrumbs={[{ label: 'Super Admin' }, { label: 'Dashboard' }]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <StatCard title="Total Companies" value={data?.totalCompanies ?? 0} icon={<Building2 className="h-5 w-5" />} color="blue" subtitle={`${data?.activeCompanies ?? 0} active`} />
            <StatCard title="Sub Companies" value={data?.totalSubCompanies ?? 0} icon={<GitBranch className="h-5 w-5" />} color="purple" subtitle="All branches" />
            <StatCard title="Employees" value={data?.totalEmployees ?? 0} icon={<Users className="h-5 w-5" />} color="green" subtitle="Across the platform" />
            <StatCard title="Users" value={data?.totalUsers ?? 0} icon={<UserCog className="h-5 w-5" />} color="orange" subtitle="Admin, HR and Super Admin" />
            <StatCard title="Total Devices" value={data?.totalDevices ?? 0} icon={<Monitor className="h-5 w-5" />} color="cyan" subtitle="Registered devices" />
            <StatCard title="Online Devices" value={data?.onlineDevices ?? 0} icon={<Wifi className="h-5 w-5" />} color="green" subtitle="Currently online" />
            <StatCard title="Offline Devices" value={data?.offlineDevices ?? 0} icon={<WifiOff className="h-5 w-5" />} color="red" subtitle="Need attention" />
            <StatCard title="Unallocated" value={data?.deviceStatus.find((d) => d.name === 'Unallocated')?.value ?? 0} icon={<Monitor className="h-5 w-5" />} color="yellow" subtitle="Ready to allocate" />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Company Growth" subtitle="Total companies registered, last 6 months" />
          <CardBody>
            <BarChart
              data={data?.companyTrend ?? []}
              xAxisKey="month"
              bars={[{ dataKey: 'companies', color: '#3b82f6', name: 'Companies' }]}
              height={240}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Device Status" subtitle="Current device health" />
          <CardBody className="pt-2">
            <DonutChart data={data?.deviceStatus ?? []} height={240} />
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top companies */}
        <Card>
          <CardHeader title="Largest Companies" subtitle="By employee count" />
          <CardBody className="p-0 divide-y divide-surface-50">
            {(data?.topCompanies ?? []).map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/super-admin/companies/${c.id}`)}
                className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-surface-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-3.5 w-3.5 text-brand-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-surface-900 truncate">{c.name}</p>
                    <p className="text-xs text-surface-500">{c.subCompanies} sub compan{c.subCompanies === 1 ? 'y' : 'ies'}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-surface-700">{c.employees} <span className="text-xs font-normal text-surface-400">employees</span></span>
              </button>
            ))}
          </CardBody>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader
            title="Recent Activity"
            subtitle="Latest platform events"
            action={<Activity className="h-4 w-4 text-surface-400" />}
          />
          <CardBody className="p-0">
            <div className="divide-y divide-surface-50">
              {(data?.recentActivity ?? []).map((log) => (
                <div key={log.id} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-surface-50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-surface-900 truncate">{log.target}</p>
                    <p className="text-xs text-surface-500">{log.module} · {log.userName}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-surface-400">{formatDateTime(log.date)}</p>
                    <Badge variant={ACTION_VARIANT[log.action] ?? 'surface'} size="sm" label={log.action} />
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
