import { getCompaniesSnapshot, getSubCompaniesSnapshot } from './company.service';
import { getDevicesSnapshot } from './device.service';
import { getEmployeesSnapshot } from './employee.service';
import { getUsersSnapshot } from './user.service';
import { getRecentActivitySync } from './activityLog.service';
import type { AttendanceRecord } from '@/types/attendance';
import { getRecordsForDate } from './attendance.service';
import { sleep } from '@/lib/utils';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export interface SuperAdminDashboardData {
  totalCompanies: number;
  activeCompanies: number;
  totalSubCompanies: number;
  totalEmployees: number;
  totalUsers: number;
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  /** Cumulative companies registered per month, last 6 months. */
  companyTrend: Array<{ month: string; companies: number }>;
  deviceStatus: Array<{ name: string; value: number; color: string }>;
  topCompanies: Array<{ id: string; name: string; employees: number; subCompanies: number }>;
  recentActivity: Array<{ id: string; action: string; module: string; target: string; userName: string; date: string }>;
}

export interface AdminDashboardData {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  totalSubCompanies: number;
  totalDevices: number;
  attendanceTrend: Array<{ date: string; present: number; absent: number; late: number }>;
  departmentDistribution: Array<{ name: string; value: number; color: string }>;
}

export interface HRDashboardData {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  earlyOut: number;
  missingPunch: number;
  onLeave: number;
  holiday: number;
  weeklyAttendance: Array<{ date: string; present: number; absent: number; late: number }>;
  departmentAttendance: Array<{ dept: string; present: number; total: number }>;
  recentAttendance: AttendanceRecord[];
}

const ATTENDED = new Set(['PRESENT', 'LATE', 'EARLY_OUT']);

function dayBreakdown(records: AttendanceRecord[]) {
  return {
    present: records.filter((r) => ATTENDED.has(r.status)).length,
    absent: records.filter((r) => r.status === 'ABSENT').length,
    late: records.filter((r) => r.status === 'LATE').length,
  };
}

/** Real per-day counts for the last 7 days, scoped by the given record filter. */
function weeklyTrend(scope: (r: AttendanceRecord) => boolean) {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = subDays(today, 6 - i);
    return {
      date: format(d, 'EEE'),
      ...dayBreakdown(getRecordsForDate(format(d, 'yyyy-MM-dd')).filter(scope)),
    };
  });
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

