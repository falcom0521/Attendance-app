import type { AttendanceRecord, AttendanceFilters, DailyAttendanceStats } from '@/types/attendance';
import { sleep } from '@/lib/utils';
import { format, parseISO, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { buildBaseRecords } from './attendanceHistory';
import { attendanceStore, recordKey } from './attendanceStore';
import {
  buildAttendanceRecord,
  buildManualPunches,
  buildNonWorkingRecord,
  MANUAL_DEVICE_ID,
} from './attendanceEngine';
import { getEmployeesSnapshot } from './employee.service';
import { getShiftsSnapshot } from './shift.service';
import { getHolidaysSnapshot } from './holiday.service';
import { getAttendanceSettingsSync } from './settings.service';

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

function shiftFor(employeeId: string) {
  const employee = getEmployeesSnapshot().find((e) => e.id === employeeId);
  if (!employee) return undefined;
  const shifts = getShiftsSnapshot();
  const shift =
    shifts.find((s) => s.id === employee.shiftId) ??
    shifts.find((s) => s.subCompanyId === employee.subCompanyId);
  return shift ? { employee, shift } : undefined;
}

let resolved: { signature: string; records: AttendanceRecord[] } | null = null;

/**
 * Device records with late / early-out / overtime recomputed from the raw punches, so changes to
 * attendance settings, shift timings or an employee's shift show up in history too.
 */
function resolvedBaseRecords(): AttendanceRecord[] {
  const base = buildBaseRecords();
  const signature = JSON.stringify([
    [...new Set(base.map((r) => r.companyId))].map((c) => getAttendanceSettingsSync(c)),
    getShiftsSnapshot().map((s) => [s.id, s.startTime, s.endTime, s.gracePeriodMinutes]),
    getEmployeesSnapshot().map((e) => [e.id, e.shiftId]),
  ]);
  if (resolved?.signature === signature) return resolved.records;

  const records = base.map((r) => {
    if (r.punchRecords.length === 0) return r;
    const ctx = shiftFor(r.employeeId);
    if (!ctx) return r;
    return buildAttendanceRecord({
      employee: ctx.employee,
      shift: ctx.shift,
      date: r.date,
      punches: r.punchRecords,
      meta: { id: r.id },
    });
  });
  resolved = { signature, records };
  return records;
}

/**
 * Every attendance record: device data merged with manual entries and approved leave.
 * Manual punches are added to the day's raw device punches (never replace them).
 */
export function getAllAttendanceRecords(): AttendanceRecord[] {
  const map = new Map<string, AttendanceRecord>();
  for (const r of resolvedBaseRecords()) map.set(recordKey(r.employeeId, r.date), r);

  for (const entry of attendanceStore.allManual()) {
    const ctx = shiftFor(entry.employeeId);
    if (!ctx) continue;
    const key = recordKey(entry.employeeId, entry.date);
    const devicePunches = (map.get(key)?.punchRecords ?? []).filter((p) => p.deviceId !== MANUAL_DEVICE_ID);
    const manualPunches = buildManualPunches(ctx.employee, entry.date, entry.entries);
    map.set(
      key,
      buildAttendanceRecord({
        employee: ctx.employee,
        shift: ctx.shift,
        date: entry.date,
        punches: [...devicePunches, ...manualPunches],
        meta: {
          id: map.get(key)?.id ?? `att-${entry.employeeId}-${entry.date}`,
          isManual: true,
          manualReason: entry.reason,
          manualSource: entry.source,
          manualBy: entry.by,
          manualAt: entry.at,
        },
      })
    );
  }

  for (const leave of attendanceStore.allLeave()) {
    const key = recordKey(leave.employeeId, leave.date);
    const existing = map.get(key);
    // Approved leave overrides device data, but not an explicit manual correction for that day.
    if (existing?.isManual) continue;
    const ctx = shiftFor(leave.employeeId);
    if (!ctx) continue;
    map.set(
      key,
      buildNonWorkingRecord(ctx.employee, ctx.shift, leave.date, 'ON_LEAVE', {
        id: existing?.id,
        leaveType: leave.leaveType,
        leaveRequestId: leave.requestId,
        leaveSource: leave.source,
        leaveReason: leave.reason,
        leaveMarkedBy: leave.markedBy,
        leaveMarkedAt: leave.markedAt,
      })
    );
  }

  return [...map.values()];
}

export function getRecordsForDate(date: string): AttendanceRecord[] {
  return getAllAttendanceRecords().filter((r) => r.date === date);
}

function scopeFilter(r: AttendanceRecord, f?: AttendanceFilters): boolean {
  if (f?.companyId && r.companyId !== f.companyId) return false;
  if (f?.subCompanyId && r.subCompanyId !== f.subCompanyId) return false;
  if (f?.departmentId && r.department !== f.departmentId) return false;
  if (f?.employeeId && r.employeeId !== f.employeeId) return false;
  return true;
}

export const attendanceService = {
  async getDailyAttendance(
    filters?: AttendanceFilters
  ): Promise<{ records: AttendanceRecord[]; stats: DailyAttendanceStats }> {
    await sleep(400);

    const filtered = getAllAttendanceRecords()
      .filter((r) => {
        if (filters?.date && r.date !== filters.date) return false;
        if (!scopeFilter(r, filters)) return false;
        if (filters?.status && r.status !== filters.status) return false;
        if (filters?.search) {
          const q = filters.search.toLowerCase();
          if (!r.employeeName.toLowerCase().includes(q) && !r.employeeCode.toLowerCase().includes(q)) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => a.employeeCode.localeCompare(b.employeeCode));

    const count = (s: AttendanceRecord['status']) => filtered.filter((r) => r.status === s).length;
    const stats: DailyAttendanceStats = {
      total: filtered.length,
      present: count('PRESENT'),
      absent: count('ABSENT'),
      late: count('LATE'),
      earlyOut: count('EARLY_OUT'),
      missingPunch: count('INCOMPLETE'),
      onLeave: count('ON_LEAVE'),
      holiday: count('HOLIDAY'),
      weeklyOff: count('WEEKLY_OFF'),
      overtimeMinutes: filtered.reduce((sum, r) => sum + r.overtimeMinutes, 0),
    };

    return { records: filtered, stats };
  },

  async getEmployeeMonthlyAttendance(
    employeeId: string,
    month: number,
    year: number
  ): Promise<AttendanceRecord[]> {
    await sleep(300);
    return getAllAttendanceRecords()
      .filter((r) => {
        if (r.employeeId !== employeeId) return false;
        const d = parseISO(r.date);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  async getAttendanceRecord(employeeId: string, date: string): Promise<AttendanceRecord | undefined> {
    await sleep(150);
    return getAllAttendanceRecords().find((r) => r.employeeId === employeeId && r.date === date);
  },

  async getMonthlyAttendance(filters: AttendanceFilters): Promise<AttendanceRecord[]> {
    await sleep(400);

    let base = getAllAttendanceRecords().filter((r) => {
      const d = parseISO(r.date);
      if (filters.month && d.getMonth() + 1 !== filters.month) return false;
      if (filters.year && d.getFullYear() !== filters.year) return false;
      return scopeFilter(r, filters);
    });

    // Single-employee view: fill days the device history doesn't cover so the month is complete.
    if (filters.employeeId && filters.month && filters.year) {
      const ctx = shiftFor(filters.employeeId);
      if (ctx) {
        const have = new Set(base.map((r) => r.date));
        const days = eachDayOfInterval({
          start: startOfMonth(new Date(filters.year, filters.month - 1)),
          end: endOfMonth(new Date(filters.year, filters.month - 1)),
        });
        const today = format(new Date(), 'yyyy-MM-dd');
        const holidays = new Set(
          getHolidaysSnapshot()
            .filter((h) => h.subCompanyId === ctx.employee.subCompanyId && h.status === 'ACTIVE')
            .map((h) => h.date)
        );
        for (const day of days) {
          const date = format(day, 'yyyy-MM-dd');
          if (date > today || date < ctx.employee.joiningDate || have.has(date)) continue;
          const weeklyOff = ctx.employee.weeklyOff.includes(DAY_NAMES[day.getDay()] ?? '');
          const status = weeklyOff ? 'WEEKLY_OFF' : holidays.has(date) ? 'HOLIDAY' : 'ABSENT';
          base.push(buildNonWorkingRecord(ctx.employee, ctx.shift, date, status));
        }
        base = base.sort((a, b) => a.date.localeCompare(b.date));
      }
    }

    return base.sort((a, b) => a.date.localeCompare(b.date) || a.employeeCode.localeCompare(b.employeeCode));
  },
};
