import type { AttendanceRecord, AttendanceStatus, PunchRecord } from '@/types/attendance';
import type { Shift } from '@/types/shift';
import type { Holiday } from '@/types/holiday';
import { parseISO, differenceInMinutes, format } from 'date-fns';
import { buildDateTime, parseTimeToMinutes } from './date';

export interface AttendanceCalculationInput {
  date: string;
  shift: Shift;
  punches: PunchRecord[];
  holidays: Holiday[];
  weeklyOff: string[]; // e.g. ['SATURDAY', 'SUNDAY']
  lateGracePeriodMinutes?: number;
  earlyOutThresholdMinutes?: number;
  /**
   * "Flexible timing": when true, arrival/departure clock times are ignored for status — the day is
   * PRESENT once `minimumWorkMinutes` of work is completed, EARLY_OUT (hours short) otherwise.
   */
  minimumWorkingHoursEnabled?: boolean;
  minimumWorkMinutes?: number;
  overtimeEnabled?: boolean;
  /** Minutes worked after shift end before overtime starts counting. */
  overtimeThresholdMinutes?: number;
}

export interface AttendanceCalculationResult {
  firstPunchIn?: string;
  lastPunchOut?: string;
  workingMinutes: number;
  breakMinutes: number;
  lateMinutes: number;
  earlyOutMinutes: number;
  overtimeMinutes: number;
  status: AttendanceStatus;
}

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export function calculateAttendance(input: AttendanceCalculationInput): AttendanceCalculationResult {
  const {
    date, shift, punches, holidays, weeklyOff,
    lateGracePeriodMinutes = 15,
    earlyOutThresholdMinutes = 15,
    overtimeEnabled = true,
    overtimeThresholdMinutes = 0,
    minimumWorkingHoursEnabled = false,
    minimumWorkMinutes = 0,
  } = input;

  const parsedDate = parseISO(date);
  const dayName = DAY_NAMES[parsedDate.getDay()];

  // Check weekly off
  if (weeklyOff.includes(dayName)) {
    return { workingMinutes: 0, breakMinutes: 0, lateMinutes: 0, earlyOutMinutes: 0, overtimeMinutes: 0, status: 'WEEKLY_OFF' };
  }

  // Check holiday
  const isHoliday = holidays.some((h) => h.date === date && h.status === 'ACTIVE');
  if (isHoliday) {
    return { workingMinutes: 0, breakMinutes: 0, lateMinutes: 0, earlyOutMinutes: 0, overtimeMinutes: 0, status: 'HOLIDAY' };
  }

  if (punches.length === 0) {
    return { workingMinutes: 0, breakMinutes: 0, lateMinutes: 0, earlyOutMinutes: 0, overtimeMinutes: 0, status: 'ABSENT' };
  }

  const sortedPunches = [...punches].sort(
    (a, b) => parseISO(a.punchTime).getTime() - parseISO(b.punchTime).getTime()
  );

  const firstIn = sortedPunches.find((p) => p.punchType === 'IN');
  const lastOut = [...sortedPunches].reverse().find((p) => p.punchType === 'OUT');

  if (!firstIn) {
    return {
      lastPunchOut: lastOut?.punchTime,
      workingMinutes: 0, breakMinutes: 0, lateMinutes: 0, earlyOutMinutes: 0, overtimeMinutes: 0,
      status: 'INCOMPLETE',
    };
  }

  // Calculate shift times
  const shiftDate = shift.isOvernight && parseTimeToMinutes(shift.endTime) < parseTimeToMinutes(shift.startTime) ? date : date;
  const shiftStartISO = buildDateTime(shiftDate, shift.startTime);
  const shiftEndDate = shift.isOvernight ? addOneDayToDate(date) : date;
  const shiftEndISO = buildDateTime(shiftEndDate, shift.endTime);

  const shiftStartTime = parseISO(shiftStartISO);
  const shiftEndTime = parseISO(shiftEndISO);
  const firstInTime = parseISO(firstIn.punchTime);

  // Late calculation
  const lateMinutes = Math.max(0, differenceInMinutes(firstInTime, shiftStartTime) - lateGracePeriodMinutes);

  // Working time calculation (sum IN-OUT pairs)
  let workingMinutes = 0;
  let breakMinutes = 0;
  let prevOut: Date | null = null;

  for (let i = 0; i < sortedPunches.length - 1; i++) {
    const current = sortedPunches[i];
    const next = sortedPunches[i + 1];
    if (current.punchType === 'IN' && next.punchType === 'OUT') {
      workingMinutes += differenceInMinutes(parseISO(next.punchTime), parseISO(current.punchTime));
      if (prevOut) {
        breakMinutes += differenceInMinutes(parseISO(current.punchTime), prevOut);
      }
      prevOut = parseISO(next.punchTime);
    }
  }

  // If odd number of punches (last is IN with no OUT), mark incomplete
  const lastPunch = sortedPunches[sortedPunches.length - 1];
  if (lastPunch?.punchType === 'IN') {
    return {
      firstPunchIn: firstIn.punchTime,
      workingMinutes,
      breakMinutes,
      lateMinutes,
      earlyOutMinutes: 0,
      overtimeMinutes: 0,
      status: 'INCOMPLETE',
    };
  }

  // Early out calculation
  const lastOutTime = lastOut ? parseISO(lastOut.punchTime) : null;
  const shiftEarlyOutMinutes = lastOutTime
    ? Math.max(0, differenceInMinutes(shiftEndTime, lastOutTime) - earlyOutThresholdMinutes)
    : 0;

  const minutesPastShiftEnd = lastOutTime
    ? Math.max(0, differenceInMinutes(lastOutTime, shiftEndTime))
    : 0;
  const overtimeMinutes =
    overtimeEnabled && minutesPastShiftEnd >= overtimeThresholdMinutes && minutesPastShiftEnd > 0
      ? minutesPastShiftEnd
      : 0;

  let finalLateMinutes = lateMinutes;
  let earlyOutMinutes = shiftEarlyOutMinutes;
  let status: AttendanceStatus;

  if (minimumWorkingHoursEnabled && minimumWorkMinutes > 0) {
    // Flexible timing: arrival and departure against the shift no longer decide the status — only
    // whether the employee put in the required number of minutes that day. Late/early figures against
    // the shift are not meaningful here, so they're zeroed; `earlyOutMinutes` instead carries the
    // shortfall against the minimum, which is what the UI's "Early Out" column shows for this day.
    finalLateMinutes = 0;
    earlyOutMinutes = Math.max(0, minimumWorkMinutes - workingMinutes);
    status = earlyOutMinutes > 0 ? 'EARLY_OUT' : 'PRESENT';
  } else if (lateMinutes > 0) {
    status = 'LATE';
  } else if (shiftEarlyOutMinutes > 0) {
    status = 'EARLY_OUT';
  } else {
    status = 'PRESENT';
  }

  return {
    firstPunchIn: firstIn.punchTime,
    lastPunchOut: lastOut?.punchTime,
    workingMinutes,
    breakMinutes,
    lateMinutes: finalLateMinutes,
    earlyOutMinutes,
    overtimeMinutes,
    status,
  };
}

