// Shared example data + response helpers for the API spec.
// Values mirror the frontend mock data so examples line up with what the UI already renders.

export const T = {
  created: '2022-03-15T09:00:00Z',
  updated: '2026-09-19T10:15:00Z',
  now: '2026-09-20T09:30:00Z',
};

export const DAYS_5 = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

// ── Response envelopes ──────────────────────────────────────────────────────
export const ok = (data, message) => ({ success: true, ...(message ? { message } : {}), data });

export const list = (items, { page = 1, pageSize = 10, total = items.length } = {}) => ({
  success: true,
  data: items,
  pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
});

export const err = (code, message, errors, extra = {}) => ({
  success: false,
  code,
  message,
  ...(errors ? { errors } : {}),
  ...extra,
  requestId: 'req_8f3c2a91',
});

export const validation = (...errors) =>
  err('VALIDATION_ERROR', 'One or more fields are invalid', errors.map(([field, message]) => ({ field, message })));

export const notFound = (what) => err('NOT_FOUND', `${what} not found`);
export const forbidden = (message = 'You do not have permission to perform this action') => err('FORBIDDEN', message);
export const conflict = (message, code = 'CONFLICT', extra) => err(code, message, undefined, extra);

// ── Example entities ────────────────────────────────────────────────────────
export const company = {
  id: 'company-001',
  name: 'Nexus Technologies Pvt Ltd',
  code: 'NXTECH',
  registrationNumber: 'CIN-U72200KL2010PTC024312',
  email: 'admin@nexustech.in',
  phone: '+91-484-2345678',
  address: '3rd Floor, Carnival Infopark, Kakkanad',
  city: 'Kochi',
  state: 'Kerala',
  country: 'India',
  logoUrl: null,
  status: 'ACTIVE',
  subCompanyCount: 3,
  deviceCount: 8,
  employeeCount: 25,
  createdAt: T.created,
  updatedAt: '2024-08-10T14:30:00Z',
};
export const company2 = {
  ...company,
  id: 'company-002',
  name: 'Vertex Solutions India',
  code: 'VRTXIN',
  registrationNumber: 'CIN-U72300MH2014PTC154785',
  email: 'info@vertexsolutions.in',
  phone: '+91-22-67891234',
  address: 'Level 14, One BKC, Bandra Kurla Complex',
  city: 'Mumbai',
  state: 'Maharashtra',
  subCompanyCount: 4,
  deviceCount: 12,
  employeeCount: 0,
  createdAt: '2022-07-20T10:15:00Z',
};

export const sub = {
  id: 'sub-002',
  companyId: 'company-001',
  companyName: 'Nexus Technologies Pvt Ltd',
  name: 'Nexus Bangalore',
  code: 'NXTECH-BLR',
  email: 'blr@nexustech.in',
  phone: '+91-80-41234568',
  address: 'Prestige Tech Park, Marathahalli',
  city: 'Bengaluru',
  state: 'Karnataka',
  country: 'India',
  logoUrl: null,
  status: 'ACTIVE',
  employeeCount: 5,
  deviceCount: 3,
  hrCount: 1,
  timezone: 'Asia/Kolkata',
  workingDays: DAYS_5,
  createdAt: '2022-05-10T09:00:00Z',
  updatedAt: '2024-08-15T11:00:00Z',
};
export const sub1 = { ...sub, id: 'sub-001', name: 'Nexus Kochi HQ', code: 'NXTECH-KOC', city: 'Kochi', state: 'Kerala', email: 'kochi@nexustech.in', phone: '+91-484-2345679', address: '3rd Floor, Carnival Infopark', employeeCount: 15, deviceCount: 3 };

export const department = {
  id: 'dept-company-001-1',
  name: 'Engineering',
  description: 'Software engineering and QA',
  status: 'ACTIVE',
  companyId: 'company-001',
  createdAt: '2023-01-05T09:00:00Z',
  updatedAt: '2023-01-05T09:00:00Z',
};

export const authUser = {
  id: 'user-004',
  email: 'hr@example.com',
  firstName: 'Divya',
  lastName: 'Menon',
  role: 'HR',
  companyId: 'company-001',
  companyName: 'Nexus Technologies Pvt Ltd',
  subCompanyId: 'sub-001',
  subCompanyName: 'Nexus Kochi HQ',
  avatarUrl: null,
  isActive: true,
};

