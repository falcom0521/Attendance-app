import type { AttendanceSettings } from '@/types/settings';
import { sleep } from '@/lib/utils';
import { logActivity } from './activityLog.service';

export const DEFAULT_ATTENDANCE_SETTINGS: AttendanceSettings = {
  lateGracePeriodMinutes: 15,
  earlyOutThresholdMinutes: 15,
  minimumWorkingHoursEnabled: false,
  overtimeThresholdMinutes: 30,
  overtimeEnabled: true,
  autoAbsent: false,
};

const settingsByCompany = new Map<string, AttendanceSettings>();

/** Synchronous read used by the attendance engine (mock layer only). */
export function getAttendanceSettingsSync(companyId?: string): AttendanceSettings {
  return (companyId && settingsByCompany.get(companyId)) || DEFAULT_ATTENDANCE_SETTINGS;
}

export const settingsService = {
  async getAttendanceSettings(companyId: string): Promise<AttendanceSettings> {
    await sleep(200);
    return getAttendanceSettingsSync(companyId);
  },

  async updateAttendanceSettings(
    companyId: string,
    payload: AttendanceSettings
  ): Promise<AttendanceSettings> {
    await sleep(400);
    settingsByCompany.set(companyId, { ...payload });
    logActivity({ action: 'UPDATED', module: 'Configuration', target: 'Attendance Settings', details: `Grace ${payload.lateGracePeriodMinutes}m · early-out ${payload.earlyOutThresholdMinutes}m · overtime ${payload.overtimeEnabled ? `after ${payload.overtimeThresholdMinutes}m` : 'off'} · flexible timing ${payload.minimumWorkingHoursEnabled ? 'on' : 'off'}`, companyId });
    return payload;
  },
};
