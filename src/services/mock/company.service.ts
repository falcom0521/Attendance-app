import type { Company, SubCompany, CreateCompanyPayload, CreateSubCompanyPayload } from '@/types/company';
import type { PaginatedResponse, PaginationParams, FilterParams } from '@/types/common';
import { mockCompanies } from '@/mocks/data/companies';
import { mockSubCompanies } from '@/mocks/data/subCompanies';
import { sleep } from '@/lib/utils';
import { assertWritable } from './writeGuard';
import { getEmployeesSnapshot } from './employee.service';
import { getDevicesSnapshot } from './device.service';
import { getUsersSnapshot } from './user.service';
import { logActivity } from './activityLog.service';

// eslint-disable-next-line prefer-const
let companies: Company[] = [...mockCompanies];
// eslint-disable-next-line prefer-const
let subCompanies: SubCompany[] = [...mockSubCompanies];

export function getCompaniesSnapshot(): Company[] {
  return companies.map(withCounts);
}

export function getSubCompaniesSnapshot(): SubCompany[] {
  return subCompanies.map(subWithCounts);
}

/** Counts are derived from the live data so they stay right as employees, devices and users change. */
function withCounts(c: Company): Company {
  return {
    ...c,
    subCompanyCount: subCompanies.filter((sc) => sc.companyId === c.id).length,
    deviceCount: getDevicesSnapshot().filter((d) => d.companyId === c.id).length,
    employeeCount: getEmployeesSnapshot().filter((e) => e.companyId === c.id).length,
  };
}

function subWithCounts(sc: SubCompany): SubCompany {
  return {
    ...sc,
    employeeCount: getEmployeesSnapshot().filter((e) => e.subCompanyId === sc.id).length,
    deviceCount: getDevicesSnapshot().filter((d) => d.subCompanyId === sc.id).length,
    hrCount: getUsersSnapshot().filter((u) => u.role === 'HR' && u.subCompanyId === sc.id).length,
  };
}

export const companyService = {
  async getCompanies(
    params?: PaginationParams & FilterParams
  ): Promise<PaginatedResponse<Company>> {
    await sleep(400);
    let filtered = companies.map(withCounts);
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
      );
    }
    if (params?.status) {
      filtered = filtered.filter((c) => c.status === params.status);
    }
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 10;
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);
    return { data, total: filtered.length, page, pageSize, totalPages: Math.ceil(filtered.length / pageSize) };
  },

  async getCompanyById(id: string): Promise<Company> {
    await sleep(200);
    const company = companies.find((c) => c.id === id);
    if (!company) throw new Error('Company not found');
    return withCounts(company);
  },

  async createCompany(payload: CreateCompanyPayload): Promise<Company> {
    assertWritable();
    await sleep(600);
    const newCompany: Company = {
      ...payload,
      id: `company-${String(companies.length + 1).padStart(3, '0')}`,
      subCompanyCount: 0,
      deviceCount: 0,
      employeeCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    companies.push(newCompany);
    logActivity({ action: 'CREATED', module: 'Companies', target: newCompany.name, targetId: newCompany.id, details: 'Company registered', companyId: newCompany.id });
    return withCounts(newCompany);
  },

  async updateCompany(id: string, payload: Partial<CreateCompanyPayload>): Promise<Company> {
    assertWritable();
    await sleep(500);
    const idx = companies.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Company not found');
    companies[idx] = { ...companies[idx], ...payload, updatedAt: new Date().toISOString() };
    logActivity({ action: 'UPDATED', module: 'Companies', target: companies[idx].name, targetId: id, details: 'Company details updated', companyId: id });
    return withCounts(companies[idx]);
  },

  async toggleCompanyStatus(id: string): Promise<Company> {
    assertWritable();
    await sleep(300);
    const idx = companies.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Company not found');
    companies[idx].status = companies[idx].status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    companies[idx].updatedAt = new Date().toISOString();
    logActivity({ action: companies[idx].status === 'ACTIVE' ? 'ACTIVATED' : 'DEACTIVATED', module: 'Companies', target: companies[idx].name, targetId: id, companyId: id });
    return withCounts(companies[idx]);
  },

  // Sub Companies
  async getSubCompanies(
    params?: PaginationParams & FilterParams & { companyId?: string }
  ): Promise<PaginatedResponse<SubCompany>> {
    await sleep(400);
    let filtered = subCompanies.map(subWithCounts);
    if (params?.companyId) {
      filtered = filtered.filter((sc) => sc.companyId === params.companyId);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (sc) => sc.name.toLowerCase().includes(q) || sc.code.toLowerCase().includes(q)
      );
    }
    if (params?.status) {
      filtered = filtered.filter((sc) => sc.status === params.status);
    }
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 10;
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);
    return { data, total: filtered.length, page, pageSize, totalPages: Math.ceil(filtered.length / pageSize) };
  },

  async getSubCompanyById(id: string): Promise<SubCompany> {
    await sleep(200);
    const sub = subCompanies.find((sc) => sc.id === id);
    if (!sub) throw new Error('Sub company not found');
    return subWithCounts(sub);
  },

  async getSubCompaniesByCompany(companyId: string): Promise<SubCompany[]> {
    await sleep(200);
    return subCompanies.filter((sc) => sc.companyId === companyId).map(subWithCounts);
  },

  async createSubCompany(payload: CreateSubCompanyPayload): Promise<SubCompany> {
    assertWritable();
    await sleep(600);
    const company = companies.find((c) => c.id === payload.companyId);
    const newSub: SubCompany = {
      ...payload,
      id: `sub-${String(subCompanies.length + 1).padStart(3, '0')}`,
      companyName: company?.name ?? '',
      employeeCount: 0,
      deviceCount: 0,
      hrCount: 0,
      workingDays: payload.workingDays ?? ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    subCompanies.push(newSub);
    logActivity({ action: 'CREATED', module: 'Sub Companies', target: newSub.name, targetId: newSub.id, details: `Under ${newSub.companyName}`, companyId: newSub.companyId });
    return subWithCounts(newSub);
  },

  async updateSubCompany(id: string, payload: Partial<CreateSubCompanyPayload>): Promise<SubCompany> {
    assertWritable();
    await sleep(500);
    const idx = subCompanies.findIndex((sc) => sc.id === id);
    if (idx === -1) throw new Error('Sub company not found');
    subCompanies[idx] = { ...subCompanies[idx], ...payload, updatedAt: new Date().toISOString() };
    logActivity({ action: 'UPDATED', module: 'Sub Companies', target: subCompanies[idx].name, targetId: id, details: 'Sub company details updated', companyId: subCompanies[idx].companyId });
    return subWithCounts(subCompanies[idx]);
  },

  async toggleSubCompanyStatus(id: string): Promise<SubCompany> {
    assertWritable();
    await sleep(300);
    const idx = subCompanies.findIndex((sc) => sc.id === id);
    if (idx === -1) throw new Error('Sub company not found');
    subCompanies[idx].status = subCompanies[idx].status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    subCompanies[idx].updatedAt = new Date().toISOString();
    logActivity({ action: subCompanies[idx].status === 'ACTIVE' ? 'ACTIVATED' : 'DEACTIVATED', module: 'Sub Companies', target: subCompanies[idx].name, targetId: id, companyId: subCompanies[idx].companyId });
    return subWithCounts(subCompanies[idx]);
  },
};
