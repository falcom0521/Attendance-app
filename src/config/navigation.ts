import type { UserRole } from '@/types/auth';

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  children?: NavItem[];
  badge?: string;
}

export const SUPER_ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', path: '/super-admin/dashboard', icon: 'LayoutDashboard' },
  { label: 'Companies', path: '/super-admin/companies', icon: 'Building2' },
  { label: 'Sub Companies', path: '/super-admin/sub-companies', icon: 'GitBranch' },
  { label: 'Devices', path: '/super-admin/devices', icon: 'Monitor' },
  { label: 'Users', path: '/super-admin/users', icon: 'Users' },
  { label: 'Activity Logs', path: '/super-admin/activity-logs', icon: 'ScrollText' },
];

export const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: 'LayoutDashboard' },
  { label: 'Attendance', path: '/admin/attendance', icon: 'Clock' },
  // DISABLED (Requests & Leaves): commented out for now, re-enable later.
  // { label: 'Requests', path: '/admin/requests', icon: 'ClipboardCheck' },
  // { label: 'Leaves', path: '/admin/leaves', icon: 'CalendarOff' },
  { label: 'Employees', path: '/admin/employees', icon: 'Users' },
  { label: 'Devices', path: '/admin/devices', icon: 'Monitor' },
  { label: 'Reports', path: '/admin/reports', icon: 'FileBarChart' },
  { label: 'Users', path: '/admin/users', icon: 'UserCog' },
  { label: 'Configuration', path: '/admin/configuration', icon: 'Settings' },
];

export const HR_NAV: NavItem[] = [
  { label: 'Dashboard', path: '/hr/dashboard', icon: 'LayoutDashboard' },
  { label: 'Attendance', path: '/hr/attendance', icon: 'Clock' },
  // DISABLED (Requests & Leaves): commented out for now, re-enable later.
  // { label: 'Requests', path: '/hr/requests', icon: 'ClipboardCheck' },
  // { label: 'Leaves', path: '/hr/leaves', icon: 'CalendarOff' },
  { label: 'Employees', path: '/hr/employees', icon: 'Users' },
  { label: 'Reports', path: '/hr/reports', icon: 'FileBarChart' },
  { label: 'Configuration', path: '/hr/configuration', icon: 'Settings' },
];

export function getNavForRole(role: UserRole): NavItem[] {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'SUPER_ADMIN_VIEWER':
      return SUPER_ADMIN_NAV;
    case 'ADMIN':
      return ADMIN_NAV;
    case 'HR':
      return HR_NAV;
    default:
      return [];
  }
}
