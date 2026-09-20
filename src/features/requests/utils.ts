import type { AttendanceRequest, LeaveType, RequestType } from '@/types/request';
import { formatDate } from '@/utils/date';

export const REQUEST_TYPE_LABEL: Record<RequestType, string> = {
  REGULARIZATION: 'Regularization',
  MISSING_PUNCH: 'Missing punch',
  LEAVE: 'Leave',
};

export const REQUEST_TYPE_VARIANT: Record<RequestType, 'info' | 'warning' | 'brand'> = {
  REGULARIZATION: 'info',
  MISSING_PUNCH: 'warning',
  LEAVE: 'brand',
};

export const LEAVE_TYPE_LABEL: Record<LeaveType, string> = {
  CASUAL: 'Casual leave',
  SICK: 'Sick leave',
  EARNED: 'Earned leave',
  UNPAID: 'Unpaid leave',
};

export const LEAVE_TYPE_OPTIONS = (Object.keys(LEAVE_TYPE_LABEL) as LeaveType[]).map((value) => ({
  value,
  label: LEAVE_TYPE_LABEL[value],
}));

export function requestDateLabel(r: AttendanceRequest): string {
  if (r.type === 'LEAVE' && r.endDate && r.endDate !== r.date) {
    return `${formatDate(r.date, 'dd MMM')} – ${formatDate(r.endDate, 'dd MMM yyyy')}`;
  }
  return formatDate(r.date);
}

/** One-line summary of what the request asks for. */
export function requestSummary(r: AttendanceRequest): string {
  if (r.type === 'LEAVE') {
    const days = r.leaveDays ?? 0;
    return `${LEAVE_TYPE_LABEL[r.leaveType ?? 'CASUAL']} · ${days} working day${days === 1 ? '' : 's'}`;
  }
  return (r.punches ?? [])
    .map((p) => {
      if (p.punchIn && p.punchOut) return `${p.punchIn} – ${p.punchOut}`;
      return p.punchIn ? `IN ${p.punchIn}` : `OUT ${p.punchOut}`;
    })
    .join(', ');
}