export const dashboardService = {
  async getSuperAdminDashboard(): Promise<SuperAdminDashboardData> {
    await sleep(500);

    const companies = getCompaniesSnapshot();
    const subCompanies = getSubCompaniesSnapshot();
    const devices = getDevicesSnapshot();

    const companyTrend = Array.from({ length: 6 }, (_, i) => {
      const monthStart = startOfMonth(subMonths(new Date(), 5 - i));
      const monthEnd = endOfMonth(monthStart);
      return {
        month: format(monthStart, 'MMM'),
        companies: companies.filter((c) => new Date(c.createdAt) <= monthEnd).length,
      };
    });

    const countStatus = (status: string) => devices.filter((d) => d.status === status).length;

    return {
      totalCompanies: companies.length,
      activeCompanies: companies.filter((c) => c.status === 'ACTIVE').length,
      totalSubCompanies: subCompanies.length,
      totalEmployees: getEmployeesSnapshot().length,
      totalUsers: getUsersSnapshot().length,
      totalDevices: devices.length,
      onlineDevices: countStatus('ONLINE'),
      offlineDevices: countStatus('OFFLINE'),
      companyTrend,
      deviceStatus: [
        { name: 'Online', value: countStatus('ONLINE'), color: '#22c55e' },
        { name: 'Offline', value: countStatus('OFFLINE'), color: '#ef4444' },
        { name: 'Unallocated', value: countStatus('UNALLOCATED'), color: '#94a3b8' },
        { name: 'Maintenance', value: countStatus('MAINTENANCE'), color: '#f59e0b' },
      ],
      topCompanies: [...companies]
        .sort((a, b) => b.employeeCount - a.employeeCount)
        .slice(0, 5)
        .map((c) => ({ id: c.id, name: c.name, employees: c.employeeCount, subCompanies: c.subCompanyCount })),
      recentActivity: getRecentActivitySync(6).map((l) => ({
        id: l.id, action: l.action, module: l.module, target: l.target, userName: l.userName, date: l.date,
      })),
    };
  },

  async getAdminDashboard(companyId: string, subCompanyId?: string): Promise<AdminDashboardData> {
    await sleep(500);

    const allCompanyEmployees = getEmployeesSnapshot().filter((e) => e.companyId === companyId);
    const filteredEmployees = subCompanyId
      ? allCompanyEmployees.filter((e) => e.subCompanyId === subCompanyId)
      : allCompanyEmployees;

    const subCompanies = getSubCompaniesSnapshot().filter((sc) => sc.companyId === companyId);
    const companyDevices = getDevicesSnapshot().filter((d) =>
      subCompanyId ? d.subCompanyId === subCompanyId : d.companyId === companyId
    );

    const inScope = (r: AttendanceRecord) =>
      r.companyId === companyId && (!subCompanyId || r.subCompanyId === subCompanyId);
    const todayRecords = getRecordsForDate(format(new Date(), 'yyyy-MM-dd')).filter(inScope);
    const attendanceTrend = weeklyTrend(inScope);

    const depts = [...new Set(filteredEmployees.map((e) => e.department))];
    const departmentDistribution = depts.slice(0, 6).map((dept, i) => ({
      name: dept,
      value: filteredEmployees.filter((e) => e.department === dept).length,
      color: COLORS[i] ?? '#3b82f6',
    }));

    return {
      totalEmployees: filteredEmployees.length,
      presentToday: todayRecords.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length,
      absentToday:  todayRecords.filter((r) => r.status === 'ABSENT').length,
      lateToday:    todayRecords.filter((r) => r.status === 'LATE').length,
      totalSubCompanies: subCompanyId ? 1 : subCompanies.length,
      totalDevices: companyDevices.length,
      attendanceTrend,
      departmentDistribution,
    };
  },

  async getHRDashboard(subCompanyId: string): Promise<HRDashboardData> {
    await sleep(500);

    const subEmployees = getEmployeesSnapshot().filter((e) => e.subCompanyId === subCompanyId);
    const inScope = (r: AttendanceRecord) => r.subCompanyId === subCompanyId;
    const todayRecords = getRecordsForDate(format(new Date(), 'yyyy-MM-dd')).filter(inScope);
    const weeklyAttendance = weeklyTrend(inScope);

    const depts = [...new Set(subEmployees.map((e) => e.department))];
    const departmentAttendance = depts.map((dept) => ({
      dept,
      present: todayRecords.filter((r) => r.department === dept && ATTENDED.has(r.status)).length,
      total: subEmployees.filter((e) => e.department === dept && e.status === 'ACTIVE').length,
    }));

    return {
      totalEmployees: subEmployees.filter((e) => e.status === 'ACTIVE').length,
      presentToday: todayRecords.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length,
      absentToday: todayRecords.filter((r) => r.status === 'ABSENT').length,
      lateToday: todayRecords.filter((r) => r.status === 'LATE').length,
      earlyOut: todayRecords.filter((r) => r.status === 'EARLY_OUT').length,
      missingPunch: todayRecords.filter((r) => r.status === 'INCOMPLETE').length,
      onLeave: todayRecords.filter((r) => r.status === 'ON_LEAVE').length,
      holiday: todayRecords.filter((r) => r.status === 'HOLIDAY').length,
      weeklyAttendance,
      departmentAttendance,
      recentAttendance: todayRecords.slice(0, 10),
    };
  },
};
