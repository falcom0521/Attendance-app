import type { UserRole } from '@/types/auth';

export type Permission =
  | 'companies:create'
  | 'companies:update'
  | 'companies:delete'
  | 'companies:view'
  | 'subCompanies:create'
  | 'subCompanies:update'
  | 'subCompanies:view'
  | 'devices:create'
  | 'devices:update'
  | 'devices:view'
  | 'devices:allocate'
  | 'devices:deallocate'
  | 'admins:create'
  | 'admins:update'
  | 'admins:view'
  | 'hr:create'
  | 'hr:update'
  | 'hr:view'
  | 'employees:create'
  | 'employees:update'
  | 'employees:delete'
  | 'employees:view'
  | 'shifts:manage'
  | 'shifts:view'
  | 'holidays:manage'
  | 'holidays:view'
  | 'attendance:view'
  | 'attendance:manage'
  | 'requests:view'
  | 'requests:create'
  | 'requests:approve'
  | 'reports:view'
  | 'reports:generate'
  | 'configuration:view'
  | 'configuration:manage'
  | 'activityLogs:view'
  | 'dashboard:super'
  | 'dashboard:admin'
  | 'dashboard:hr';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    'companies:create',
    'companies:update',
    'companies:delete',
    'companies:view',
    'subCompanies:create',
    'subCompanies:update',
    'subCompanies:view',
    'devices:create',
    'devices:update',
    'devices:view',
    'devices:allocate',
    'devices:deallocate',
    'admins:create',
    'admins:update',
    'admins:view',
    'hr:create',
    'hr:update',
    'hr:view',
    'employees:view',
    'shifts:view',
    'holidays:view',
    'attendance:view',
    'reports:view',
    'activityLogs:view',
    'dashboard:super',
  ],
  ADMIN: [
    'companies:view',
    'subCompanies:view',
    'devices:view',
    'hr:create',
    'hr:update',
    'hr:view',
    'employees:create',
    'employees:update',
    'employees:view',
    'shifts:manage',
    'shifts:view',
    'holidays:manage',
    'holidays:view',
    'attendance:view',
    'attendance:manage',
    'requests:view',
    'requests:create',
    'requests:approve',
    'reports:view',
    'reports:generate',
    'configuration:view',
    'configuration:manage',
    'dashboard:admin',
  ],
  HR: [
    'employees:create',
    'employees:update',
    'employees:view',
    'shifts:manage',
    'shifts:view',
    'holidays:manage',
    'holidays:view',
    'attendance:view',
    'attendance:manage',
    'requests:view',
    'requests:create',
    'reports:view',
    'reports:generate',
    'configuration:view',
    'configuration:manage',
    'dashboard:hr',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return userRole === requiredRole;
}

export function hasAnyRole(userRole: UserRole, roles: UserRole[]): boolean {
  return roles.includes(userRole);
}

export function canAccess(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

export function canAccessAny(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}
