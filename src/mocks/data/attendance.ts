import type { AttendanceRecord, PunchRecord } from '@/types/attendance';
import { format } from 'date-fns';

const TODAY = format(new Date(), 'yyyy-MM-dd');

function buildPunch(
  id: string, empId: string, empCode: string, empName: string,
  deviceId: string, deviceName: string, date: string, time: string,
  type: 'IN' | 'OUT', companyId = 'company-001', subCompanyId = 'sub-001'
): PunchRecord {
  return {
    id,
    employeeId: empId,
    employeeCode: empCode,
    employeeName: empName,
    deviceId,
    deviceName,
    punchTime: `${date}T${time}:00`,
    punchType: type,
    companyId,
    subCompanyId,
    date,
  };
}

// Today's punches for Kochi employees
export const mockPunchRecords: PunchRecord[] = [
  // emp-001 Rahul - Present (normal)
  buildPunch('p-001', 'emp-001', 'EMP-1001', 'Rahul Menon', 'device-001', 'Kochi Main Entrance', TODAY, '08:55', 'IN'),
  buildPunch('p-002', 'emp-001', 'EMP-1001', 'Rahul Menon', 'device-001', 'Kochi Main Entrance', TODAY, '13:01', 'OUT'),
  buildPunch('p-003', 'emp-001', 'EMP-1001', 'Rahul Menon', 'device-001', 'Kochi Main Entrance', TODAY, '13:55', 'IN'),
  buildPunch('p-004', 'emp-001', 'EMP-1001', 'Rahul Menon', 'device-001', 'Kochi Main Entrance', TODAY, '18:05', 'OUT'),
  // emp-002 Aishwarya - Late
  buildPunch('p-005', 'emp-002', 'EMP-1002', 'Aishwarya Nair', 'device-001', 'Kochi Main Entrance', TODAY, '09:42', 'IN'),
  buildPunch('p-006', 'emp-002', 'EMP-1002', 'Aishwarya Nair', 'device-001', 'Kochi Main Entrance', TODAY, '13:05', 'OUT'),
  buildPunch('p-007', 'emp-002', 'EMP-1002', 'Aishwarya Nair', 'device-001', 'Kochi Main Entrance', TODAY, '14:02', 'IN'),
  buildPunch('p-008', 'emp-002', 'EMP-1002', 'Aishwarya Nair', 'device-001', 'Kochi Main Entrance', TODAY, '18:10', 'OUT'),
  // emp-003 Vishnu - Present normal
  buildPunch('p-009', 'emp-003', 'EMP-1003', 'Vishnu Raj', 'device-001', 'Kochi Main Entrance', TODAY, '08:50', 'IN'),
  buildPunch('p-010', 'emp-003', 'EMP-1003', 'Vishnu Raj', 'device-001', 'Kochi Main Entrance', TODAY, '12:58', 'OUT'),
  buildPunch('p-011', 'emp-003', 'EMP-1003', 'Vishnu Raj', 'device-001', 'Kochi Main Entrance', TODAY, '13:58', 'IN'),
  buildPunch('p-012', 'emp-003', 'EMP-1003', 'Vishnu Raj', 'device-001', 'Kochi Main Entrance', TODAY, '18:00', 'OUT'),
  // emp-004 Ajay - Early out
  buildPunch('p-013', 'emp-004', 'EMP-1004', 'Ajay Thomas', 'device-001', 'Kochi Main Entrance', TODAY, '09:05', 'IN'),
  buildPunch('p-014', 'emp-004', 'EMP-1004', 'Ajay Thomas', 'device-001', 'Kochi Main Entrance', TODAY, '16:30', 'OUT'),
  // emp-005 Sreelakshmi - Present
  buildPunch('p-015', 'emp-005', 'EMP-1005', 'Sreelakshmi Krishnan', 'device-001', 'Kochi Main Entrance', TODAY, '08:58', 'IN'),
  buildPunch('p-016', 'emp-005', 'EMP-1005', 'Sreelakshmi Krishnan', 'device-001', 'Kochi Main Entrance', TODAY, '13:02', 'OUT'),
  buildPunch('p-017', 'emp-005', 'EMP-1005', 'Sreelakshmi Krishnan', 'device-001', 'Kochi Main Entrance', TODAY, '13:58', 'IN'),
  buildPunch('p-018', 'emp-005', 'EMP-1005', 'Sreelakshmi Krishnan', 'device-001', 'Kochi Main Entrance', TODAY, '18:02', 'OUT'),
  // emp-006 Mohammed - Incomplete (only IN)
  buildPunch('p-019', 'emp-006', 'EMP-1006', 'Mohammed Shafi', 'device-001', 'Kochi Main Entrance', TODAY, '09:10', 'IN'),
  // emp-007 Nitha - Late
  buildPunch('p-020', 'emp-007', 'EMP-1007', 'Nitha George', 'device-001', 'Kochi Main Entrance', TODAY, '10:15', 'IN'),
  buildPunch('p-021', 'emp-007', 'EMP-1007', 'Nitha George', 'device-001', 'Kochi Main Entrance', TODAY, '18:20', 'OUT'),
  // emp-008 Deepak - Present
  buildPunch('p-022', 'emp-008', 'EMP-1008', 'Deepak Varma', 'device-001', 'Kochi Main Entrance', TODAY, '08:45', 'IN'),
  buildPunch('p-023', 'emp-008', 'EMP-1008', 'Deepak Varma', 'device-001', 'Kochi Main Entrance', TODAY, '13:00', 'OUT'),
  buildPunch('p-024', 'emp-008', 'EMP-1008', 'Deepak Varma', 'device-001', 'Kochi Main Entrance', TODAY, '13:50', 'IN'),
  buildPunch('p-025', 'emp-008', 'EMP-1008', 'Deepak Varma', 'device-001', 'Kochi Main Entrance', TODAY, '18:05', 'OUT'),
  // emp-009 Anupama - Present
  buildPunch('p-026', 'emp-009', 'EMP-1009', 'Anupama Pillai', 'device-001', 'Kochi Main Entrance', TODAY, '09:00', 'IN'),
  buildPunch('p-027', 'emp-009', 'EMP-1009', 'Anupama Pillai', 'device-001', 'Kochi Main Entrance', TODAY, '18:00', 'OUT'),
  // emp-010 Suresh - INACTIVE, no punch
  // emp-011 Reshma - Present
  buildPunch('p-028', 'emp-011', 'EMP-1011', 'Reshma Sasi', 'device-001', 'Kochi Main Entrance', TODAY, '09:02', 'IN'),
  buildPunch('p-029', 'emp-011', 'EMP-1011', 'Reshma Sasi', 'device-001', 'Kochi Main Entrance', TODAY, '18:08', 'OUT'),
  // emp-012 Bipin - Morning shift - IN at 05:58
  buildPunch('p-030', 'emp-012', 'EMP-1012', 'Bipin Narayanan', 'device-002', 'Kochi Server Room', TODAY, '05:58', 'IN'),
  buildPunch('p-031', 'emp-012', 'EMP-1012', 'Bipin Narayanan', 'device-002', 'Kochi Server Room', TODAY, '14:05', 'OUT'),
  // emp-013 Kavitha - Late
  buildPunch('p-032', 'emp-013', 'EMP-1013', 'Kavitha Babu', 'device-001', 'Kochi Main Entrance', TODAY, '09:35', 'IN'),
  buildPunch('p-033', 'emp-013', 'EMP-1013', 'Kavitha Babu', 'device-001', 'Kochi Main Entrance', TODAY, '18:00', 'OUT'),
  // emp-014 Nikhil - Present
  buildPunch('p-034', 'emp-014', 'EMP-1014', 'Nikhil Jose', 'device-001', 'Kochi Main Entrance', TODAY, '09:00', 'IN'),
  buildPunch('p-035', 'emp-014', 'EMP-1014', 'Nikhil Jose', 'device-001', 'Kochi Main Entrance', TODAY, '18:02', 'OUT'),
  // emp-015 Lekha - Present
  buildPunch('p-036', 'emp-015', 'EMP-1015', 'Lekha Thankachan', 'device-001', 'Kochi Main Entrance', TODAY, '08:52', 'IN'),
  buildPunch('p-037', 'emp-015', 'EMP-1015', 'Lekha Thankachan', 'device-001', 'Kochi Main Entrance', TODAY, '18:00', 'OUT'),
];