function addOneDayToDate(date: string): string {
  const d = parseISO(date);
  d.setDate(d.getDate() + 1);
  return format(d, 'yyyy-MM-dd');
}

export function getAttendanceStatusColor(status: AttendanceStatus): string {
  const colorMap: Record<AttendanceStatus, string> = {
    PRESENT: 'success',
    ABSENT: 'danger',
    LATE: 'warning',
    EARLY_OUT: 'warning',
    INCOMPLETE: 'info',
    HOLIDAY: 'info',
    WEEKLY_OFF: 'surface',
    ON_LEAVE: 'info',
  };
  return colorMap[status] ?? 'surface';
}

export function summarizeMonthlyAttendance(records: AttendanceRecord[]): {
  present: number; absent: number; late: number; earlyOut: number;
  holiday: number; weeklyOff: number; leave: number; totalMinutes: number; overtimeMinutes: number;
} {
  return records.reduce(
    (acc, r) => ({
      present: acc.present + (r.status === 'PRESENT' || r.status === 'LATE' || r.status === 'EARLY_OUT' ? 1 : 0),
      absent: acc.absent + (r.status === 'ABSENT' ? 1 : 0),
      late: acc.late + (r.status === 'LATE' ? 1 : 0),
      earlyOut: acc.earlyOut + (r.status === 'EARLY_OUT' ? 1 : 0),
      holiday: acc.holiday + (r.status === 'HOLIDAY' ? 1 : 0),
      weeklyOff: acc.weeklyOff + (r.status === 'WEEKLY_OFF' ? 1 : 0),
      leave: acc.leave + (r.status === 'ON_LEAVE' ? 1 : 0),
      totalMinutes: acc.totalMinutes + r.workingMinutes,
      overtimeMinutes: acc.overtimeMinutes + r.overtimeMinutes,
    }),
    { present: 0, absent: 0, late: 0, earlyOut: 0, holiday: 0, weeklyOff: 0, leave: 0, totalMinutes: 0, overtimeMinutes: 0 }
  );
}
