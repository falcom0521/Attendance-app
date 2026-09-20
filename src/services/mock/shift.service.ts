import type { Shift, CreateShiftPayload } from '@/types/shift';
import { mockShifts } from '@/mocks/data/shifts';
import { mockSubCompanies } from '@/mocks/data/subCompanies';
import { sleep } from '@/lib/utils';
import { logActivity } from './activityLog.service';

let shifts = [...mockShifts];

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Paid minutes in a shift: end − start (rolling past midnight) minus the break. */
function shiftMinutes(start: string, end: string, breakStart?: string, breakEnd?: string): number {
  let total = toMinutes(end) - toMinutes(start);
  if (total <= 0) total += 1440;
  if (breakStart && breakEnd) {
    let brk = toMinutes(breakEnd) - toMinutes(breakStart);
    if (brk < 0) brk += 1440;
    total -= brk;
  }
  return total;
}

export function getShiftsSnapshot(): Shift[] {
  return shifts;
}

export const shiftService = {
  async getShifts(subCompanyId?: string, companyId?: string): Promise<Shift[]> {
    await sleep(300);
    return shifts.filter(
      (s) =>
        (!subCompanyId || s.subCompanyId === subCompanyId) &&
        (!companyId || s.companyId === companyId)
    );
  },

  async getShiftById(id: string): Promise<Shift> {
    await sleep(200);
    const shift = shifts.find((s) => s.id === id);
    if (!shift) throw new Error('Shift not found');
    return shift;
  },

  async createShift(payload: CreateShiftPayload): Promise<Shift> {
    await sleep(500);
    const start = parseInt(payload.startTime.replace(':', ''));
    const end = parseInt(payload.endTime.replace(':', ''));
    const newShift: Shift = {
      ...payload,
      id: `shift-${String(shifts.length + 1).padStart(3, '0')}`,
      isOvernight: end < start,
      totalWorkMinutes: shiftMinutes(payload.startTime, payload.endTime, payload.breakStartTime, payload.breakEndTime),
      companyId: mockSubCompanies.find((sc) => sc.id === payload.subCompanyId)?.companyId ?? '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    shifts.push(newShift);
    logActivity({ action: 'CREATED', module: 'Shifts', target: newShift.name, targetId: newShift.id, details: `${newShift.startTime} – ${newShift.endTime}`, companyId: newShift.companyId });
    return newShift;
  },

  async updateShift(id: string, payload: Partial<CreateShiftPayload>): Promise<Shift> {
    await sleep(400);
    const idx = shifts.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Shift not found');
    shifts[idx] = { ...shifts[idx], ...payload, updatedAt: new Date().toISOString() };
    logActivity({ action: 'UPDATED', module: 'Shifts', target: shifts[idx].name, targetId: id, companyId: shifts[idx].companyId });
    return shifts[idx];
  },

  async deleteShift(id: string): Promise<void> {
    await sleep(300);
    const removed = shifts.find((s) => s.id === id);
    shifts = shifts.filter((s) => s.id !== id);
    if (removed) logActivity({ action: 'DELETED', module: 'Shifts', target: removed.name, targetId: id, companyId: removed.companyId });
  },

  async toggleShiftStatus(id: string): Promise<Shift> {
    await sleep(300);
    const idx = shifts.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Shift not found');
    shifts[idx].status = shifts[idx].status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    shifts[idx].updatedAt = new Date().toISOString();
    logActivity({ action: shifts[idx].status === 'ACTIVE' ? 'ACTIVATED' : 'DEACTIVATED', module: 'Shifts', target: shifts[idx].name, targetId: id, companyId: shifts[idx].companyId });
    return shifts[idx];
  },
};
