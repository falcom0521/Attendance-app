import type { LoginCredentials, AuthUser } from '@/types/auth';
import { sleep } from '@/lib/utils';
import { logActivity } from '@/services/mock/activityLog.service';
import { getUsersSnapshot, getUserPassword } from '@/services/mock/user.service';
import type { AppUser } from '@/types/user';

// In-memory password overrides so a changed password works until the page reloads (mock only).
const passwordOverrides = new Map<string, string>();

/** Builds the session user from a user record. Users created in the app can sign in too. */
function toAuthUser(u: AppUser): AuthUser {
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    companyId: u.companyId,
    companyName: u.companyName,
    subCompanyId: u.subCompanyId,
    subCompanyName: u.subCompanyName,
    isActive: u.status === 'ACTIVE',
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<{ user: AuthUser; token: string }> {
    await sleep(800);
    const record = getUsersSnapshot().find((u) => u.email.toLowerCase() === credentials.email.trim().toLowerCase());
    if (!record || credentials.password !== (passwordOverrides.get(record.id) ?? getUserPassword(record.id))) {
      throw new Error('Invalid email or password');
    }
    if (record.status !== 'ACTIVE') {
      throw new Error('Account is inactive. Contact your administrator.');
    }
    const token = `mock-token-${record.id}-${Date.now()}`;
    return { user: toAuthUser(record), token };
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    await sleep(600);
    if (currentPassword !== (passwordOverrides.get(userId) ?? getUserPassword(userId))) {
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
    const userId = token.split('-').slice(2, 4).join('-');
    const record = getUsersSnapshot().find((u) => u.id === userId);
    if (!record) throw new Error('User not found');
    return toAuthUser(record);
  },
};
