import type { Holiday, CreateHolidayPayload } from '@/types/holiday';
import { mockHolidays } from '@/mocks/data/holidays';
import { mockSubCompanies } from '@/mocks/data/subCompanies';
import { sleep } from '@/lib/utils';
import { logActivity } from './activityLog.service';

let holidays = [...mockHolidays];

export function getHolidaysSnapshot(): Holiday[] {
  return holidays;
}

export const holidayService = {
  async getHolidays(subCompanyId?: string, year?: number, companyId?: string): Promise<Holiday[]> {
    await sleep(300);
    let filtered = [...holidays];
    if (companyId) filtered = filtered.filter((h) => h.companyId === companyId);
    if (subCompanyId) filtered = filtered.filter((h) => h.subCompanyId === subCompanyId);
    if (year) filtered = filtered.filter((h) => h.year === year);
    return filtered.sort((a, b) => a.date.localeCompare(b.date));
  },

  async createHoliday(payload: CreateHolidayPayload): Promise<Holiday> {
    await sleep(500);
    const year = parseInt(payload.date.split('-')[0] ?? '2026');
    const newHoliday: Holiday = {
      ...payload,
      id: `hol-${String(holidays.length + 1).padStart(3, '0')}`,
      companyId: mockSubCompanies.find((sc) => sc.id === payload.subCompanyId)?.companyId ?? '',
      year,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    holidays.push(newHoliday);
    logActivity({ action: 'CREATED', module: 'Holidays', target: `${newHoliday.name} - ${newHoliday.date}`, targetId: newHoliday.id, companyId: newHoliday.companyId });
    return newHoliday;
  },

  async updateHoliday(id: string, payload: Partial<CreateHolidayPayload>): Promise<Holiday> {
    await sleep(400);
    const idx = holidays.findIndex((h) => h.id === id);
    if (idx === -1) throw new Error('Holiday not found');
    holidays[idx] = { ...holidays[idx], ...payload, updatedAt: new Date().toISOString() };
    logActivity({ action: 'UPDATED', module: 'Holidays', target: holidays[idx].name, targetId: id, companyId: holidays[idx].companyId });
    return holidays[idx];
  },

  async deleteHoliday(id: string): Promise<void> {
    await sleep(300);
    const removed = holidays.find((h) => h.id === id);
    holidays = holidays.filter((h) => h.id !== id);
    if (removed) logActivity({ action: 'DELETED', module: 'Holidays', target: removed.name, targetId: id, companyId: removed.companyId });
  },
};
