import type { Status } from './common';

export interface Shift {
  id: string;
  name: string;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  breakStartTime?: string;
  breakEndTime?: string;
  gracePeriodMinutes: number;
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
  status: Status;
  subCompanyId: string;
}
