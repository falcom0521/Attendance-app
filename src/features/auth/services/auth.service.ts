import type { LoginCredentials, AuthUser } from '@/types/auth';
import { sleep } from '@/lib/utils';
import { logActivity } from '@/services/mock/activityLog.service';
import { getUsersSnapshot } from '@/services/mock/user.service';

const DEFAULT_PASSWORD = 'password123';
// In-memory password overrides so a changed password works until the page reloads (mock only).
const passwordOverrides = new Map<string, string>();

const MOCK_USERS: AuthUser[] = [
  {
    id: 'user-001',
    email: 'superadmin@example.com',
    firstName: 'Arjun',
    lastName: 'Krishnaswamy',
    role: 'SUPER_ADMIN',
    isActive: true,
  },
  {
    id: 'user-002',
    email: 'admin@example.com',
    firstName: 'Meera',
    lastName: 'Nambiar',
    role: 'ADMIN',
    companyId: 'company-001',
    companyName: 'Nexus Technologies Pvt Ltd',
    isActive: true,
  },
  {
    id: 'user-004',
    email: 'hr@example.com',
    firstName: 'Divya',
    lastName: 'Menon',
    role: 'HR',
    companyId: 'company-001',
    companyName: 'Nexus Technologies Pvt Ltd',
    subCompanyId: 'sub-001',
    subCompanyName: 'Nexus Kochi HQ',
    isActive: true,
  },
];

export const authService = {
  async login(credentials: LoginCredentials): Promise<{ user: AuthUser; token: string }> {
    await sleep(800);
    const user = MOCK_USERS.find((u) => u.email === credentials.email);
    if (!user || credentials.password !== (passwordOverrides.get(user.id) ?? DEFAULT_PASSWORD)) {
      throw new Error('Invalid email or password');
    }
    if (!user.isActive) {
      throw new Error('Account is inactive. Contact your administrator.');
    }
    const token = `mock-token-${user.id}-${Date.now()}`;
    // Pick up profile edits made earlier in this session (mock only; the backend owns this in Phase 2).
    const saved = getUsersSnapshot().find((u) => u.id === user.id);
    return { user: saved ? { ...user, firstName: saved.firstName, lastName: saved.lastName } : user, token };
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    await sleep(600);
    if (currentPassword !== (passwordOverrides.get(userId) ?? DEFAULT_PASSWORD)) {
      throw new Error('Current password is incorrect');
    }
    if (newPassword === currentPassword) throw new Error('New password must be different from the current one');
    passwordOverrides.set(userId, newPassword);
    logActivity({ action: 'UPDATED', module: 'Users', target: 'Own password', targetId: userId, details: 'Password changed' });
  },

  async logout(): Promise<void> {
    await sleep(200);
  },

  async getCurrentUser(token: string): Promise<AuthUser> {
    await sleep(300);
    const userId = token.split('-')[2];
    const user = MOCK_USERS.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    return user;
  },
};