// Build attendance records from above punches
export const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: 'att-001', employeeId: 'emp-001', employeeCode: 'EMP-1001', employeeName: 'Rahul Menon',
    department: 'Engineering', designation: 'Senior Software Engineer', date: TODAY,
    shiftId: 'shift-001', shiftName: 'General Shift', shiftStartTime: '09:00', shiftEndTime: '18:00',
    firstPunchIn: `${TODAY}T08:55:00`, lastPunchOut: `${TODAY}T18:05:00`,
    punchRecords: mockPunchRecords.filter(p => p.employeeId === 'emp-001' && p.date === TODAY),
    workingMinutes: 487, breakMinutes: 54, lateMinutes: 0, earlyOutMinutes: 0, overtimeMinutes: 5,
    status: 'PRESENT', companyId: 'company-001', subCompanyId: 'sub-001',
  },
  {
    id: 'att-002', employeeId: 'emp-002', employeeCode: 'EMP-1002', employeeName: 'Aishwarya Nair',
    department: 'Engineering', designation: 'Software Engineer', date: TODAY,
    shiftId: 'shift-001', shiftName: 'General Shift', shiftStartTime: '09:00', shiftEndTime: '18:00',
    firstPunchIn: `${TODAY}T09:42:00`, lastPunchOut: `${TODAY}T18:10:00`,
    punchRecords: mockPunchRecords.filter(p => p.employeeId === 'emp-002' && p.date === TODAY),
    workingMinutes: 481, breakMinutes: 57, lateMinutes: 27, earlyOutMinutes: 0, overtimeMinutes: 10,
    status: 'LATE', companyId: 'company-001', subCompanyId: 'sub-001',
  },
  {
    id: 'att-003', employeeId: 'emp-003', employeeCode: 'EMP-1003', employeeName: 'Vishnu Raj',
    department: 'Engineering', designation: 'Tech Lead', date: TODAY,
    shiftId: 'shift-001', shiftName: 'General Shift', shiftStartTime: '09:00', shiftEndTime: '18:00',
    firstPunchIn: `${TODAY}T08:50:00`, lastPunchOut: `${TODAY}T18:00:00`,
    punchRecords: mockPunchRecords.filter(p => p.employeeId === 'emp-003' && p.date === TODAY),
    workingMinutes: 490, breakMinutes: 60, lateMinutes: 0, earlyOutMinutes: 0, overtimeMinutes: 0,
    status: 'PRESENT', companyId: 'company-001', subCompanyId: 'sub-001',
  },
  {
    id: 'att-004', employeeId: 'emp-004', employeeCode: 'EMP-1004', employeeName: 'Ajay Thomas',
    department: 'Product', designation: 'Product Manager', date: TODAY,
    shiftId: 'shift-001', shiftName: 'General Shift', shiftStartTime: '09:00', shiftEndTime: '18:00',
    firstPunchIn: `${TODAY}T09:05:00`, lastPunchOut: `${TODAY}T16:30:00`,
    punchRecords: mockPunchRecords.filter(p => p.employeeId === 'emp-004' && p.date === TODAY),
    workingMinutes: 445, breakMinutes: 0, lateMinutes: 0, earlyOutMinutes: 75, overtimeMinutes: 0,
    status: 'EARLY_OUT', companyId: 'company-001', subCompanyId: 'sub-001',
  },
  {
    id: 'att-005', employeeId: 'emp-005', employeeCode: 'EMP-1005', employeeName: 'Sreelakshmi Krishnan',
    department: 'HR', designation: 'HR Executive', date: TODAY,
    shiftId: 'shift-001', shiftName: 'General Shift', shiftStartTime: '09:00', shiftEndTime: '18:00',
    firstPunchIn: `${TODAY}T08:58:00`, lastPunchOut: `${TODAY}T18:02:00`,
    punchRecords: mockPunchRecords.filter(p => p.employeeId === 'emp-005' && p.date === TODAY),
    workingMinutes: 484, breakMinutes: 56, lateMinutes: 0, earlyOutMinutes: 0, overtimeMinutes: 2,
    status: 'PRESENT', companyId: 'company-001', subCompanyId: 'sub-001',
  },
  {
    id: 'att-006', employeeId: 'emp-006', employeeCode: 'EMP-1006', employeeName: 'Mohammed Shafi',
    department: 'Finance', designation: 'Finance Manager', date: TODAY,
    shiftId: 'shift-001', shiftName: 'General Shift', shiftStartTime: '09:00', shiftEndTime: '18:00',
    firstPunchIn: `${TODAY}T09:10:00`, lastPunchOut: undefined,
    punchRecords: mockPunchRecords.filter(p => p.employeeId === 'emp-006' && p.date === TODAY),
    workingMinutes: 0, breakMinutes: 0, lateMinutes: 0, earlyOutMinutes: 0, overtimeMinutes: 0,
    status: 'INCOMPLETE', companyId: 'company-001', subCompanyId: 'sub-001',
  },
  {
    id: 'att-007', employeeId: 'emp-007', employeeCode: 'EMP-1007', employeeName: 'Nitha George',
    department: 'Engineering', designation: 'UI/UX Designer', date: TODAY,
    shiftId: 'shift-001', shiftName: 'General Shift', shiftStartTime: '09:00', shiftEndTime: '18:00',
    firstPunchIn: `${TODAY}T10:15:00`, lastPunchOut: `${TODAY}T18:20:00`,
    punchRecords: mockPunchRecords.filter(p => p.employeeId === 'emp-007' && p.date === TODAY),
    workingMinutes: 485, breakMinutes: 0, lateMinutes: 60, earlyOutMinutes: 0, overtimeMinutes: 20,
    status: 'LATE', companyId: 'company-001', subCompanyId: 'sub-001',
  },
  {
    id: 'att-008', employeeId: 'emp-008', employeeCode: 'EMP-1008', employeeName: 'Deepak Varma',
    department: 'Operations', designation: 'Operations Head', date: TODAY,
    shiftId: 'shift-001', shiftName: 'General Shift', shiftStartTime: '09:00', shiftEndTime: '18:00',
    firstPunchIn: `${TODAY}T08:45:00`, lastPunchOut: `${TODAY}T18:05:00`,
    punchRecords: mockPunchRecords.filter(p => p.employeeId === 'emp-008' && p.date === TODAY),
    workingMinutes: 490, breakMinutes: 50, lateMinutes: 0, earlyOutMinutes: 0, overtimeMinutes: 5,
    status: 'PRESENT', companyId: 'company-001', subCompanyId: 'sub-001',
  },
  {
    id: 'att-009', employeeId: 'emp-009', employeeCode: 'EMP-1009', employeeName: 'Anupama Pillai',
    department: 'Engineering', designation: 'QA Engineer', date: TODAY,
    shiftId: 'shift-001', shiftName: 'General Shift', shiftStartTime: '09:00', shiftEndTime: '18:00',
    firstPunchIn: `${TODAY}T09:00:00`, lastPunchOut: `${TODAY}T18:00:00`,
    punchRecords: mockPunchRecords.filter(p => p.employeeId === 'emp-009' && p.date === TODAY),
    workingMinutes: 480, breakMinutes: 0, lateMinutes: 0, earlyOutMinutes: 0, overtimeMinutes: 0,
    status: 'PRESENT', companyId: 'company-001', subCompanyId: 'sub-001',
  },
  // emp-010 Absent
  {
    id: 'att-010', employeeId: 'emp-010', employeeCode: 'EMP-1010', employeeName: 'Suresh Kumar',
    department: 'Engineering', designation: 'DevOps Engineer', date: TODAY,
    shiftId: 'shift-001', shiftName: 'General Shift', shiftStartTime: '09:00', shiftEndTime: '18:00',
    punchRecords: [],
    workingMinutes: 0, breakMinutes: 0, lateMinutes: 0, earlyOutMinutes: 0, overtimeMinutes: 0,
    status: 'ABSENT', companyId: 'company-001', subCompanyId: 'sub-001',
  },
  {
    id: 'att-011', employeeId: 'emp-011', employeeCode: 'EMP-1011', employeeName: 'Reshma Sasi',
    department: 'Marketing', designation: 'Marketing Executive', date: TODAY,
    shiftId: 'shift-001', shiftName: 'General Shift', shiftStartTime: '09:00', shiftEndTime: '18:00',
    firstPunchIn: `${TODAY}T09:02:00`, lastPunchOut: `${TODAY}T18:08:00`,
    punchRecords: mockPunchRecords.filter(p => p.employeeId === 'emp-011' && p.date === TODAY),
    workingMinutes: 486, breakMinutes: 0, lateMinutes: 0, earlyOutMinutes: 0, overtimeMinutes: 8,
    status: 'PRESENT', companyId: 'company-001', subCompanyId: 'sub-001',
  },
  {
    id: 'att-012', employeeId: 'emp-012', employeeCode: 'EMP-1012', employeeName: 'Bipin Narayanan',
    department: 'Engineering', designation: 'Backend Developer', date: TODAY,
    shiftId: 'shift-002', shiftName: 'Morning Shift', shiftStartTime: '06:00', shiftEndTime: '14:00',
    firstPunchIn: `${TODAY}T05:58:00`, lastPunchOut: `${TODAY}T14:05:00`,
    punchRecords: mockPunchRecords.filter(p => p.employeeId === 'emp-012' && p.date === TODAY),
    workingMinutes: 487, breakMinutes: 0, lateMinutes: 0, earlyOutMinutes: 0, overtimeMinutes: 5,
    status: 'PRESENT', companyId: 'company-001', subCompanyId: 'sub-001',
  },
  {
    id: 'att-013', employeeId: 'emp-013', employeeCode: 'EMP-1013', employeeName: 'Kavitha Babu',
    department: 'Sales', designation: 'Sales Executive', date: TODAY,
    shiftId: 'shift-001', shiftName: 'General Shift', shiftStartTime: '09:00', shiftEndTime: '18:00',
    firstPunchIn: `${TODAY}T09:35:00`, lastPunchOut: `${TODAY}T18:00:00`,
    punchRecords: mockPunchRecords.filter(p => p.employeeId === 'emp-013' && p.date === TODAY),
    workingMinutes: 505, breakMinutes: 0, lateMinutes: 20, earlyOutMinutes: 0, overtimeMinutes: 0,
    status: 'LATE', companyId: 'company-001', subCompanyId: 'sub-001',
  },
  {
    id: 'att-014', employeeId: 'emp-014', employeeCode: 'EMP-1014', employeeName: 'Nikhil Jose',
    department: 'Engineering', designation: 'Junior Developer', date: TODAY,
    shiftId: 'shift-001', shiftName: 'General Shift', shiftStartTime: '09:00', shiftEndTime: '18:00',
    firstPunchIn: `${TODAY}T09:00:00`, lastPunchOut: `${TODAY}T18:02:00`,
    punchRecords: mockPunchRecords.filter(p => p.employeeId === 'emp-014' && p.date === TODAY),
    workingMinutes: 482, breakMinutes: 0, lateMinutes: 0, earlyOutMinutes: 0, overtimeMinutes: 2,
    status: 'PRESENT', companyId: 'company-001', subCompanyId: 'sub-001',
  },
  {
    id: 'att-015', employeeId: 'emp-015', employeeCode: 'EMP-1015', employeeName: 'Lekha Thankachan',
    department: 'Administration', designation: 'Office Manager', date: TODAY,
    shiftId: 'shift-001', shiftName: 'General Shift', shiftStartTime: '09:00', shiftEndTime: '18:00',
    firstPunchIn: `${TODAY}T08:52:00`, lastPunchOut: `${TODAY}T18:00:00`,
    punchRecords: mockPunchRecords.filter(p => p.employeeId === 'emp-015' && p.date === TODAY),
    workingMinutes: 488, breakMinutes: 0, lateMinutes: 0, earlyOutMinutes: 0, overtimeMinutes: 0,
    status: 'PRESENT', companyId: 'company-001', subCompanyId: 'sub-001',
  },
];
