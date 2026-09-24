import type { AppUser, CreateUserPayload } from '@/types/user';
import type { PaginatedResponse, PaginationParams, FilterParams } from '@/types/common';
import { mockUsers } from '@/mocks/data/users';
import { mockSubCompanies } from '@/mocks/data/subCompanies';
import { sleep } from '@/lib/utils';
import { assertWritable } from './writeGuard';
import { getActivityActorRole, logActivity } from './activityLog.service';
import { sortRecords } from '@/lib/sort';

// eslint-disable-next-line prefer-const
let users: AppUser[] = [...mockUsers];

const DEFAULT_PASSWORD = 'password123';
// Passwords of users created in the app (mock only). Seeded users fall back to the default.
const passwords = new Map<string, string>();

export function getUsersSnapshot(): AppUser[] {
  return users;
}

export function getUserPassword(id: string): string {
  return passwords.get(id) ?? DEFAULT_PASSWORD;
}

const VIEWER = 'SUPER_ADMIN_VIEWER';

/** Only a Super Admin may create or promote a user to the read-only Super Admin role. */
function assertCanAssignRole(role?: string): void {
  if (role === VIEWER && getActivityActorRole() !== 'SUPER_ADMIN') {
    throw new Error('Only a Super Admin can create a read-only Super Admin');
  }
}

function assertUnique(payload: { email?: string; username?: string }, exceptId?: string): void {
  const clash = (key: 'email' | 'username', value?: string) =>
    !!value && users.some((u) => u.id !== exceptId && u[key].toLowerCase() === value.toLowerCase());
  if (clash('email', payload.email)) throw new Error('A user with this email already exists');
  if (clash('username', payload.username)) throw new Error('A user with this username already exists');
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
    filtered = sortRecords(filtered, params?.sortBy, params?.sortDir, (u, key) => u[key as keyof AppUser]);
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
    assertWritable();
    await sleep(600);
    assertCanAssignRole(payload.role);
    assertUnique(payload);

    // A read-only Super Admin is platform-level: never tied to a company or sub company.
    const isViewer = payload.role === VIEWER;
    const { password, ...rest } = payload;
    const subCompany = !isViewer && payload.subCompanyId
      ? mockSubCompanies.find((sc) => sc.id === payload.subCompanyId)
      : undefined;
    const newUser: AppUser = {
      ...rest,
      companyId: isViewer ? undefined : payload.companyId,
      subCompanyId: isViewer ? undefined : payload.subCompanyId,
      id: `user-${String(users.length + 1).padStart(3, '0')}`,
      fullName: `${payload.firstName} ${payload.lastName}`,
      subCompanyName: subCompany?.name,
      companyName: subCompany?.companyName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.push(newUser);
    passwords.set(newUser.id, password || DEFAULT_PASSWORD);
    logActivity({ action: 'CREATED', module: 'Users', target: newUser.fullName, targetId: newUser.id, details: isViewer ? 'Read-only Super Admin created' : `${newUser.role} user created`, companyId: newUser.companyId });
    return newUser;
  },

  async updateUser(id: string, payload: Partial<CreateUserPayload>): Promise<AppUser> {
    assertWritable();
    await sleep(500);
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('User not found');
    if (payload.role && payload.role !== users[idx].role) assertCanAssignRole(payload.role);
    assertUnique(payload, id);

    // A password is never part of the stored user record.
    const changes: Partial<CreateUserPayload> = { ...payload };
    delete changes.password;
    users[idx] = {
      ...users[idx],
      ...changes,
      fullName: payload.firstName && payload.lastName
        ? `${payload.firstName} ${payload.lastName}`
        : users[idx].fullName,
      updatedAt: new Date().toISOString(),
    };
    logActivity({ action: 'UPDATED', module: 'Users', target: users[idx].fullName, targetId: id, details: 'User details updated', companyId: users[idx].companyId });
    return users[idx];
  },

  async toggleUserStatus(id: string): Promise<AppUser> {
    assertWritable();
    await sleep(300);
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('User not found');
    users[idx].status = users[idx].status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    users[idx].updatedAt = new Date().toISOString();
    logActivity({ action: users[idx].status === 'ACTIVE' ? 'ACTIVATED' : 'DEACTIVATED', module: 'Users', target: users[idx].fullName, targetId: id, companyId: users[idx].companyId });
    return users[idx];
  },
};
