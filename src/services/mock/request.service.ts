import type {
  AttendanceRequest,
  CreateRequestPayload,
  LeaveBalance,
  LeaveType,
  RequestActor,
  RequestFilters,
  RequestType,
} from '@/types/request';
import type { Employee } from '@/types/employee';
import { sleep } from '@/lib/utils';
import { addDaysToDate, todayISO } from '@/utils/date';
import { differenceInCalendarDays, eachDayOfInterval, format, parseISO } from 'date-fns';
import { attendanceStore } from './attendanceStore';
import { applyManualEntry } from './manualAttendance.service';
import { getAllAttendanceRecords } from './attendance.service';
import { getEmployeesSnapshot } from './employee.service';
import { getHolidaysSnapshot } from './holiday.service';
import { logActivity } from './activityLog.service';

export const LEAVE_QUOTA: Record<Exclude<LeaveType, 'UNPAID'>, number> = {
  CASUAL: 12,
  SICK: 10,
  EARNED: 15,
};

const REQUEST_TYPE_LABEL: Record<RequestType, string> = {
  REGULARIZATION: 'Regularization',
  MISSING_PUNCH: 'Missing punch',
  LEAVE: 'Leave',
};

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const requests: AttendanceRequest[] = [];
let seeded = false;
let counter = 0;

// ── Helpers ──────────────────────────────────────────────────────────────────
function findEmployee(id: string): Employee {
  const employee = getEmployeesSnapshot().find((e) => e.id === id);
  if (!employee) throw new Error('Employee not found');
  return employee;
}

/** Days in the range that are actual working days for this employee (not weekly off / holiday). */
export function workingDaysBetween(employee: Employee, start: string, end: string): string[] {
  const holidays = new Set(
    getHolidaysSnapshot()
      .filter((h) => h.subCompanyId === employee.subCompanyId && h.status === 'ACTIVE')
      .map((h) => h.date)
  );
  return eachDayOfInterval({ start: parseISO(start), end: parseISO(end) })
    .map((d) => ({ d, date: format(d, 'yyyy-MM-dd') }))
    .filter(({ d, date }) => !employee.weeklyOff.includes(DAY_NAMES[d.getDay()] ?? '') && !holidays.has(date))
    .map(({ date }) => date);
}

function leaveDaysUsed(employeeId: string, year: number, type: LeaveType, status: 'APPROVED' | 'PENDING'): number {
  return requests
    .filter(
      (r) =>
        r.type === 'LEAVE' &&
        r.employeeId === employeeId &&
        r.leaveType === type &&
        r.status === status &&
        parseISO(r.date).getFullYear() === year
    )
    .reduce((sum, r) => sum + (r.leaveDays ?? 0), 0);
}

function newId(): string {
  counter += 1;
  return `req-${String(counter).padStart(4, '0')}`;
}

function apply(request: AttendanceRequest, reviewerName: string): void {
  if (request.type === 'LEAVE') {
    const employee = findEmployee(request.employeeId);
    for (const date of workingDaysBetween(employee, request.date, request.endDate ?? request.date)) {
      attendanceStore.setLeave({
        employeeId: request.employeeId,
        date,
        leaveType: request.leaveType ?? 'CASUAL',
        requestId: request.id,
        source: 'REQUEST',
        reason: request.reason,
        markedBy: reviewerName,
        markedAt: new Date().toISOString(),
      });
    }
    return;
  }
  applyManualEntry({
    employeeId: request.employeeId,
    date: request.date,
    punches: request.punches ?? [],
    reason: `${REQUEST_TYPE_LABEL[request.type]} approved: ${request.reason}`,
    source: request.type,
    by: reviewerName,
  });
}

