export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'UNALLOCATED' | 'MAINTENANCE';

export interface Device {
  id: string;
  deviceId: string;
  name: string;
  modelNumber: string;
  serialNumber: string;
  macAddress: string;
  firmwareVersion: string;
  ipAddress: string;
  status: DeviceStatus;
  companyId?: string;
  companyName?: string;
  subCompanyId?: string;
  subCompanyName?: string;
  lastSeen?: string;
  lastPunch?: string;
  allocatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceAllocation {
  id: string;
  deviceId: string;
  deviceName: string;
  companyId: string;
  companyName: string;
  subCompanyId: string;
  subCompanyName: string;
  allocatedBy: string;
  allocatedAt: string;
  deallocatedAt?: string;
  isActive: boolean;
  notes?: string;
  deallocatedBy?: string;
  deallocationReason?: string;
}

export interface DeviceStats {
  punchesToday: number;
  punchesLast7Days: number;
  uniqueEmployeesToday: number;
  lastPunch?: string;
}

export interface DevicePunchLog {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  punchTime: string;
  punchType: 'IN' | 'OUT';
  subCompanyId: string;
}

export interface DevicePunchLogFilters {
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  /** Field to sort by; defaults to `punchTime` descending (newest first) when omitted. */
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface DeallocateDevicePayload {
  deviceId: string;
  reason?: string;
}

export interface CreateDevicePayload {
  deviceId: string;
  name: string;
  modelNumber: string;
  serialNumber: string;
  macAddress: string;
  firmwareVersion: string;
  ipAddress: string;
}

export interface AllocateDevicePayload {
  deviceId: string;
  companyId: string;
  subCompanyId: string;
  notes?: string;
}
