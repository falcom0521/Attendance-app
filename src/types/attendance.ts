export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'EARLY_OUT'
  | 'INCOMPLETE'
  | 'HOLIDAY'
  | 'WEEKLY_OFF'
  | 'ON_LEAVE';

export type PunchType = 'IN' | 'OUT';

export interface ManualPunchEntry {
  punchIn: string; // "HH:mm" — empty when only an OUT punch is recorded
  punchOut: string; // "HH:mm" — empty means missing out punch
}

export type ManualSource = 'MANUAL' | 'REGULARIZATION' | 'MISSING_PUNCH';

export interface PunchRecord {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  deviceId: string;
  deviceName: string;
  punchTime: string; // ISO datetime
  punchType: PunchType;
  companyId: string;
  subCompanyId: string;
  date: string; // "YYYY-MM-DD"
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  designation: string;
  date: string; // "YYYY-MM-DD"
  shiftId: string;
  shiftName: string;
  shiftStartTime: string;
  shiftEndTime: string;
  firstPunchIn?: string;
  lastPunchOut?: string;
  punchRecords: PunchRecord[];
  workingMinutes: number;
  breakMinutes: number;
  lateMinutes: number;
  earlyOutMinutes: number;
  overtimeMinutes: number;
  status: AttendanceStatus;
  companyId: string;
  subCompanyId: string;
  subCompanyName?: string;
  /** True when at least one manual punch is part of this day's record. */
  isManual?: boolean;
  manualReason?: string;
  manualSource?: ManualSource;
  manualBy?: string;
  manualAt?: string;
  /** Set when the day is covered by approved leave (a request, or a direct pre-approved mark). */
  leaveType?: string;
  leaveRequestId?: string;
  /** `'DIRECT'` = marked pre-approved straight from Attendance; `'REQUEST'` = via an approved request. */
  leaveSource?: 'DIRECT' | 'REQUEST';
  leaveReason?: string;
  leaveMarkedBy?: string;
  leaveMarkedAt?: string;
}

export interface MonthlyAttendanceSummary {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  month: number;
  year: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  earlyOutDays: number;
  holidayDays: number;
  weeklyOffDays: number;
  leaveDays: number;
  totalWorkingMinutes: number;
  totalOvertimeMinutes: number;
  records: AttendanceRecord[];
}

export interface AttendanceFilters {
  date?: string;
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  shiftId?: string;
  status?: AttendanceStatus;
  search?: string;
  employeeId?: string;
  subCompanyId?: string;
  companyId?: string;
  month?: number;
  year?: number;
}

export interface DailyAttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  earlyOut: number;
  missingPunch: number;
  onLeave: number;
  holiday: number;
  weeklyOff: number;
  overtimeMinutes: number;
}