function validate(payload: CreateRequestPayload, employee: Employee): { leaveDays?: number } {
  if (payload.reason.trim().length < 5) throw new Error('Please provide a reason (min 5 characters)');
  if (payload.date < employee.joiningDate) throw new Error('Date is before the employee joined');

  if (payload.type === 'LEAVE') {
    const end = payload.endDate ?? payload.date;
    if (!payload.leaveType) throw new Error('Select a leave type');
    if (end < payload.date) throw new Error('End date cannot be before start date');
    if (differenceInCalendarDays(parseISO(end), parseISO(payload.date)) > 60) {
      throw new Error('Leave cannot span more than 60 days');
    }
    const days = workingDaysBetween(employee, payload.date, end);
    if (days.length === 0) throw new Error('Selected dates fall entirely on weekly offs or holidays');

    const overlapping = requests.find(
      (r) =>
        r.type === 'LEAVE' &&
        r.employeeId === employee.id &&
        (r.status === 'PENDING' || r.status === 'APPROVED') &&
        r.date <= end &&
        (r.endDate ?? r.date) >= payload.date
    );
    if (overlapping) throw new Error('This overlaps an existing leave request for the employee');

    if (payload.leaveType !== 'UNPAID') {
      const year = parseISO(payload.date).getFullYear();
      const remaining =
        LEAVE_QUOTA[payload.leaveType] -
        leaveDaysUsed(employee.id, year, payload.leaveType, 'APPROVED') -
        leaveDaysUsed(employee.id, year, payload.leaveType, 'PENDING');
      if (days.length > remaining) {
        throw new Error(`Only ${Math.max(remaining, 0)} day(s) of ${payload.leaveType.toLowerCase()} leave remaining`);
      }
    }
    return { leaveDays: days.length };
  }

  // Attendance corrections
  if (payload.date > todayISO()) throw new Error('Cannot correct attendance for a future date');
  const entries = payload.punches ?? [];
  if (!entries.some((p) => p.punchIn || p.punchOut)) throw new Error('Enter at least one punch time');
  const duplicate = requests.find(
    (r) =>
      r.type === payload.type &&
      r.employeeId === employee.id &&
      r.date === payload.date &&
      r.status === 'PENDING'
  );
  if (duplicate) throw new Error('A pending request already exists for this employee and date');

  if (payload.type === 'MISSING_PUNCH') {
    const record = getAllAttendanceRecords().find((r) => r.employeeId === employee.id && r.date === payload.date);
    if (!record || record.status !== 'INCOMPLETE') {
      throw new Error('This day has no missing punch — use a regularization request instead');
    }
  }
  return {};
}

function ensureSeeded(): void {
  if (seeded) return;
  seeded = true;

  const today = todayISO();
  const ago = (n: number) => addDaysToDate(today, -n);
  const ahead = (n: number) => addDaysToDate(today, n);
  const hr1 = { name: 'Divya Menon', role: 'HR' as const };
  const hr2 = { name: 'Priya Reddy', role: 'HR' as const };
  const hr3 = { name: 'Arun Chandran', role: 'HR' as const };
  const admin = 'Meera Nambiar';

  const seed = (
    employeeId: string,
    r: Partial<AttendanceRequest> & Pick<AttendanceRequest, 'type' | 'status' | 'date' | 'reason'>,
    by: { name: string; role: 'HR' | 'ADMIN' },
    hoursAgo: number
  ) => {
    const employee = findEmployee(employeeId);
    const request: AttendanceRequest = {
      id: newId(),
      employeeId,
      employeeCode: employee.employeeCode,
      employeeName: employee.fullName,
      department: employee.department,
      companyId: employee.companyId,
      subCompanyId: employee.subCompanyId,
      subCompanyName: employee.subCompanyName,
      requestedBy: by.name,
      requestedByRole: by.role,
      requestedAt: new Date(Date.now() - hoursAgo * 3600_000).toISOString(),
      ...r,
    };
    if (request.type === 'LEAVE') {
      request.leaveDays = workingDaysBetween(employee, request.date, request.endDate ?? request.date).length;
    }
    requests.push(request);
    if (request.status === 'APPROVED') apply(request, request.reviewedBy ?? admin);
  };

  seed('emp-006', { type: 'MISSING_PUNCH', status: 'PENDING', date: today, punches: [{ punchIn: '', punchOut: '18:05' }], reason: 'Forgot to punch out; left at 6:05 PM after the release call' }, hr1, 2);
  seed('emp-004', { type: 'REGULARIZATION', status: 'PENDING', date: today, punches: [{ punchIn: '09:05', punchOut: '18:00' }], reason: 'Device rejected the evening punch; worked full day' }, hr1, 5);
  seed('emp-002', { type: 'LEAVE', status: 'PENDING', leaveType: 'CASUAL', date: ahead(3), endDate: ahead(5), reason: 'Family function out of town' }, hr1, 20);
  seed('emp-017', { type: 'LEAVE', status: 'PENDING', leaveType: 'SICK', date: ahead(1), endDate: ahead(3), reason: 'Viral fever, doctor advised rest' }, hr2, 7);
  seed('emp-022', { type: 'REGULARIZATION', status: 'PENDING', date: ago(1), punches: [{ punchIn: '09:00', punchOut: '18:10' }], reason: 'Biometric reader was offline in the morning' }, hr3, 26);
  seed('emp-003', { type: 'LEAVE', status: 'APPROVED', leaveType: 'CASUAL', date: ago(20), endDate: ago(18), reason: 'Personal work', reviewedBy: admin, reviewComment: 'Approved', reviewedAt: new Date(Date.now() - 22 * 86400_000).toISOString() }, hr1, 24 * 23);
  seed('emp-021', { type: 'LEAVE', status: 'APPROVED', leaveType: 'EARNED', date: ago(30), endDate: ago(27), reason: 'Vacation', reviewedBy: admin, reviewComment: 'Enjoy the break', reviewedAt: new Date(Date.now() - 33 * 86400_000).toISOString() }, hr3, 24 * 34);
  seed('emp-005', { type: 'REGULARIZATION', status: 'APPROVED', date: ago(8), punches: [{ punchIn: '09:00', punchOut: '18:10' }], reason: 'Device offline during the outage', reviewedBy: admin, reviewComment: 'Verified with the security log', reviewedAt: new Date(Date.now() - 7 * 86400_000).toISOString() }, hr1, 24 * 7.5);
  seed('emp-013', { type: 'REGULARIZATION', status: 'REJECTED', date: ago(5), punches: [{ punchIn: '09:00', punchOut: '18:00' }], reason: 'Was working from client site', reviewedBy: admin, reviewComment: 'No approval from the reporting manager on record', reviewedAt: new Date(Date.now() - 4 * 86400_000).toISOString() }, hr1, 24 * 5);
}

