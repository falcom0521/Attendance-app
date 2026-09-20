import type { UserRole } from './auth';

export type RequestType = 'REGULARIZATION' | 'MISSING_PUNCH' | 'LEAVE';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type LeaveType = 'CASUAL' | 'SICK' | 'EARNED' | 'UNPAID';

export interface RequestPunchEntry {
  punchIn: string; // "HH:mm" — empty when only an OUT punch is being added
  punchOut: string; // "HH:mm" — empty when only an IN punch is being added
}

export interface RequestActor {
  id: string;
  name: string;
  role: UserRole;
}

export interface AttendanceRequest {
  id: string;
  type: RequestType;
  status: RequestStatus;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  companyId: string;
  subCompanyId: string;
  subCompanyName: string;
  /** Attendance date, or first day of leave. */
  date: string;
  /** Last day of leave (same as `date` for a single-day leave). */
  endDate?: string;
  punches?: RequestPunchEntry[];
  leaveType?: LeaveType;
  leaveDays?: number;
  reason: string;
  requestedBy: string;
  requestedByRole: UserRole;
  requestedAt: string;
  reviewedBy?: string;
  reviewComment?: string;
  reviewedAt?: string;
}

export interface CreateRequestPayload {
  type: RequestType;
  employeeId: string;
  date: string;
  endDate?: string;
  punches?: RequestPunchEntry[];
  leaveType?: LeaveType;
  reason: string;
}

export interface RequestFilters {
  companyId?: string;
  subCompanyId?: string;
  status?: RequestStatus;
  type?: RequestType;
  employeeId?: string;
  date?: string;
  search?: string;
}

export interface LeaveBucket {
  total: number;
  used: number;
  pending: number;
}

export interface LeaveBalance {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  subCompanyId: string;
  subCompanyName: string;
  year: number;
  balances: Record<Exclude<LeaveType, 'UNPAID'>, LeaveBucket> & { UNPAID: { used: number; pending: number } };
}
