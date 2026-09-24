import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase, Clock, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useEmployee } from '../hooks/useEmployees';
import { useEmployeeMonthlyAttendance } from '@/features/attendance/hooks/useAttendance';
import { useAuthStore } from '@/store/authStore';
import { formatDate, formatTime, minutesToDisplay, currentMonthYear } from '@/utils/date';
import { StatusBadge as AttBadge } from '@/components/ui/Badge';
import { useToast } from '@/components/feedback/ToastContext';
import { reportService } from '@/services/mock';
import { EmployeeFormDialog } from '../components/EmployeeFormDialog';
import type { AttendanceRecord } from '@/types/attendance';
import { useSort } from '@/hooks/useSort';
import { SortableTh } from '@/components/ui/SortableTh';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'reports', label: 'Reports' },
];

export function EmployeeDetailPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [generating, setGenerating] = useState('');
  const [editOpen, setEditOpen] = useState(false);

  const { data: employee, isLoading, error, refetch } = useEmployee(employeeId ?? '');
  const { month, year } = currentMonthYear();
  const { data: monthlyRecords, isLoading: loadingAtt } = useEmployeeMonthlyAttendance(employeeId ?? '', month, year);
  const { sortKey: attSortKey, sortDir: attSortDir, onSort: onAttSort, sortedData: sortedMonthlyRecords } = useSort<AttendanceRecord>(
    monthlyRecords ?? [],
    (r, key) => r[key as keyof AttendanceRecord]
  );

  const basePath = user?.role === 'ADMIN' ? '/admin' : '/hr';

  async function handleExport(format: string) {
    setGenerating(format);
    try {
      await reportService.exportMonthlyReport(month, year, { employeeIds: employeeId ? [employeeId] : [] }, format as 'EXCEL' | 'PDF' | 'CSV');
      toast.success(`${format} report generated`, `${employee?.fullName} — ${format}`);
    } catch { toast.error('Export failed'); }
    finally { setGenerating(''); }
  }

  if (isLoading) return (
    <div className="page-container space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-64" />
        <Skeleton className="h-64 lg:col-span-2" />
      </div>
    </div>
  );

  if (error || !employee) return (
    <div className="page-container">
      <ErrorState title="Employee not found" onRetry={refetch} />
    </div>
  );

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(`${basePath}/employees`)} leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Back
        </Button>
        <div className="h-4 w-px bg-surface-200" />
        <nav className="flex items-center gap-1 text-xs text-surface-400">
          <span>{user?.role === 'ADMIN' ? 'Admin' : 'HR'}</span>
          <span>/</span>
          <span>Employees</span>
          <span>/</span>
          <span className="text-surface-700 font-medium">{employee.fullName}</span>
        </nav>
      </div>

      {/* Profile Header */}
      <Card className="mb-4">
        <CardBody className="p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar name={employee.fullName} size="xl" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-surface-900">{employee.fullName}</h2>
                <StatusBadge status={employee.status} />
                <Badge variant="surface" label={employee.employeeType} />
              </div>
              <p className="text-surface-500 mt-0.5">{employee.designation} · {employee.department}</p>
              <p className="text-sm font-mono text-surface-400 mt-1">{employee.employeeCode}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>Edit Profile</Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} className="mb-4" />

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader title="Personal Information" />
            <CardBody className="space-y-3">
              <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={employee.email} />
              <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={employee.phone} />
              <InfoRow icon={<MapPin className="h-4 w-4" />} label="Address" value={employee.address} />
              <InfoRow icon={<Calendar className="h-4 w-4" />} label="Date of Birth" value={formatDate(employee.dateOfBirth)} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Employment Details" />
            <CardBody className="space-y-3">
              <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Department" value={employee.department} />
              <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Designation" value={employee.designation} />
              <InfoRow icon={<Calendar className="h-4 w-4" />} label="Joining Date" value={formatDate(employee.joiningDate)} />
              <InfoRow icon={<Clock className="h-4 w-4" />} label="Assigned Shift" value={employee.shiftName ?? '—'} />
              <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Sub Company" value={employee.subCompanyName} />
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'attendance' && (
        <Card>
          <CardHeader title={`Attendance — ${new Date(year, month - 1).toLocaleDateString('en', { month: 'long', year: 'numeric' })}`} />
          <CardBody className="p-0">
            {loadingAtt ? <Skeleton className="h-48 m-4" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <SortableTh label="Date" sortKey="date" activeKey={attSortKey} dir={attSortDir} onSort={onAttSort} />
                      <SortableTh label="Shift" sortKey="shiftName" activeKey={attSortKey} dir={attSortDir} onSort={onAttSort} />
                      <SortableTh label="Punch In" sortKey="firstPunchIn" activeKey={attSortKey} dir={attSortDir} onSort={onAttSort} />
                      <SortableTh label="Punch Out" sortKey="lastPunchOut" activeKey={attSortKey} dir={attSortDir} onSort={onAttSort} />
                      <SortableTh label="Working" sortKey="workingMinutes" activeKey={attSortKey} dir={attSortDir} onSort={onAttSort} />
                      <SortableTh label="Late" sortKey="lateMinutes" activeKey={attSortKey} dir={attSortDir} onSort={onAttSort} />
                      <SortableTh label="Status" sortKey="status" activeKey={attSortKey} dir={attSortDir} onSort={onAttSort} />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedMonthlyRecords.length === 0 ? (
                      <tr><td colSpan={7} className="py-12 text-center text-sm text-surface-400">No attendance records</td></tr>
                    ) : sortedMonthlyRecords.map((r) => (
                      <tr key={r.id} className="table-tr">
                        <td className="table-td font-medium">{formatDate(r.date, 'dd MMM')}</td>
                        <td className="table-td text-surface-600">{r.shiftName}</td>
                        <td className="table-td">{r.firstPunchIn ? formatTime(r.firstPunchIn) : '—'}</td>
                        <td className="table-td">{r.lastPunchOut ? formatTime(r.lastPunchOut) : '—'}</td>
                        <td className="table-td font-mono text-xs">{minutesToDisplay(r.workingMinutes)}</td>
                        <td className="table-td text-xs">{r.lateMinutes > 0 ? <span className="text-warning-600">{minutesToDisplay(r.lateMinutes)}</span> : '—'}</td>
                        <td className="table-td"><AttBadge status={r.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {activeTab === 'reports' && (
        <Card>
          <CardHeader title="Generate Reports" subtitle="Export attendance reports for this employee" />
          <CardBody>
            <div className="flex flex-wrap gap-3">
              {(['EXCEL', 'PDF', 'CSV'] as const).map((fmt) => (
                <Button
                  key={fmt}
                  variant="outline"
                  leftIcon={<Download className="h-4 w-4" />}
                  loading={generating === fmt}
                  onClick={() => handleExport(fmt)}
                >
                  Export {fmt}
                </Button>
              ))}
            </div>
            <p className="text-sm text-surface-500 mt-4">
              Reports are generated for the current month. Use the Reports module for custom date ranges.
            </p>
          </CardBody>
        </Card>
      )}
      <EmployeeFormDialog open={editOpen} onClose={() => setEditOpen(false)} employee={employee} />
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-surface-400 mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-surface-400">{label}</p>
        <p className="text-sm font-medium text-surface-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
