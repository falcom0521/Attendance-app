import type { AttendanceRecord, AttendanceStatus, ManualPunchEntry, PunchRecord } from '@/types/attendance';
import type { Employee } from '@/types/employee';
import type { Shift } from '@/types/shift';
import { addDaysToDate } from '@/utils/date';
import { calculateAttendance } from '@/utils/attendance';
import { getAttendanceSettingsSync } from './settings.service';

export const MANUAL_DEVICE_ID = 'MANUAL';

/** "YYYY-MM-DDTHH:mm:00" for a minute-of-day offset; offsets ≥ 1440 roll into the next day. */
export function isoAtMinutes(date: string, minutes: number): string {
  const dayOffset = Math.floor(minutes / 1440);
  const inDay = minutes - dayOffset * 1440;
  const d = dayOffset ? addDaysToDate(date, dayOffset) : date;
  const hh = String(Math.floor(inDay / 60)).padStart(2, '0');
  const mm = String(inDay % 60).padStart(2, '0');
  return `${d}T${hh}:${mm}:00`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Turns "HH:mm" entries into manual punch records; an OUT earlier than its IN is treated as next-day. */
export function buildManualPunches(
  employee: Employee,
  date: string,
  entries: ManualPunchEntry[]
): PunchRecord[] {
  const punches: PunchRecord[] = [];
  const base = {
    employeeId: employee.id,
    employeeCode: employee.employeeCode,
    employeeName: employee.fullName,
    deviceId: MANUAL_DEVICE_ID,
    deviceName: 'Manual Entry',
    companyId: employee.companyId,
    subCompanyId: employee.subCompanyId,
    date,
  };
  entries.forEach((p, i) => {
    if (p.punchIn) {
      punches.push({
        ...base,
        id: `manual-${employee.id}-${date}-in-${i}`,
        punchTime: isoAtMinutes(date, timeToMinutes(p.punchIn)),
        punchType: 'IN',
      });
    }
    if (p.punchOut) {
      const inMin = p.punchIn ? timeToMinutes(p.punchIn) : -1;
      const outMin = timeToMinutes(p.punchOut);
      punches.push({
        ...base,
        id: `manual-${employee.id}-${date}-out-${i}`,
        punchTime: isoAtMinutes(date, p.punchIn && outMin <= inMin ? outMin + 1440 : outMin),
        punchType: 'OUT',
      });
    }
  });
  return punches;
}

function baseRecord(employee: Employee, shift: Shift, date: string): AttendanceRecord {
  return {
    id: `att-${employee.id}-${date}`,
    employeeId: employee.id,
    employeeCode: employee.employeeCode,
    employeeName: employee.fullName,
    department: employee.department,
    designation: employee.designation,
    date,
    shiftId: shift.id,
    shiftName: shift.name,
    shiftStartTime: shift.startTime,
    shiftEndTime: shift.endTime,
    punchRecords: [],
    workingMinutes: 0,
    breakMinutes: 0,
    lateMinutes: 0,
    earlyOutMinutes: 0,
    overtimeMinutes: 0,
    status: 'ABSENT',
    companyId: employee.companyId,
    subCompanyId: employee.subCompanyId,
    subCompanyName: employee.subCompanyName,
  };
}

/** Computes a full attendance record (status, late, early-out, overtime) from a day's punches. */
export function buildAttendanceRecord(args: {
  employee: Employee;
  shift: Shift;
  date: string;
  punches: PunchRecord[];
  meta?: Partial<AttendanceRecord>;
}): AttendanceRecord {
  const { employee, shift, date, meta } = args;
  const settings = getAttendanceSettingsSync(employee.companyId);
  const punches = [...args.punches].sort((a, b) => a.punchTime.localeCompare(b.punchTime));

  // Punches exist, so the day is treated as worked — weekly off / holiday are decided by the caller.
  const calc = calculateAttendance({
    date,
    shift,
    punches,
    holidays: [],
    weeklyOff: [],
    lateGracePeriodMinutes: shift.gracePeriodMinutes ?? settings.lateGracePeriodMinutes,
    earlyOutThresholdMinutes: settings.earlyOutThresholdMinutes,
    overtimeEnabled: settings.overtimeEnabled,
    overtimeThresholdMinutes: settings.overtimeThresholdMinutes,
  });

  return {
    ...baseRecord(employee, shift, date),
    ...calc,
    punchRecords: punches,
    ...meta,
  };
}

export function buildNonWorkingRecord(
  employee: Employee,
  shift: Shift,
  date: string,
  status: Extract<AttendanceStatus, 'WEEKLY_OFF' | 'HOLIDAY' | 'ON_LEAVE' | 'ABSENT'>,
  meta?: Partial<AttendanceRecord>
): AttendanceRecord {
  return { ...baseRecord(employee, shift, date), status, ...meta };
}
