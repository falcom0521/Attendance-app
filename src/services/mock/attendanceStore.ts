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
  requestId: string;
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
  removeLeaveByRequest(requestId: string): void {
    for (const [key, entry] of leaveEntries) {
      if (entry.requestId === requestId) leaveEntries.delete(key);
    }
  },
  allLeave(): LeaveEntry[] {
    return [...leaveEntries.values()];
  },
};
