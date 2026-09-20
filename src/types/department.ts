import type { Status } from './common';

export interface Department {
  id: string;
  name: string;
  description?: string;
  status: Status;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentPayload {
  name: string;
  description?: string;
  status: Status;
  companyId: string;
}