// ── Service ──────────────────────────────────────────────────────────────────
export const requestService = {
  async getRequests(filters?: RequestFilters): Promise<AttendanceRequest[]> {
    await sleep(350);
    ensureSeeded();
    const q = filters?.search?.toLowerCase();
    return requests
      .filter((r) => {
        if (filters?.companyId && r.companyId !== filters.companyId) return false;
        if (filters?.subCompanyId && r.subCompanyId !== filters.subCompanyId) return false;
        if (filters?.status && r.status !== filters.status) return false;
        if (filters?.type && r.type !== filters.type) return false;
        if (filters?.employeeId && r.employeeId !== filters.employeeId) return false;
        if (filters?.date && !(r.date <= filters.date && (r.endDate ?? r.date) >= filters.date)) return false;
        if (q && !r.employeeName.toLowerCase().includes(q) && !r.employeeCode.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  },

  async createRequest(payload: CreateRequestPayload, actor: RequestActor): Promise<AttendanceRequest> {
    await sleep(600);
    ensureSeeded();
    const employee = findEmployee(payload.employeeId);
    const { leaveDays } = validate(payload, employee);

    const request: AttendanceRequest = {
      id: newId(),
      type: payload.type,
      status: 'PENDING',
      employeeId: employee.id,
      employeeCode: employee.employeeCode,
      employeeName: employee.fullName,
      department: employee.department,
      companyId: employee.companyId,
      subCompanyId: employee.subCompanyId,
      subCompanyName: employee.subCompanyName,
      date: payload.date,
      endDate: payload.type === 'LEAVE' ? payload.endDate ?? payload.date : undefined,
      punches: payload.punches,
      leaveType: payload.leaveType,
      leaveDays,
      reason: payload.reason.trim(),
      requestedBy: actor.name,
      requestedByRole: actor.role,
      requestedAt: new Date().toISOString(),
    };

    // Admin-raised requests need no second approver.
    if (actor.role === 'ADMIN') {
      apply(request, actor.name);
      request.status = 'APPROVED';
      request.reviewedBy = actor.name;
      request.reviewedAt = request.requestedAt;
      request.reviewComment = 'Auto-approved (raised by Admin)';
    }
    requests.push(request);
    logActivity({ action: 'CREATED', module: 'Requests', target: `${REQUEST_TYPE_LABEL[request.type]} - ${request.employeeName}`, targetId: request.id, details: request.status === 'APPROVED' ? 'Auto-approved (raised by Admin)' : 'Submitted for approval', companyId: request.companyId });
    return request;
  },

  async reviewRequest(
    id: string,
    decision: 'APPROVED' | 'REJECTED',
    comment: string,
    reviewer: RequestActor
  ): Promise<AttendanceRequest> {
    await sleep(500);
    ensureSeeded();
    if (reviewer.role !== 'ADMIN') throw new Error('Only an Admin can approve or reject requests');
    const request = requests.find((r) => r.id === id);
    if (!request) throw new Error('Request not found');
    if (request.status !== 'PENDING') throw new Error(`Request is already ${request.status.toLowerCase()}`);
    if (decision === 'REJECTED' && comment.trim().length < 3) throw new Error('A comment is required to reject');

    if (decision === 'APPROVED') apply(request, reviewer.name);
    request.status = decision;
    request.reviewedBy = reviewer.name;
    request.reviewComment = comment.trim() || undefined;
    request.reviewedAt = new Date().toISOString();
    logActivity({ action: decision, module: 'Requests', target: `${REQUEST_TYPE_LABEL[request.type]} - ${request.employeeName}`, targetId: request.id, details: request.reviewComment ?? '', companyId: request.companyId });
    return request;
  },

  /** Withdraws a pending request. Admins can also revoke an already-approved leave. */
  async cancelRequest(id: string, actor: RequestActor): Promise<AttendanceRequest> {
    await sleep(400);
    ensureSeeded();
    const request = requests.find((r) => r.id === id);
    if (!request) throw new Error('Request not found');
    const revokingLeave = request.status === 'APPROVED' && request.type === 'LEAVE' && actor.role === 'ADMIN';
    if (request.status !== 'PENDING' && !revokingLeave) throw new Error('Only pending requests can be cancelled');
    if (revokingLeave) attendanceStore.removeLeaveByRequest(request.id);
    request.status = 'CANCELLED';
    request.reviewedBy = actor.name;
    request.reviewedAt = new Date().toISOString();
    request.reviewComment = revokingLeave ? 'Leave revoked' : 'Cancelled by requester';
    logActivity({ action: 'CANCELLED', module: 'Requests', target: `${REQUEST_TYPE_LABEL[request.type]} - ${request.employeeName}`, targetId: request.id, details: request.reviewComment, companyId: request.companyId });
    return request;
  },

  async getLeaveBalances(params: {
    companyId?: string;
    subCompanyId?: string;
    year?: number;
    search?: string;
  }): Promise<LeaveBalance[]> {
    await sleep(350);
    ensureSeeded();
    const year = params.year ?? new Date().getFullYear();
    const q = params.search?.toLowerCase();
    return getEmployeesSnapshot()
      .filter((e) => {
        if (e.status !== 'ACTIVE') return false;
        if (params.companyId && e.companyId !== params.companyId) return false;
        if (params.subCompanyId && e.subCompanyId !== params.subCompanyId) return false;
        if (q && !e.fullName.toLowerCase().includes(q) && !e.employeeCode.toLowerCase().includes(q)) return false;
        return true;
      })
      .map((e) => {
        const bucket = (type: Exclude<LeaveType, 'UNPAID'>) => ({
          total: LEAVE_QUOTA[type],
          used: leaveDaysUsed(e.id, year, type, 'APPROVED'),
          pending: leaveDaysUsed(e.id, year, type, 'PENDING'),
        });
        return {
          employeeId: e.id,
          employeeCode: e.employeeCode,
          employeeName: e.fullName,
          department: e.department,
          subCompanyId: e.subCompanyId,
          subCompanyName: e.subCompanyName,
          year,
          balances: {
            CASUAL: bucket('CASUAL'),
            SICK: bucket('SICK'),
            EARNED: bucket('EARNED'),
            UNPAID: {
              used: leaveDaysUsed(e.id, year, 'UNPAID', 'APPROVED'),
              pending: leaveDaysUsed(e.id, year, 'UNPAID', 'PENDING'),
            },
          },
        };
      })
      .sort((a, b) => a.employeeCode.localeCompare(b.employeeCode));
  },
};
