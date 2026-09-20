import type { Status } from './common';

export interface Company {
  id: string;
  name: string;
  code: string;
  registrationNumber: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  logoUrl?: string;
  status: Status;
  subCompanyCount: number;
  deviceCount: number;
  employeeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubCompany {
  id: string;
  companyId: string;
  companyName: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  logoUrl?: string;
  status: Status;
  employeeCount: number;
  deviceCount: number;
  hrCount: number;
  timezone: string;
  workingDays: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyPayload {
  name: string;
  code: string;
  registrationNumber: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  status: Status;
}

export interface CreateSubCompanyPayload {
  companyId: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  timezone: string;
  workingDays?: string[];
  status: Status;
}
