import type { Status } from './common';

export type EmployeeType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  avatarUrl?: string;
  department: string;
  designation: string;
  employeeType: EmployeeType;
  joiningDate: string;
  status: Status;
  companyId: string;
  companyName: string;
  subCompanyId: string;
  subCompanyName: string;
  shiftId?: string;
  shiftName?: string;
  weeklyOff: string[];
  deviceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeePayload {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  department: string;
  designation: string;
  employeeType: EmployeeType;
  joiningDate: string;
  status: Status;
  subCompanyId: string;
  shiftId?: string;
  weeklyOff: string[];
}
