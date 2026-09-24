import { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, LogIn, LogOut, AlertTriangle, CheckCircle, Timer, Pencil, Plus, Trash2, CalendarCheck, CalendarX } from 'lucide-react';
// FileWarning, PenLine  — used by the disabled request buttons below
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { useToast } from '@/components/feedback/ToastContext';
import { useAttendanceRecord, useDeleteManualAttendance, useRemoveLeaveMark } from '../hooks/useAttendance';
import { ManualAttendanceDialog } from '../components/ManualAttendanceDialog';
import { MarkLeaveDialog } from '../components/MarkLeaveDialog';
// DISABLED (Requests & Leaves): commented out for now, re-enable later.
// import { useRequests } from '@/features/requests/hooks/useRequests';
// import { RequestFormDialog } from '@/features/requests/components/RequestFormDialog';
// import { RequestReviewDialog } from '@/features/requests/components/RequestReviewDialog';
import { REQUEST_TYPE_LABEL, LEAVE_TYPE_LABEL } from '@/features/requests/utils';
import { hasPermission } from '@/utils/permissions';
// import type { AttendanceRequest } from '@/types/request';
import type { LeaveType } from '@/types/request';
import { useEmployee } from '@/features/employees/hooks/useEmployees';
import { useAuthStore } from '@/store/authStore';
import { formatDate, formatDateTime, formatTime, minutesToDisplay, todayISO } from '@/utils/date';
import { cn } from '@/lib/utils';

