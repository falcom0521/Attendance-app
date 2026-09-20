import type { Status } from './common';
import type { UserRole } from './auth';

export interface AppUser {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  username: string;
  role: UserRole;
  companyId?: string;
  companyName?: string;
  subCompanyId?: string;
  subCompanyName?: string;
  status: Status;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  role: UserRole;
  companyId?: string;
  subCompanyId?: string;
  status: Status;
}