export const user = {
  id: 'user-004',
  firstName: 'Divya',
  lastName: 'Menon',
  fullName: 'Divya Menon',
  email: 'hr@example.com',
  phone: '+91-9876543213',
  username: 'hr_kochi',
  role: 'HR',
  companyId: 'company-001',
  companyName: 'Nexus Technologies Pvt Ltd',
  subCompanyId: 'sub-001',
  subCompanyName: 'Nexus Kochi HQ',
  status: 'ACTIVE',
  lastLogin: '2026-09-19T08:45:00Z',
  createdAt: '2022-04-01T09:00:00Z',
  updatedAt: '2026-09-19T08:45:00Z',
};
export const adminUser = {
  ...user,
  id: 'user-002',
  firstName: 'Meera',
  lastName: 'Nambiar',
  fullName: 'Meera Nambiar',
  email: 'admin@example.com',
  phone: '+91-9876543211',
  username: 'admin_nexus',
  role: 'ADMIN',
  subCompanyId: null,
  subCompanyName: null,
};

export const employee = {
  id: 'emp-001',
  employeeCode: 'EMP-1001',
  firstName: 'Rahul',
  lastName: 'Menon',
  fullName: 'Rahul Menon',
  email: 'rahul.menon@nexustech.in',
  phone: '+91-9845001001',
  dateOfBirth: '1992-05-15',
  address: '12, Panampilly Nagar, Kochi',
  avatarUrl: null,
  department: 'Engineering',
  designation: 'Senior Software Engineer',
  employeeType: 'FULL_TIME',
  joiningDate: '2020-03-01',
  status: 'ACTIVE',
  companyId: 'company-001',
  companyName: 'Nexus Technologies Pvt Ltd',
  subCompanyId: 'sub-001',
  subCompanyName: 'Nexus Kochi HQ',
  shiftId: 'shift-001',
  shiftName: 'General Shift',
  weeklyOff: ['SATURDAY', 'SUNDAY'],
  deviceId: null,
  createdAt: '2020-03-01T09:00:00Z',
  updatedAt: '2024-01-15T09:00:00Z',
};
export const employee2 = {
  ...employee,
  id: 'emp-002',
  employeeCode: 'EMP-1002',
  firstName: 'Aishwarya',
  lastName: 'Nair',
  fullName: 'Aishwarya Nair',
  email: 'aishwarya.nair@nexustech.in',
  phone: '+91-9845001002',
  designation: 'Software Engineer',
};

export const shift = {
  id: 'shift-001',
  name: 'General Shift',
  startTime: '09:00',
  endTime: '18:00',
  breakStartTime: '13:00',
  breakEndTime: '14:00',
  gracePeriodMinutes: 15,
  isOvernight: false,
  totalWorkMinutes: 480,
  status: 'ACTIVE',
  companyId: 'company-001',
  subCompanyId: 'sub-001',
  createdAt: '2022-04-01T09:00:00Z',
  updatedAt: '2022-04-01T09:00:00Z',
};
export const nightShift = { ...shift, id: 'shift-006', name: 'US Shift', startTime: '18:00', endTime: '03:00', breakStartTime: null, breakEndTime: null, isOvernight: true, totalWorkMinutes: 540, subCompanyId: 'sub-002' };

export const holiday = {
  id: 'hol-002',
  name: 'Republic Day',
  date: '2026-01-26',
  description: 'National holiday',
  status: 'ACTIVE',
  companyId: 'company-001',
  subCompanyId: 'sub-001',
  year: 2026,
  createdAt: '2025-12-01T09:00:00Z',
  updatedAt: '2025-12-01T09:00:00Z',
};

