import type { ManualPunchEntry, ManualSource } from '@/types/attendance';

/**
 * In-memory overlay on top of the device punch data. Manual entries are merged
 * with the raw device punches for the day; leave entries mark days as ON_LEAVE.
 * Phase 2: these become rows/endpoints on the backend.
 */

export interface ManualEntry {
  employeeId: string;
  date: string;
  entries: ManualPunchEntry[];
  reason: string;
  source: ManualSource;
  by: string;
  at: string;
}

export interface LeaveEntry {
  employeeId: string;
  date: string;
  leaveType: string;
  /** Id of the approving request when `source` is `'REQUEST'`; empty string for a direct mark. */
  requestId: string;
  /**
   * `'REQUEST'` — came from an approved regularization/leave request (the Requests module).
   * `'DIRECT'` — HR/Admin marked an absent day as pre-approved leave straight from Attendance,
   * with no separate approval step. Only `'DIRECT'` entries can be undone from that same action.
   */
  source: 'DIRECT' | 'REQUEST';
  reason?: string;
  markedBy?: string;
  markedAt?: string;
}

export function recordKey(employeeId: string, date: string): string {
  return `${employeeId}|${date}`;
}

const manualEntries = new Map<string, ManualEntry>();
const leaveEntries = new Map<string, LeaveEntry>();

export const attendanceStore = {
  setManual(entry: ManualEntry): void {
    manualEntries.set(recordKey(entry.employeeId, entry.date), entry);
  },
  getManual(employeeId: string, date: string): ManualEntry | undefined {
    return manualEntries.get(recordKey(employeeId, date));
  },
  deleteManual(employeeId: string, date: string): boolean {
    return manualEntries.delete(recordKey(employeeId, date));
  },
  allManual(): ManualEntry[] {
    return [...manualEntries.values()];
  },

  setLeave(entry: LeaveEntry): void {
    leaveEntries.set(recordKey(entry.employeeId, entry.date), entry);
  },
  getLeave(employeeId: string, date: string): LeaveEntry | undefined {
    return leaveEntries.get(recordKey(employeeId, date));
  },
  /** Removes a single day's leave mark directly (used by the "Mark as Leave" / "Undo" action). */
  removeLeave(employeeId: string, date: string): boolean {
    return leaveEntries.delete(recordKey(employeeId, date));
  },
  removeLeaveByRequest(requestId: string): void {
    for (const [key, entry] of leaveEntries) {
      if (entry.requestId === requestId) leaveEntries.delete(key);
    }
  },
  allLeave(): LeaveEntry[] {
    return [...leaveEntries.values()];
  },
};
