import type { AppUser, CreateUserPayload } from '@/types/user';
import type { PaginatedResponse, PaginationParams, FilterParams } from '@/types/common';
import { mockUsers } from '@/mocks/data/users';
import { mockSubCompanies } from '@/mocks/data/subCompanies';
import { sleep } from '@/lib/utils';
import { logActivity } from './activityLog.service';

// eslint-disable-next-line prefer-const
let users: AppUser[] = [...mockUsers];

export function getUsersSnapshot(): AppUser[] {
  return users;
}

export const userService = {
  async getUsers(
    params?: PaginationParams & FilterParams & { companyId?: string; subCompanyId?: string; role?: string }
  ): Promise<PaginatedResponse<AppUser>> {
    await sleep(400);
    let filtered = [...users];
    if (params?.companyId) filtered = filtered.filter((u) => u.companyId === params.companyId);
    if (params?.subCompanyId) filtered = filtered.filter((u) => u.subCompanyId === params.subCompanyId);
    if (params?.role) filtered = filtered.filter((u) => u.role === params.role);
    if (params?.status) filtered = filtered.filter((u) => u.status === params.status);
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q)
      );
    }
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 10;
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);
    return { data, total: filtered.length, page, pageSize, totalPages: Math.ceil(filtered.length / pageSize) };
  },

  async getUserById(id: string): Promise<AppUser> {
    await sleep(200);
    const user = users.find((u) => u.id === id);
    if (!user) throw new Error('User not found');
    return user;
  },

  async createUser(payload: CreateUserPayload): Promise<AppUser> {
    await sleep(600);
    const subCompany = payload.subCompanyId
      ? mockSubCompanies.find((sc) => sc.id === payload.subCompanyId)
      : undefined;
    const newUser: AppUser = {
      ...payload,
      id: `user-${String(users.length + 1).padStart(3, '0')}`,
      fullName: `${payload.firstName} ${payload.lastName}`,
      subCompanyName: subCompany?.name,
      companyName: subCompany?.companyName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.push(newUser);
    logActivity({ action: 'CREATED', module: 'Users', target: newUser.fullName, targetId: newUser.id, details: `${newUser.role} user created`, companyId: newUser.companyId });
    return newUser;
  },

  async updateUser(id: string, payload: Partial<CreateUserPayload>): Promise<AppUser> {
    await sleep(500);
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('User not found');
    users[idx] = {
      ...users[idx],
      ...payload,
      fullName: payload.firstName && payload.lastName
        ? `${payload.firstName} ${payload.lastName}`
        : users[idx].fullName,
      updatedAt: new Date().toISOString(),
    };
    logActivity({ action: 'UPDATED', module: 'Users', target: users[idx].fullName, targetId: id, details: 'User details updated', companyId: users[idx].companyId });
    return users[idx];
  },

  async toggleUserStatus(id: string): Promise<AppUser> {
    await sleep(300);
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('User not found');
    users[idx].status = users[idx].status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    users[idx].updatedAt = new Date().toISOString();
    logActivity({ action: users[idx].status === 'ACTIVE' ? 'ACTIVATED' : 'DEACTIVATED', module: 'Users', target: users[idx].fullName, targetId: id, companyId: users[idx].companyId });
    return users[idx];
  },
};
