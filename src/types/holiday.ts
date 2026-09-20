import type { Status } from './common';

export interface Holiday {
  id: string;
  name: string;
  date: string; // "YYYY-MM-DD"
  description?: string;
  status: Status;
  companyId: string;
  subCompanyId: string;
  year: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHolidayPayload {
  name: string;
  date: string;
  description?: string;
  status: Status;
  subCompanyId: string;
}