export const device = {
  id: 'device-001',
  deviceId: 'DEV-NX-001',
  name: 'Kochi Main Entrance',
  modelNumber: 'BioMax Pro 7000',
  serialNumber: 'BMP7K-20240301-001',
  macAddress: '00:1A:2B:3C:4D:01',
  firmwareVersion: '3.4.2',
  ipAddress: '192.168.10.11',
  status: 'ONLINE',
  companyId: 'company-001',
  companyName: 'Nexus Technologies Pvt Ltd',
  subCompanyId: 'sub-001',
  subCompanyName: 'Nexus Kochi HQ',
  lastSeen: '2026-09-20T09:45:00Z',
  lastPunch: '2026-09-20T09:42:00Z',
  allocatedAt: '2022-04-01T09:00:00Z',
  createdAt: '2022-03-25T09:00:00Z',
  updatedAt: '2026-09-20T09:45:00Z',
};
export const spareDevice = {
  id: 'device-011',
  deviceId: 'DEV-NEW-001',
  name: 'Spare Device 01',
  modelNumber: 'BioMax Pro 7000',
  serialNumber: 'BMP7K-20260901-099',
  macAddress: '00:FF:EE:DD:CC:01',
  firmwareVersion: '3.4.2',
  ipAddress: '0.0.0.0',
  status: 'UNALLOCATED',
  companyId: null,
  companyName: null,
  subCompanyId: null,
  subCompanyName: null,
  lastSeen: null,
  lastPunch: null,
  allocatedAt: null,
  createdAt: '2026-09-01T09:00:00Z',
  updatedAt: '2026-09-01T09:00:00Z',
};
export const allocation = {
  id: 'alloc-003',
  deviceId: 'device-004',
  deviceName: 'Bangalore Entry',
  companyId: 'company-001',
  companyName: 'Nexus Technologies Pvt Ltd',
  subCompanyId: 'sub-002',
  subCompanyName: 'Nexus Bangalore',
  allocatedBy: 'Arjun Krishnaswamy',
  allocatedAt: '2022-05-15T09:00:00Z',
  deallocatedAt: null,
  deallocatedBy: null,
  deallocationReason: null,
  isActive: true,
  notes: 'Main entry for Bangalore office',
};

export const punch = (n, type, time, extra = {}) => ({
  id: `p-00${n}`,
  employeeId: 'emp-001',
  employeeCode: 'EMP-1001',
  employeeName: 'Rahul Menon',
  deviceId: 'device-001',
  deviceName: 'Kochi Main Entrance',
  punchTime: `2026-09-19T${time}:00`,
  punchType: type,
  companyId: 'company-001',
  subCompanyId: 'sub-001',
  date: '2026-09-19',
  ...extra,
});

export const attendance = {
  id: 'att-emp-001-2026-09-19',
  employeeId: 'emp-001',
  employeeCode: 'EMP-1001',
  employeeName: 'Rahul Menon',
  department: 'Engineering',
  designation: 'Senior Software Engineer',
  date: '2026-09-19',
  shiftId: 'shift-001',
  shiftName: 'General Shift',
  shiftStartTime: '09:00',
  shiftEndTime: '18:00',
  firstPunchIn: '2026-09-19T08:55:00',
  lastPunchOut: '2026-09-19T18:35:00',
  punchRecords: [punch(1, 'IN', '08:55'), punch(2, 'OUT', '13:01'), punch(3, 'IN', '13:55'), punch(4, 'OUT', '18:35')],
  workingMinutes: 526,
  breakMinutes: 54,
  lateMinutes: 0,
  earlyOutMinutes: 0,
  overtimeMinutes: 35,
  status: 'PRESENT',
  companyId: 'company-001',
  subCompanyId: 'sub-001',
  subCompanyName: 'Nexus Kochi HQ',
  isManual: false,
  manualReason: null,
  manualSource: null,
  manualBy: null,
  manualAt: null,
  leaveType: null,
  leaveRequestId: null,
};
export const attendanceLate = {
  ...attendance,
  id: 'att-emp-002-2026-09-19',
  employeeId: 'emp-002',
  employeeCode: 'EMP-1002',
  employeeName: 'Aishwarya Nair',
  designation: 'Software Engineer',
  firstPunchIn: '2026-09-19T09:42:00',
  lastPunchOut: '2026-09-19T18:10:00',
  punchRecords: [punch(5, 'IN', '09:42', { employeeId: 'emp-002', employeeCode: 'EMP-1002', employeeName: 'Aishwarya Nair' }), punch(6, 'OUT', '18:10', { employeeId: 'emp-002', employeeCode: 'EMP-1002', employeeName: 'Aishwarya Nair' })],
  workingMinutes: 508,
  breakMinutes: 0,
  lateMinutes: 27,
  overtimeMinutes: 10,
  status: 'LATE',
};
export const attendanceManual = {
  ...attendance,
  isManual: true,
  manualReason: 'Device was offline; employee forgot to punch out',
  manualSource: 'MANUAL',
  manualBy: 'Divya Menon',
  manualAt: '2026-09-20T09:12:00Z',
  punchRecords: [punch(1, 'IN', '09:10'), punch(9, 'OUT', '18:05', { id: 'manual-emp-001-2026-09-19-out-0', deviceId: 'MANUAL', deviceName: 'Manual Entry' })],
  workingMinutes: 535,
};