export function AttendanceDetailPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const date = searchParams.get('date') ?? todayISO();

  const { data: employee, isLoading: loadEmp } = useEmployee(employeeId ?? '');
  const { data: record, isLoading: loadAtt } = useAttendanceRecord(employeeId ?? '', date);
  // const { data: dayRequests = [] } = useRequests({ employeeId: employeeId ?? '', date });
  const toast = useToast();
  const deleteManual = useDeleteManualAttendance();
  const removeLeaveMark = useRemoveLeaveMark();
  const [manualOpen, setManualOpen] = useState(false);
  // const [requestType, setRequestType] = useState<'MISSING_PUNCH' | 'REGULARIZATION' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [markLeaveOpen, setMarkLeaveOpen] = useState(false);
  const [confirmUndoLeave, setConfirmUndoLeave] = useState(false);
  // const [selectedRequest, setSelectedRequest] = useState<AttendanceRequest | null>(null);

  const basePath = user?.role === 'ADMIN' ? '/admin' : '/hr';
  const isLoading = loadEmp || loadAtt;
  const canManage = !!user && hasPermission(user.role, 'attendance:manage') && date <= todayISO();
  // const canRequest = !!user && hasPermission(user.role, 'requests:create') && date <= todayISO();
  // const needsFix = record && ['INCOMPLETE', 'ABSENT', 'LATE', 'EARLY_OUT'].includes(record.status);
  const canMarkLeave = canManage && record?.status === 'ABSENT';
  const canUndoLeave = canManage && record?.status === 'ON_LEAVE' && record?.leaveSource === 'DIRECT';

  async function handleDeleteManual() {
    try {
      await deleteManual.mutateAsync({ employeeId: employeeId ?? '', date });
      toast.success('Manual entry deleted', 'Attendance reverted to device punches');
    } catch (err) {
      toast.error('Could not delete entry', err instanceof Error ? err.message : undefined);
    } finally {
      setConfirmDelete(false);
    }
  }

  async function handleUndoLeave() {
    try {
      await removeLeaveMark.mutateAsync({ employeeId: employeeId ?? '', date });
      toast.success('Leave mark removed', 'Attendance reverted to Absent');
    } catch (err) {
      toast.error('Could not undo leave', err instanceof Error ? err.message : undefined);
    } finally {
      setConfirmUndoLeave(false);
    }
  }

  if (isLoading) return (
    <div className="page-container space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-48" />
      <Skeleton className="h-48" />
    </div>
  );

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(`${basePath}/attendance`)} leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Back
        </Button>
        <div className="h-4 w-px bg-surface-200" />
        <nav className="flex items-center gap-1 text-xs text-surface-400">
          <span>Attendance</span>
          <span>/</span>
          <span className="text-surface-700 font-medium">{employee?.fullName}</span>
          <span>/</span>
          <span>{formatDate(date)}</span>
        </nav>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {/* DISABLED (Requests & Leaves): re-enable later.
          {canRequest && needsFix && (
            record?.status === 'INCOMPLETE' ? (
              <Button variant="outline" size="sm" leftIcon={<FileWarning className="h-4 w-4" />} onClick={() => setRequestType('MISSING_PUNCH')}>
                Fix Missing Punch
              </Button>
            ) : (
              <Button variant="outline" size="sm" leftIcon={<PenLine className="h-4 w-4" />} onClick={() => setRequestType('REGULARIZATION')}>
                Request Regularization
              </Button>
            )
          )}
          */}
          {canMarkLeave && (
            <Button variant="outline" size="sm" leftIcon={<CalendarCheck className="h-4 w-4" />} onClick={() => setMarkLeaveOpen(true)}>
              Mark as Leave
            </Button>
          )}
          {canUndoLeave && (
            <Button variant="outline" size="sm" leftIcon={<CalendarX className="h-4 w-4" />} onClick={() => setConfirmUndoLeave(true)}>
              Undo Leave Mark
            </Button>
          )}
          {canManage && record?.isManual && (
            <Button variant="outline" size="sm" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => setConfirmDelete(true)}>
              Delete Manual Entry
            </Button>
          )}
          {canManage && (
            <Button size="sm" leftIcon={record?.isManual ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />} onClick={() => setManualOpen(true)}>
              {record?.isManual ? 'Edit Manual Entry' : 'Add Manual Entry'}
            </Button>
          )}
        </div>
      </div>

      {/* Employee + Date Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <Avatar name={employee?.fullName ?? 'E'} size="lg" />
              <div>
                <p className="font-semibold text-surface-900">{employee?.fullName}</p>
                <p className="text-sm text-surface-500">{employee?.designation}</p>
                <p className="text-xs font-mono text-surface-400">{employee?.employeeCode}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <p className="text-xs text-surface-400">Date</p>
              <p className="font-semibold text-surface-900">{formatDate(date, 'EEEE, dd MMM yyyy')}</p>
              <p className="text-xs text-surface-500">{record?.shiftName ?? employee?.shiftName}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-surface-400">Attendance Status</p>
              {record ? <StatusBadge status={record.status} /> : <Badge variant="surface">No Record</Badge>}
              {record?.leaveType && (
                <p className="text-xs text-surface-500 mt-1">{LEAVE_TYPE_LABEL[record.leaveType as LeaveType] ?? record.leaveType}</p>
              )}
              {record?.workingMinutes ? (
                <p className="text-xs text-surface-500 mt-1">
                  {minutesToDisplay(record.workingMinutes)} worked
                </p>
              ) : null}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Raw Punch Timeline */}
        <Card>
          <CardHeader title="Raw Punch Records" subtitle="Device punches, plus any punches added manually" />
          <CardBody>
            {!record || record.punchRecords.length === 0 ? (
              <p className="text-sm text-surface-400 text-center py-8">No punch records for this date</p>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-surface-100" />
                <div className="space-y-3 ml-10">
                  {record.punchRecords.map((p) => (
                    <div key={p.id} className="relative flex items-start gap-3">
                      <div className={cn(
                        'absolute -left-10 top-1 h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-bold',
                        p.punchType === 'IN' ? 'bg-success-500' : 'bg-danger-500'
                      )}>
                        {p.punchType === 'IN' ? <LogIn className="h-3 w-3" /> : <LogOut className="h-3 w-3" />}
                      </div>
                      <div className="flex-1 bg-surface-50 rounded-lg px-3 py-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-semibold text-surface-900">{formatTime(p.punchTime)}</span>
                          <Badge variant={p.punchType === 'IN' ? 'success' : 'danger'} size="sm">{p.punchType}</Badge>
                        </div>
                        <p className="text-xs text-surface-400 mt-0.5">{p.deviceName} · {p.deviceId}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Calculated Attendance */}
        <Card>
          <CardHeader title="Calculated Attendance" subtitle="System-computed attendance data" />
          <CardBody className="space-y-4">
            {!record ? (
              <p className="text-sm text-surface-400 text-center py-8">No attendance data available</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <CalcCard icon={<LogIn className="h-4 w-4 text-success-600" />} label="First Punch In" value={record.firstPunchIn ? formatTime(record.firstPunchIn) : '—'} color="success" />
                  <CalcCard icon={<LogOut className="h-4 w-4 text-danger-600" />} label="Last Punch Out" value={record.lastPunchOut ? formatTime(record.lastPunchOut) : '—'} color="danger" />
                  <CalcCard icon={<Clock className="h-4 w-4 text-brand-600" />} label="Working Hours" value={minutesToDisplay(record.workingMinutes)} color="brand" />
                  <CalcCard icon={<Clock className="h-4 w-4 text-surface-400" />} label="Break Duration" value={minutesToDisplay(record.breakMinutes)} color="surface" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <CalcCard
                    icon={<AlertTriangle className="h-4 w-4 text-warning-600" />}
                    label="Late By"
                    value={record.lateMinutes > 0 ? minutesToDisplay(record.lateMinutes) : '—'}
                    color={record.lateMinutes > 0 ? 'warning' : 'surface'}
                  />
                  <CalcCard
                    icon={<AlertTriangle className="h-4 w-4 text-orange-600" />}
                    label="Early Out"
                    value={record.earlyOutMinutes > 0 ? minutesToDisplay(record.earlyOutMinutes) : '—'}
                    color={record.earlyOutMinutes > 0 ? 'warning' : 'surface'}
                  />
                  <CalcCard
                    icon={<Timer className="h-4 w-4 text-brand-600" />}
                    label="Overtime"
                    value={record.overtimeMinutes > 0 ? minutesToDisplay(record.overtimeMinutes) : '—'}
                    color={record.overtimeMinutes > 0 ? 'brand' : 'surface'}
                  />
                </div>
                <div className="p-3 bg-surface-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success-500" />
                      <span className="text-sm font-medium text-surface-700">Final Status</span>
                    </div>
                    <StatusBadge status={record.status} />
                  </div>
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>

      {record?.isManual && (
        <Card className="mt-4">
          <CardHeader title="Manual Entry" subtitle="Punches added by hand on top of the device data" />
          <CardBody className="text-sm space-y-1.5">
            <p><span className="text-surface-400">Source: </span><Badge variant="brand" size="sm">{record.manualSource === 'MANUAL' ? 'Manual entry' : REQUEST_TYPE_LABEL[record.manualSource as 'REGULARIZATION' | 'MISSING_PUNCH']}</Badge></p>
            <p><span className="text-surface-400">Reason: </span>{record.manualReason}</p>
            <p className="text-xs text-surface-400">{record.manualBy}{record.manualAt && ` · ${formatDateTime(record.manualAt)}`}</p>
          </CardBody>
        </Card>
      )}

      {record?.status === 'ON_LEAVE' && (
        <Card className="mt-4">
          <CardHeader title="Leave Details" subtitle="Why this day is marked as leave" />
          <CardBody className="text-sm space-y-1.5">
            <p>
              <span className="text-surface-400">Type: </span>
              {LEAVE_TYPE_LABEL[record.leaveType as LeaveType] ?? record.leaveType}
              <Badge variant={record.leaveSource === 'DIRECT' ? 'brand' : 'info'} size="sm" className="ml-2">
                {record.leaveSource === 'DIRECT' ? 'Pre-approved (direct)' : 'Approved request'}
              </Badge>
            </p>
            {record.leaveReason && <p><span className="text-surface-400">Reason: </span>{record.leaveReason}</p>}
            {(record.leaveMarkedBy || record.leaveMarkedAt) && (
              <p className="text-xs text-surface-400">{record.leaveMarkedBy}{record.leaveMarkedAt && ` · ${formatDateTime(record.leaveMarkedAt)}`}</p>
            )}
          </CardBody>
        </Card>
      )}

      {/* DISABLED (Requests & Leaves): re-enable later.
      {dayRequests.length > 0 && (
        <Card className="mt-4">
          <CardHeader title="Requests for this day" subtitle="Corrections and leave covering this date" />
          <CardBody className="p-0 divide-y divide-surface-50">
            {dayRequests.map((r) => (
              <button key={r.id} onClick={() => setSelectedRequest(r)} className="w-full flex items-center justify-between gap-3 px-5 py-3 text-left hover:bg-surface-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-surface-900">{REQUEST_TYPE_LABEL[r.type]}</p>
                  <p className="text-xs text-surface-400">{r.requestedBy} · {formatDateTime(r.requestedAt)}</p>
                </div>
                <StatusBadge status={r.status} />
              </button>
            ))}
          </CardBody>
        </Card>
      )}
      */}

      {canManage && (
        <ManualAttendanceDialog
          open={manualOpen}
          onClose={() => setManualOpen(false)}
          initial={{ employeeId: employeeId ?? '', date }}
          editing={!!record?.isManual}
        />
      )}
      {/* DISABLED (Requests & Leaves): re-enable later.
      {canRequest && (
        <RequestFormDialog
          open={!!requestType}
          onClose={() => setRequestType(null)}
          lockType
          initial={{ type: requestType ?? 'REGULARIZATION', employeeId: employeeId ?? '', date }}
        />
      )}
      <RequestReviewDialog request={selectedRequest} onClose={() => setSelectedRequest(null)} />
      */}
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDeleteManual}
        title="Delete Manual Entry"
        description={`Remove the manual punches for ${employee?.fullName ?? 'this employee'} on ${formatDate(date)}? The day reverts to what the device recorded.`}
        confirmLabel="Delete"
        loading={deleteManual.isPending}
      />
      {canMarkLeave && (
        <MarkLeaveDialog
          open={markLeaveOpen}
          onClose={() => setMarkLeaveOpen(false)}
          employeeId={employeeId ?? ''}
          employeeName={employee?.fullName ?? 'this employee'}
          date={date}
        />
      )}
      <ConfirmDialog
        open={confirmUndoLeave}
        onClose={() => setConfirmUndoLeave(false)}
        onConfirm={handleUndoLeave}
        title="Undo Leave Mark"
        description={`Remove the pre-approved leave mark for ${employee?.fullName ?? 'this employee'} on ${formatDate(date)}? The day reverts to Absent.`}
        confirmLabel="Undo"
        loading={removeLeaveMark.isPending}
      />
    </div>
  );
}

function CalcCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const bg: Record<string, string> = {
    success: 'bg-success-50', danger: 'bg-danger-50', brand: 'bg-brand-50',
    warning: 'bg-warning-50', surface: 'bg-surface-50',
  };
  return (
    <div className={cn('rounded-xl p-3', bg[color] ?? 'bg-surface-50')}>
      <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-surface-500">{label}</span></div>
      <p className="font-mono font-bold text-surface-900">{value}</p>
    </div>
  );
}
