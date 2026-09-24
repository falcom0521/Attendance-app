import type { AttendanceRecord } from '@/types/attendance';
import type { LeaveType } from '@/types/request';
import { sleep } from '@/lib/utils';
import { todayISO } from '@/utils/date';
import { attendanceStore } from './attendanceStore';
import { getAllAttendanceRecords } from './attendance.service';
import { getEmployeesSnapshot } from './employee.service';
import { logActivity, getActivityActorName } from './activityLog.service';
import { assertWritable } from './writeGuard';

/**
 * A lightweight, direct alternative to the (currently disabled) Requests & Leaves approval workflow:
 * HR/Admin can flag a day that is already ABSENT as pre-approved leave in one step, with no separate
 * review. It only ever applies to a day the system currently has as ABSENT, and can be undone from the
 * same place. It does not touch leave balances — those belong to the fuller Requests module.
 */

const LEAVE_TYPE_LABEL: Record<LeaveType, string> = {
  CASUAL: 'Casual leave',
  SICK: 'Sick leave',
  EARNED: 'Earned leave',
  UNPAID: 'Unpaid leave',
};

export interface MarkLeavePayload {
  employeeId: string;
  date: string; // "YYYY-MM-DD"
  leaveType: LeaveType;
  reason: string;
}

function findRecord(employeeId: string, date: string): AttendanceRecord | undefined {
  return getAllAttendanceRecords().find((r) => r.employeeId === employeeId && r.date === date);
}

export const leaveMarkService = {
  async markPreApprovedLeave(payload: MarkLeavePayload): Promise<AttendanceRecord> {
    assertWritable();
    await sleep(500);

    const employee = getEmployeesSnapshot().find((e) => e.id === payload.employeeId);
    if (!employee) throw new Error('Employee not found');

    const today = todayISO();
    if (payload.date > today) throw new Error('Cannot mark a future date as leave');
    if (payload.date < employee.joiningDate) throw new Error('Date is before the employee joined');
    const reason = payload.reason.trim();
    if (reason.length < 5) throw new Error('Please provide a reason (min 5 characters)');

    const current = findRecord(payload.employeeId, payload.date);
    if (!current || current.status !== 'ABSENT') {
      throw new Error('Only a day currently marked Absent can be flagged as leave');
    }

    attendanceStore.setLeave({
      employeeId: payload.employeeId,
      date: payload.date,
      leaveType: payload.leaveType,
      requestId: '',
      source: 'DIRECT',
      reason,
      markedBy: getActivityActorName(),
      markedAt: new Date().toISOString(),
    });

    logActivity({
      action: 'APPROVED',
      module: 'Attendance',
      target: `${employee.fullName} (${employee.employeeCode}) - ${payload.date}`,
      details: `Marked as pre-approved ${LEAVE_TYPE_LABEL[payload.leaveType]}: ${reason}`,
      companyId: employee.companyId,
    });

    const updated = findRecord(payload.employeeId, payload.date);
    if (!updated) throw new Error('Could not compute attendance for this day');
    return updated;
  },

  /** Undoes a direct leave mark; the day reverts to Absent. Leave that came from an approved request is untouched. */
  async removeLeaveMark(employeeId: string, date: string): Promise<AttendanceRecord> {
    assertWritable();
    await sleep(400);

    const entry = attendanceStore.getLeave(employeeId, date);
    if (!entry) throw new Error('No leave mark exists for this day');
    if (entry.source !== 'DIRECT') throw new Error('This leave came from an approved request and cannot be undone here');

    const employee = getEmployeesSnapshot().find((e) => e.id === employeeId);
    attendanceStore.removeLeave(employeeId, date);

    logActivity({
      action: 'CANCELLED',
      module: 'Attendance',
      target: `${employee?.fullName ?? employeeId} - ${date}`,
      details: 'Pre-approved leave mark removed; day reverted to Absent',
      companyId: employee?.companyId,
    });

    const updated = findRecord(employeeId, date);
    if (!updated) throw new Error('Could not compute attendance for this day');
    return updated;
  },
};