export const dailyStats = {
  total: 25, present: 9, absent: 1, late: 3, earlyOut: 1, missingPunch: 1, onLeave: 0, holiday: 0, weeklyOff: 10, overtimeMinutes: 57,
};

export const request = {
  id: 'req-0001',
  type: 'MISSING_PUNCH',
  status: 'PENDING',
  employeeId: 'emp-006',
  employeeCode: 'EMP-1006',
  employeeName: 'Mohammed Shafi',
  department: 'Finance',
  companyId: 'company-001',
  subCompanyId: 'sub-001',
  subCompanyName: 'Nexus Kochi HQ',
  date: '2026-09-20',
  endDate: null,
  punches: [{ punchIn: '', punchOut: '18:05' }],
  leaveType: null,
  leaveDays: null,
  reason: 'Forgot to punch out; left at 6:05 PM after the release call',
  requestedBy: 'Divya Menon',
  requestedByRole: 'HR',
  requestedAt: '2026-09-20T01:29:00Z',
  reviewedBy: null,
  reviewComment: null,
  reviewedAt: null,
};
export const leaveRequest = {
  ...request,
  id: 'req-0003',
  type: 'LEAVE',
  employeeId: 'emp-002',
  employeeCode: 'EMP-1002',
  employeeName: 'Aishwarya Nair',
  department: 'Engineering',
  date: '2026-09-23',
  endDate: '2026-09-25',
  punches: null,
  leaveType: 'CASUAL',
  leaveDays: 3,
  reason: 'Family function out of town',
};

export const leaveBalance = {
  employeeId: 'emp-003',
  employeeCode: 'EMP-1003',
  employeeName: 'Vishnu Raj',
  department: 'Engineering',
  subCompanyId: 'sub-001',
  subCompanyName: 'Nexus Kochi HQ',
  year: 2026,
  balances: {
    CASUAL: { total: 12, used: 3, pending: 0 },
    SICK: { total: 10, used: 0, pending: 0 },
    EARNED: { total: 15, used: 0, pending: 0 },
    UNPAID: { used: 0, pending: 0 },
  },
};

export const attendanceSettings = {
  companyId: 'company-001',
  lateGracePeriodMinutes: 15,
  earlyOutThresholdMinutes: 15,
  minimumWorkingHours: '07:00',
  overtimeThresholdMinutes: 30,
  overtimeEnabled: true,
  autoAbsent: false,
  updatedAt: '2026-09-14T10:45:00Z',
  updatedBy: 'Meera Nambiar',
};

export const activityLog = {
  id: 'log-0016',
  date: '2026-09-20T09:30:00Z',
  userId: 'user-001',
  userName: 'Arjun Krishnaswamy',
  userRole: 'SUPER_ADMIN',
  action: 'ALLOCATED',
  module: 'Devices',
  target: 'DEV-NX-004 → Nexus Bangalore',
  targetId: 'device-004',
  details: 'Main entry for Bangalore office',
  ipAddress: '203.0.113.24',
  companyId: 'company-001',
};

export const reportJob = {
  id: 'rpt_01J8Z3K4M5',
  type: 'MONTHLY',
  format: 'EXCEL',
  status: 'COMPLETED',
  fileName: 'attendance_monthly_report_20260920_093000.xlsx',
  fileSize: 48213,
  rowCount: 550,
  downloadUrl: '/api/v1/reports/rpt_01J8Z3K4M5/download',
  expiresAt: '2026-09-27T09:30:00Z',
  filters: { type: 'MONTHLY', month: 9, year: 2026, subCompanyId: 'sub-001', format: 'EXCEL' },
  requestedBy: 'Divya Menon',
  requestedAt: '2026-09-20T09:30:00Z',
  completedAt: '2026-09-20T09:30:02Z',
  error: null,
};

// Used in list examples
export const pg = (items, opts) => list(items, opts);
