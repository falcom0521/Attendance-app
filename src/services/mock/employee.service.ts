import type { Employee, CreateEmployeePayload } from '@/types/employee';
import type { PaginatedResponse, PaginationParams, FilterParams } from '@/types/common';
import { mockEmployees } from '@/mocks/data/employees';
import { mockSubCompanies } from '@/mocks/data/subCompanies';
import { mockShifts } from '@/mocks/data/shifts';
import { sleep } from '@/lib/utils';
import { logActivity } from './activityLog.service';
import { sortRecords } from '@/lib/sort';

// eslint-disable-next-line prefer-const
let employees: Employee[] = [...mockEmployees];

export function getEmployeesSnapshot(): Employee[] {
  return employees;
}

export const employeeService = {
  async getEmployees(
    params?: PaginationParams &
      FilterParams & {
        companyId?: string;
        subCompanyId?: string;
        department?: string;
        shiftId?: string;
      }
  ): Promise<PaginatedResponse<Employee>> {
    await sleep(400);
    let filtered = [...employees];
    if (params?.companyId) filtered = filtered.filter((e) => e.companyId === params.companyId);
    if (params?.subCompanyId) filtered = filtered.filter((e) => e.subCompanyId === params.subCompanyId);
    if (params?.department) filtered = filtered.filter((e) => e.department === params.department);
    if (params?.shiftId) filtered = filtered.filter((e) => e.shiftId === params.shiftId);
    if (params?.status) filtered = filtered.filter((e) => e.status === params.status);
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.fullName.toLowerCase().includes(q) ||
          e.employeeCode.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q)
      );
    }
    filtered = sortRecords(filtered, params?.sortBy, params?.sortDir, (e, key) => e[key as keyof Employee]);
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 10;
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);
    return { data, total: filtered.length, page, pageSize, totalPages: Math.ceil(filtered.length / pageSize) };
  },

  async getEmployeeById(id: string): Promise<Employee> {
    await sleep(200);
    const emp = employees.find((e) => e.id === id);
    if (!emp) throw new Error('Employee not found');
    return emp;
  },

  async getEmployeesBySubCompany(subCompanyId: string): Promise<Employee[]> {
    await sleep(200);
    return employees.filter((e) => e.subCompanyId === subCompanyId && e.status === 'ACTIVE');
  },

  async createEmployee(payload: CreateEmployeePayload): Promise<Employee> {
    await sleep(600);
    const subCompany = mockSubCompanies.find((sc) => sc.id === payload.subCompanyId);
    if (!payload.shiftId) throw new Error('Select a shift for this employee');
    const shift = mockShifts.find((s) => s.id === payload.shiftId);
    if (!shift) throw new Error('Selected shift not found');
    if (shift.subCompanyId !== payload.subCompanyId) throw new Error('Shift does not belong to the selected sub company');
    const newEmp: Employee = {
      ...payload,
      id: `emp-${String(employees.length + 1).padStart(3, '0')}`,
      fullName: `${payload.firstName} ${payload.lastName}`,
      companyId: subCompany?.companyId ?? '',
      companyName: subCompany?.companyName ?? '',
      subCompanyName: subCompany?.name ?? '',
      shiftName: shift?.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    employees.push(newEmp);
    logActivity({ action: 'CREATED', module: 'Employees', target: `${newEmp.fullName} (${newEmp.employeeCode})`, targetId: newEmp.id, details: `Added to ${newEmp.subCompanyName}`, companyId: newEmp.companyId });
    return newEmp;
  },

  async updateEmployee(id: string, payload: Partial<CreateEmployeePayload>): Promise<Employee> {
    await sleep(500);
    const idx = employees.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Employee not found');
    let shift = undefined;
    if ('shiftId' in payload) {
      if (!payload.shiftId) throw new Error('Select a shift for this employee');
      shift = mockShifts.find((s) => s.id === payload.shiftId);
      if (!shift) throw new Error('Selected shift not found');
      const subCompanyId = payload.subCompanyId ?? employees[idx].subCompanyId;
      if (shift.subCompanyId !== subCompanyId) throw new Error('Shift does not belong to the selected sub company');
    }
    employees[idx] = {
      ...employees[idx],
      ...payload,
      fullName: payload.firstName && payload.lastName
        ? `${payload.firstName} ${payload.lastName}`
        : employees[idx].fullName,
      shiftName: shift?.name ?? employees[idx].shiftName,
      updatedAt: new Date().toISOString(),
    };
    logActivity({ action: 'UPDATED', module: 'Employees', target: `${employees[idx].fullName} (${employees[idx].employeeCode})`, targetId: id, details: 'Employee details updated', companyId: employees[idx].companyId });
    return employees[idx];
  },

  async toggleEmployeeStatus(id: string): Promise<Employee> {
    await sleep(300);
    const idx = employees.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Employee not found');
    employees[idx].status = employees[idx].status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    employees[idx].updatedAt = new Date().toISOString();
    logActivity({ action: employees[idx].status === 'ACTIVE' ? 'ACTIVATED' : 'DEACTIVATED', module: 'Employees', target: `${employees[idx].fullName} (${employees[idx].employeeCode})`, targetId: id, companyId: employees[idx].companyId });
    return employees[idx];
  },

  async assignShift(employeeId: string, shiftId: string): Promise<Employee> {
    await sleep(300);
    const shift = mockShifts.find((s) => s.id === shiftId);
    return employeeService.updateEmployee(employeeId, { shiftId, shiftName: shift?.name } as Partial<CreateEmployeePayload>);
  },
};
