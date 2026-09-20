import type { AttendanceRecord, PunchRecord } from '@/types/attendance';
import type { Employee } from '@/types/employee';
import type { Shift } from '@/types/shift';
import { mockEmployees } from '@/mocks/data/employees';
import { mockShifts } from '@/mocks/data/shifts';
import { mockHolidays } from '@/mocks/data/holidays';
import { mockDevices } from '@/mocks/data/devices';
import { mockAttendanceRecords } from '@/mocks/data/attendance';
import { format, subDays } from 'date-fns';
import { parseTimeToMinutes } from '@/utils/date';
import { buildAttendanceRecord, buildNonWorkingRecord, isoAtMinutes } from './attendanceEngine';

const HISTORY_DAYS = 60;
const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

/** Small deterministic hash so generated history is stable between reloads. */
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickShift(employee: Employee): Shift | undefined {
  return (
    mockShifts.find((s) => s.id === employee.shiftId) ??
    mockShifts.find((s) => s.subCompanyId === employee.subCompanyId)
  );
}

function pickDevice(employee: Employee, h: number) {
  const devices = mockDevices.filter(
    (d) => d.subCompanyId === employee.subCompanyId && d.status === 'ONLINE'
  );
  if (devices.length === 0) return undefined;
  return devices.length > 1 && h % 5 === 0 ? devices[1] : devices[0];
}

interface Plan {
  in?: number;
  out?: number;
  lunch: boolean;
}

/** Decides a working day's punch pattern. Weights: ~62% on time, 9% late, 6% early out, 3% missing punch, 5% absent, 5% overtime. */
function planDay(seed: number, start: number, end: number, grace: number): Plan {
  const r = seed % 100;
  const h2 = (seed >>> 7) % 100;
  const h3 = (seed >>> 13) % 100;
  const lunch = (seed >>> 3) % 3 === 0;
  if (r < 68) return { in: start - 8 + (h2 % 12), out: end + (h3 % 6), lunch };
  if (r < 77) return { in: start + grace + 5 + (h2 % 40), out: end + (h3 % 8), lunch };
  if (r < 83) return { in: start - 5 + (h2 % 10), out: end - (30 + (h3 % 60)), lunch };
  if (r < 86) return { in: start - 3 + (h2 % 8), lunch: false }; // forgot to punch out
  if (r < 91) return { lunch: false }; // absent
  if (r < 96) return { in: start - 5 + (h2 % 10), out: end + 35 + (h3 % 85), lunch };
  return { in: start - 6 + (h2 % 8), out: end + (h3 % 5), lunch };
}

function makePunches(
  employee: Employee,
  date: string,
  plan: Plan,
  start: number,
  seed: number
): PunchRecord[] {
  const device = pickDevice(employee, seed);
  if (!device || plan.in === undefined) return [];

  const mk = (n: number, minutes: number, type: 'IN' | 'OUT'): PunchRecord => ({
    id: `hp-${employee.id}-${date}-${n}`,
    employeeId: employee.id,
    employeeCode: employee.employeeCode,
    employeeName: employee.fullName,
    deviceId: device.id,
    deviceName: device.name,
    punchTime: isoAtMinutes(date, minutes),
    punchType: type,
    companyId: employee.companyId,
    subCompanyId: employee.subCompanyId,
    date,
  });

  const punches: PunchRecord[] = [mk(1, plan.in, 'IN')];
  if (plan.lunch && plan.out !== undefined) {
    const lunchOut = start + 240 + (seed % 10);
    const lunchIn = lunchOut + 45 + (seed % 15);
    punches.push(mk(2, lunchOut, 'OUT'), mk(3, lunchIn, 'IN'));
  }
  if (plan.out !== undefined) punches.push(mk(4, plan.out, 'OUT'));
  return punches;
}

let cache: AttendanceRecord[] | null = null;

/**
 * Device-derived attendance for every employee: the hand-written records for today (Kochi)
 * plus deterministic generated history for the last 60 days and today's other branches.
 */
export function buildBaseRecords(): AttendanceRecord[] {
  if (cache) return cache;

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const seeded = new Set(mockAttendanceRecords.map((r) => `${r.employeeId}|${r.date}`));
  const holidaysBySub = new Map<string, Set<string>>();
  for (const h of mockHolidays) {
    if (h.status !== 'ACTIVE') continue;
    if (!holidaysBySub.has(h.subCompanyId)) holidaysBySub.set(h.subCompanyId, new Set());
    holidaysBySub.get(h.subCompanyId)!.add(h.date);
  }

  const records: AttendanceRecord[] = [...mockAttendanceRecords];

  for (const employee of mockEmployees) {
    if (employee.status !== 'ACTIVE') continue;
    const shift = pickShift(employee);
    if (!shift) continue;

    const start = parseTimeToMinutes(shift.startTime);
    let end = parseTimeToMinutes(shift.endTime);
    if (end <= start) end += 1440;

    for (let i = 0; i <= HISTORY_DAYS; i++) {
      const dateObj = subDays(today, i);
      const date = format(dateObj, 'yyyy-MM-dd');
      if (seeded.has(`${employee.id}|${date}`)) continue;
      if (date < employee.joiningDate) continue;

      const weeklyOff = employee.weeklyOff.includes(DAY_NAMES[dateObj.getDay()] ?? '');
      if (weeklyOff) {
        records.push(buildNonWorkingRecord(employee, shift, date, 'WEEKLY_OFF'));
        continue;
      }
      if (holidaysBySub.get(employee.subCompanyId)?.has(date)) {
        records.push(buildNonWorkingRecord(employee, shift, date, 'HOLIDAY'));
        continue;
      }

      const seed = hash(`${employee.id}|${date}`);
      const plan = planDay(seed, start, end, shift.gracePeriodMinutes);
      const punches = makePunches(employee, date, plan, start, seed);

      // A day that is still in progress can't already be "absent" or "incomplete" — skip future-looking gaps for today.
      if (date === todayStr && punches.length === 0) {
        records.push(buildNonWorkingRecord(employee, shift, date, 'ABSENT'));
        continue;
      }
      records.push(buildAttendanceRecord({ employee, shift, date, punches }));
    }
  }

  cache = records.map((r) => ({
    ...r,
    subCompanyName: r.subCompanyName ?? mockEmployees.find((e) => e.id === r.employeeId)?.subCompanyName,
  }));
  return cache;
}
