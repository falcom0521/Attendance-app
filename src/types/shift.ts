import type { Status } from './common';

export interface Shift {
  id: string;
  name: string;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  breakStartTime?: string;
  breakEndTime?: string;
  gracePeriodMinutes: number;
  /**
   * Optional "flexible timing" minimum, in whole hours (e.g. `8`). Only enforced when the company's
   * Attendance Settings has flexible timing enabled; otherwise late/early-out follow start/end time as usual.
   */
  minimumWorkingHours?: number;
  isOvernight: boolean;
  totalWorkMinutes: number;
  status: Status;
  companyId: string;
  subCompanyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShiftPayload {
  name: string;
  startTime: string;
  endTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
  gracePeriodMinutes: number;
  minimumWorkingHours?: number;
  status: Status;
  subCompanyId: string;
}
