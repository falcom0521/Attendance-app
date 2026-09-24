import type {
  Device, DeviceAllocation, CreateDevicePayload, AllocateDevicePayload, DeallocateDevicePayload,
  DeviceStats, DevicePunchLog, DevicePunchLogFilters,
} from '@/types/device';
import type { PaginatedResponse, PaginationParams, FilterParams } from '@/types/common';
import { mockDevices, mockDeviceAllocations } from '@/mocks/data/devices';
import { sleep } from '@/lib/utils';
import { assertWritable } from './writeGuard';
import { format, subDays } from 'date-fns';
import { getAllAttendanceRecords } from './attendance.service';
import { MANUAL_DEVICE_ID } from './attendanceEngine';
import { logActivity, getActivityActorName } from './activityLog.service';
import { getCompaniesSnapshot, getSubCompaniesSnapshot } from './company.service';
import { sortRecords } from '@/lib/sort';

// eslint-disable-next-line prefer-const
let devices: Device[] = [...mockDevices];
let allocations = [...mockDeviceAllocations];

export function getDevicesSnapshot(): Device[] {
  return devices;
}

export const deviceService = {
  async getDevices(
    params?: PaginationParams & FilterParams & { companyId?: string; subCompanyId?: string; status?: string }
  ): Promise<PaginatedResponse<Device>> {
    await sleep(400);
    let filtered = [...devices];
    if (params?.companyId) filtered = filtered.filter((d) => d.companyId === params.companyId);
    if (params?.subCompanyId) filtered = filtered.filter((d) => d.subCompanyId === params.subCompanyId);
    if (params?.status) filtered = filtered.filter((d) => d.status === (params.status as Device['status']));
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (d) => d.deviceId.toLowerCase().includes(q) || d.name.toLowerCase().includes(q) || d.serialNumber.toLowerCase().includes(q)
      );
    }
    filtered = sortRecords(filtered, params?.sortBy, params?.sortDir, (d, key) => d[key as keyof Device]);
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 10;
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);
    return { data, total: filtered.length, page, pageSize, totalPages: Math.ceil(filtered.length / pageSize) };
  },

  async getDeviceById(id: string): Promise<Device> {
    await sleep(200);
    const device = devices.find((d) => d.id === id);
    if (!device) throw new Error('Device not found');
    return device;
  },

  async createDevice(payload: CreateDevicePayload): Promise<Device> {
    assertWritable();
    await sleep(600);
    const newDevice: Device = {
      ...payload,
      id: `device-${String(devices.length + 1).padStart(3, '0')}`,
      status: 'UNALLOCATED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    devices.push(newDevice);
    logActivity({ action: 'CREATED', module: 'Devices', target: `${newDevice.deviceId} (${newDevice.modelNumber})`, targetId: newDevice.id, details: 'Device registered' });
    return newDevice;
  },

  async updateDevice(id: string, payload: Partial<CreateDevicePayload>): Promise<Device> {
    assertWritable();
    await sleep(500);
    const idx = devices.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error('Device not found');
    devices[idx] = { ...devices[idx], ...payload, updatedAt: new Date().toISOString() };
    logActivity({ action: 'UPDATED', module: 'Devices', target: devices[idx].deviceId, targetId: id, details: 'Device details updated', companyId: devices[idx].companyId });
    return devices[idx];
  },

  async allocateDevice(payload: AllocateDevicePayload): Promise<DeviceAllocation> {
    assertWritable();
    await sleep(700);
    const device = devices.find((d) => d.id === payload.deviceId);
    if (!device) throw new Error('Device not found');
    const company = getCompaniesSnapshot().find((c) => c.id === payload.companyId);
    const subCompany = getSubCompaniesSnapshot().find((sc) => sc.id === payload.subCompanyId);

    if (
      device.subCompanyId === payload.subCompanyId &&
      allocations.some((a) => a.deviceId === payload.deviceId && a.isActive)
    ) {
      throw new Error('Device is already allocated to this sub company');
    }

    // Close the previous allocation for this device (re-allocation keeps the history)
    allocations = allocations.map((a) =>
      a.deviceId === payload.deviceId && a.isActive
        ? {
            ...a,
            isActive: false,
            deallocatedAt: new Date().toISOString(),
            deallocatedBy: getActivityActorName(),
            deallocationReason: 'Re-allocated to another sub company',
          }
        : a
    );

    const newAllocation: DeviceAllocation = {
      id: `alloc-${String(allocations.length + 1).padStart(3, '0')}`,
      deviceId: payload.deviceId,
      deviceName: device.name,
      companyId: payload.companyId,
      companyName: company?.name ?? '',
      subCompanyId: payload.subCompanyId,
      subCompanyName: subCompany?.name ?? '',
      allocatedBy: getActivityActorName(),
      allocatedAt: new Date().toISOString(),
      isActive: true,
      notes: payload.notes,
    };
    allocations.push(newAllocation);
    logActivity({ action: 'ALLOCATED', module: 'Devices', target: `${device.deviceId} → ${subCompany?.name ?? payload.subCompanyId}`, targetId: device.id, details: payload.notes ?? 'Device allocated', companyId: payload.companyId });

    // Update device
    const idx = devices.findIndex((d) => d.id === payload.deviceId);
    devices[idx] = {
      ...devices[idx],
      companyId: payload.companyId,
      companyName: company?.name,
      subCompanyId: payload.subCompanyId,
      subCompanyName: subCompany?.name,
      // A re-allocated device keeps its health status; only a spare device comes online.
      status: devices[idx].status === 'UNALLOCATED' ? 'ONLINE' : devices[idx].status,
      allocatedAt: newAllocation.allocatedAt,
      updatedAt: new Date().toISOString(),
    };

    return newAllocation;
  },

  async getAllocations(deviceId?: string): Promise<DeviceAllocation[]> {
    await sleep(300);
    if (deviceId) return allocations.filter((a) => a.deviceId === deviceId);
    return allocations;
  },

  async getUnallocatedDevices(): Promise<Device[]> {
    await sleep(200);
    return devices.filter((d) => d.status === 'UNALLOCATED');
  },

  /** Returns a device to the spare pool, closing its active allocation. */
  async deallocateDevice(payload: DeallocateDevicePayload): Promise<Device> {
    assertWritable();
    await sleep(600);
    const idx = devices.findIndex((d) => d.id === payload.deviceId);
    if (idx === -1) throw new Error('Device not found');
    if (devices[idx].status === 'UNALLOCATED') throw new Error('Device is not allocated');

    allocations = allocations.map((a) =>
      a.deviceId === payload.deviceId && a.isActive
        ? {
            ...a,
            isActive: false,
            deallocatedAt: new Date().toISOString(),
            deallocatedBy: getActivityActorName(),
            deallocationReason: payload.reason || undefined,
          }
        : a
    );

    logActivity({ action: 'DEALLOCATED', module: 'Devices', target: `${devices[idx].deviceId} ← ${devices[idx].subCompanyName ?? ''}`, targetId: devices[idx].id, details: payload.reason ?? 'Device returned to the unallocated pool', companyId: devices[idx].companyId });
    devices[idx] = {
      ...devices[idx],
      companyId: undefined,
      companyName: undefined,
      subCompanyId: undefined,
      subCompanyName: undefined,
      allocatedAt: undefined,
      status: 'UNALLOCATED',
      updatedAt: new Date().toISOString(),
    };
    return devices[idx];
  },

  async getDeviceStats(deviceId: string): Promise<DeviceStats> {
    await sleep(250);
    const today = format(new Date(), 'yyyy-MM-dd');
    const weekAgo = format(subDays(new Date(), 6), 'yyyy-MM-dd');
    const punches = getAllAttendanceRecords()
      .flatMap((r) => r.punchRecords)
      .filter((p) => p.deviceId === deviceId);
    const todays = punches.filter((p) => p.date === today);
    return {
      punchesToday: todays.length,
      punchesLast7Days: punches.filter((p) => p.date >= weekAgo && p.date <= today).length,
      uniqueEmployeesToday: new Set(todays.map((p) => p.employeeId)).size,
      lastPunch: punches.map((p) => p.punchTime).sort().pop(),
    };
  },

  /** Punches recorded by this device, newest first. Manual entries are excluded. */
  async getDevicePunchLogs(
    deviceId: string,
    filters?: DevicePunchLogFilters
  ): Promise<PaginatedResponse<DevicePunchLog>> {
    await sleep(350);
    const q = filters?.search?.toLowerCase();
    const filtered = getAllAttendanceRecords()
      .flatMap((r) => r.punchRecords)
      .filter((p) => {
        if (p.deviceId !== deviceId || p.deviceId === MANUAL_DEVICE_ID) return false;
        if (filters?.startDate && p.date < filters.startDate) return false;
        if (filters?.endDate && p.date > filters.endDate) return false;
        if (q && !p.employeeName.toLowerCase().includes(q) && !p.employeeCode.toLowerCase().includes(q)) return false;
        return true;
      });
    const sorted = filters?.sortBy
      ? sortRecords(filtered, filters.sortBy, filters.sortDir, (p, key) => (p as unknown as Record<string, unknown>)[key])
      : [...filtered].sort((a, b) => b.punchTime.localeCompare(a.punchTime));

    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 15;
    const data: DevicePunchLog[] = sorted.slice((page - 1) * pageSize, page * pageSize).map((p) => ({
      id: p.id,
      employeeId: p.employeeId,
      employeeCode: p.employeeCode,
      employeeName: p.employeeName,
      punchTime: p.punchTime,
      punchType: p.punchType,
      subCompanyId: p.subCompanyId,
    }));
    return { data, total: filtered.length, page, pageSize, totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)) };
  },
};
