import type { AttendanceRecord, ManualPunchEntry, ManualSource } from '@/types/attendance';
import { sleep } from '@/lib/utils';
import { format } from 'date-fns';
import { attendanceStore, type ManualEntry } from './attendanceStore';
import { getAllAttendanceRecords } from './attendance.service';
import { getEmployeesSnapshot } from './employee.service';
import { logActivity } from './activityLog.service';

export type { ManualPunchEntry } from '@/types/attendance';

export interface ManualAttendancePayload {
  employeeId: string;
  date: string; // "YYYY-MM-DD"
  punches: ManualPunchEntry[];
  reason: string;
  source?: ManualSource;
  /** Display name of whoever is making the entry. */
  by?: string;
}

/** Validates and stores a manual entry. Shared by direct entry and approved requests. */
export function applyManualEntry(payload: ManualAttendancePayload): AttendanceRecord {
  const employee = getEmployeesSnapshot().find((e) => e.id === payload.employeeId);
  if (!employee) throw new Error('Employee not found');

  const today = format(new Date(), 'yyyy-MM-dd');
  if (payload.date > today) throw new Error('Cannot enter attendance for a future date');
  if (payload.date < employee.joiningDate) throw new Error('Date is before the employee joined');
  if (!payload.punches.some((p) => p.punchIn || p.punchOut)) {
    throw new Error('At least one punch time is required');
  }

  const entry: ManualEntry = {
    employeeId: payload.employeeId,
    date: payload.date,
    entries: payload.punches,
    reason: payload.reason,
    source: payload.source ?? 'MANUAL',
    by: payload.by ?? 'System',
    at: new Date().toISOString(),
  };
  attendanceStore.setManual(entry);

  const record = getAllAttendanceRecords().find(
    (r) => r.employeeId === payload.employeeId && r.date === payload.date
  );
  if (!record) throw new Error('Could not compute attendance for this day');
  return record;
}

export const manualAttendanceService = {
  async addManualAttendance(payload: ManualAttendancePayload): Promise<AttendanceRecord> {
    await sleep(700);
    const record = applyManualEntry(payload);
    logActivity({ action: 'CREATED', module: 'Attendance', target: `${record.employeeName} (${record.employeeCode}) - ${record.date}`, details: `Manual entry: ${payload.reason}`, companyId: record.companyId });
    return record;
  },

  /** Edits an existing manual entry (same store key, so this replaces it). */
  async updateManualAttendance(payload: ManualAttendancePayload): Promise<AttendanceRecord> {
    await sleep(600);
    const existing = attendanceStore.getManual(payload.employeeId, payload.date);
    if (!existing) throw new Error('No manual entry exists for this day');
    const record = applyManualEntry({ ...payload, source: existing.source });
    logActivity({ action: 'UPDATED', module: 'Attendance', target: `${record.employeeName} (${record.employeeCode}) - ${record.date}`, details: 'Manual entry edited', companyId: record.companyId });
    return record;
  },

  /** Removes the manual punches; the day reverts to whatever the device recorded. */
  async deleteManualAttendance(employeeId: string, date: string): Promise<void> {
    await sleep(400);
    if (!attendanceStore.deleteManual(employeeId, date)) {
      throw new Error('No manual entry exists for this day');
    }
    const employee = getEmployeesSnapshot().find((e) => e.id === employeeId);
    logActivity({ action: 'DELETED', module: 'Attendance', target: `${employee?.fullName ?? employeeId} - ${date}`, details: 'Manual entry deleted', companyId: employee?.companyId });
  },

  async getManualEntry(employeeId: string, date: string): Promise<ManualEntry | undefined> {
    await sleep(100);
    return attendanceStore.getManual(employeeId, date);
  },
};
