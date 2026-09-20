// Data models (response shapes). Types use a small notation:
//   string | int | bool | number | object | date (YYYY-MM-DD) | datetime (ISO-8601 UTC) | time (HH:mm) | email
//   enum:A|B|C     → one of the listed values        string?  → nullable
//   Model / Model[] → reference to another model in this list

import { defineModel } from './dsl.mjs';
import * as F from './fixtures.mjs';

const STATUS = 'enum:ACTIVE|INACTIVE';
const DAYS = 'enum:MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY';

defineModel('Company', 'A tenant on the platform. Companies own sub-companies; **employees belong to sub-companies, never directly to a company.** Counts are derived by the server, never stored.', [
  ['id', 'string', 'Opaque unique id.'],
  ['name', 'string', 'Legal name.'],
  ['code', 'string', 'Short unique code, 2–10 chars.'],
  ['registrationNumber', 'string', 'Company registration / CIN number.'],
  ['email', 'email', 'Primary contact email.'],
  ['phone', 'string', 'Primary contact phone.'],
  ['address', 'string', 'Street address.'],
  ['city', 'string', ''],
  ['state', 'string', ''],
  ['country', 'string', ''],
  ['logoUrl', 'string?', 'Public URL of the uploaded logo, or `null`.'],
  ['status', STATUS, 'Inactive companies cannot sign in.'],
  ['subCompanyCount', 'int', 'Derived: number of sub-companies.'],
  ['deviceCount', 'int', 'Derived: devices currently allocated to the company.'],
  ['employeeCount', 'int', 'Derived: employees across all sub-companies.'],
  ['createdAt', 'datetime', ''],
  ['updatedAt', 'datetime', ''],
], F.company);

defineModel('SubCompany', 'A branch / office of a company. Owns employees, shifts, holidays and device allocations. HR users are pinned to one sub-company.', [
  ['id', 'string', ''],
  ['companyId', 'string', 'Parent company id.'],
  ['companyName', 'string', 'Denormalised parent name.'],
  ['name', 'string', ''],
  ['code', 'string', 'Unique code, 2+ chars.'],
  ['email', 'email', ''],
  ['phone', 'string', ''],
  ['address', 'string', ''],
  ['city', 'string', ''],
  ['state', 'string', ''],
  ['country', 'string', ''],
  ['logoUrl', 'string?', ''],
  ['status', STATUS, ''],
  ['employeeCount', 'int', 'Derived.'],
  ['deviceCount', 'int', 'Derived: devices allocated to this sub-company.'],
  ['hrCount', 'int', 'Derived: active HR users pinned to this sub-company.'],
  ['timezone', 'string', 'IANA timezone. Attendance times are calculated and displayed in this zone.'],
  ['workingDays', `${DAYS}[]`, 'Working days of the week.'],
  ['createdAt', 'datetime', ''],
  ['updatedAt', 'datetime', ''],
], F.sub);

defineModel('Department', 'Company-level lookup used to classify employees. Shared by all sub-companies of a company.', [
  ['id', 'string', ''],
  ['name', 'string', 'Unique within the company (case-insensitive).'],
  ['description', 'string?', ''],
  ['status', STATUS, 'Only ACTIVE departments are offered when creating employees.'],
  ['companyId', 'string', ''],
  ['createdAt', 'datetime', ''],
  ['updatedAt', 'datetime', ''],
], F.department);

defineModel('AuthUser', 'The signed-in user, as returned at login and by `GET /auth/me`. Kept in the frontend auth store.', [
  ['id', 'string', ''],
  ['email', 'email', ''],
  ['firstName', 'string', ''],
  ['lastName', 'string', ''],
  ['role', 'enum:SUPER_ADMIN|ADMIN|HR', 'Drives routing and permissions.'],
  ['companyId', 'string?', 'Absent for SUPER_ADMIN.'],
  ['companyName', 'string?', ''],
  ['subCompanyId', 'string?', 'Only for HR.'],
  ['subCompanyName', 'string?', 'Only for HR.'],
  ['avatarUrl', 'string?', ''],
  ['isActive', 'bool', ''],
], F.authUser);

defineModel('User', 'A platform user account (Super Admin, Admin or HR). Admins are scoped to a company, HR to a sub-company.', [
  ['id', 'string', ''],
  ['firstName', 'string', ''],
  ['lastName', 'string', ''],
  ['fullName', 'string', 'Derived.'],
  ['email', 'email', 'Unique, used to sign in.'],
  ['phone', 'string', ''],
  ['username', 'string', 'Unique, 3+ chars.'],
  ['role', 'enum:SUPER_ADMIN|ADMIN|HR', ''],
  ['companyId', 'string?', ''],
  ['companyName', 'string?', ''],
  ['subCompanyId', 'string?', 'HR only.'],
  ['subCompanyName', 'string?', ''],
  ['status', STATUS, ''],
  ['lastLogin', 'datetime?', ''],
  ['createdAt', 'datetime', ''],
  ['updatedAt', 'datetime', ''],
], F.user);

defineModel('Employee', 'A person whose attendance is tracked. Belongs to exactly one sub-company.', [
  ['id', 'string', ''],
  ['employeeCode', 'string', 'Unique within the company. Also the id enrolled on the biometric device.'],
  ['firstName', 'string', ''],
  ['lastName', 'string', ''],
  ['fullName', 'string', 'Derived.'],
  ['email', 'email', ''],
  ['phone', 'string', ''],
  ['dateOfBirth', 'date', ''],
  ['address', 'string', ''],
  ['avatarUrl', 'string?', ''],
  ['department', 'string', 'Department name (from the company department list).'],
  ['designation', 'string', ''],
  ['employeeType', 'enum:FULL_TIME|PART_TIME|CONTRACT|INTERN', ''],
  ['joiningDate', 'date', 'No attendance is generated before this date.'],
  ['status', STATUS, 'Inactive employees are excluded from attendance and pickers.'],
  ['companyId', 'string', ''],
  ['companyName', 'string', ''],
  ['subCompanyId', 'string', ''],
  ['subCompanyName', 'string', ''],
  ['shiftId', 'string?', 'Assigned shift; when null the sub-company default shift applies.'],
  ['shiftName', 'string?', ''],
  ['weeklyOff', `${DAYS}[]`, 'Weekly off days for this employee.'],
  ['deviceId', 'string?', 'Optional device-side user id, if it differs from `employeeCode`.'],
  ['createdAt', 'datetime', ''],
  ['updatedAt', 'datetime', ''],
], F.employee);

defineModel('Shift', 'A work schedule owned by a sub-company.', [
  ['id', 'string', ''],
  ['name', 'string', ''],
  ['startTime', 'time', '24h `HH:mm`.'],
  ['endTime', 'time', 'Earlier than `startTime` means the shift ends the next day.'],
  ['breakStartTime', 'time?', ''],
  ['breakEndTime', 'time?', ''],
  ['gracePeriodMinutes', 'int', 'Minutes after start before an arrival counts as late (0–60).'],
  ['isOvernight', 'bool', 'Derived: `endTime < startTime`.'],
  ['totalWorkMinutes', 'int', 'Derived: paid minutes (end − start − break).'],
  ['status', STATUS, ''],
  ['companyId', 'string', ''],
  ['subCompanyId', 'string', ''],
  ['createdAt', 'datetime', ''],
  ['updatedAt', 'datetime', ''],
], F.shift);

defineModel('Holiday', 'A public holiday for one sub-company. Attendance on holidays is `HOLIDAY`.', [
  ['id', 'string', ''],
  ['name', 'string', ''],
  ['date', 'date', 'Unique per sub-company.'],
  ['description', 'string?', ''],
  ['status', STATUS, 'INACTIVE holidays are ignored by attendance.'],
  ['companyId', 'string', ''],
  ['subCompanyId', 'string', ''],
  ['year', 'int', 'Derived from `date`.'],
  ['createdAt', 'datetime', ''],
  ['updatedAt', 'datetime', ''],
], F.holiday);

defineModel('Device', 'A biometric punch device. Allocated to one sub-company at a time (or unallocated).', [
  ['id', 'string', ''],
  ['deviceId', 'string', 'Human-readable device code, unique.'],
  ['name', 'string', ''],
  ['modelNumber', 'string', ''],
  ['serialNumber', 'string', 'Unique. Used by the device gateway to identify itself.'],
  ['macAddress', 'string', '`AA:BB:CC:DD:EE:FF`.'],
  ['firmwareVersion', 'string', ''],
  ['ipAddress', 'string', ''],
  ['status', 'enum:ONLINE|OFFLINE|UNALLOCATED|MAINTENANCE', 'ONLINE/OFFLINE are derived from the last heartbeat; UNALLOCATED when no active allocation; MAINTENANCE is set manually.'],
  ['companyId', 'string?', 'Current allocation.'],
  ['companyName', 'string?', ''],
  ['subCompanyId', 'string?', ''],
  ['subCompanyName', 'string?', ''],
  ['lastSeen', 'datetime?', 'Last heartbeat.'],
  ['lastPunch', 'datetime?', 'Last punch received.'],
  ['allocatedAt', 'datetime?', ''],
  ['createdAt', 'datetime', ''],
  ['updatedAt', 'datetime', ''],
], F.device);

defineModel('DeviceAllocation', 'One entry in a device\'s allocation history. Re-allocating or deallocating closes the active entry and keeps it.', [
  ['id', 'string', ''],
  ['deviceId', 'string', ''],
  ['deviceName', 'string', ''],
  ['companyId', 'string', ''],
  ['companyName', 'string', ''],
  ['subCompanyId', 'string', ''],
  ['subCompanyName', 'string', ''],
  ['allocatedBy', 'string', 'Display name of the user who allocated.'],
  ['allocatedAt', 'datetime', ''],
  ['deallocatedAt', 'datetime?', ''],
  ['deallocatedBy', 'string?', ''],
  ['deallocationReason', 'string?', ''],
  ['isActive', 'bool', 'Exactly one active allocation per allocated device.'],
  ['notes', 'string?', ''],
], F.allocation);

defineModel('PunchRecord', 'A single IN/OUT punch. `punchTime` is the **wall-clock time in the sub-company\'s timezone**, ISO-8601 without an offset.', [
  ['id', 'string', ''],
  ['employeeId', 'string', ''],
  ['employeeCode', 'string', ''],
  ['employeeName', 'string', ''],
  ['deviceId', 'string', 'Device id, or `MANUAL` for hand-entered punches.'],
  ['deviceName', 'string', '`Manual Entry` for manual punches.'],
  ['punchTime', 'string', 'e.g. `2026-09-19T08:55:00` (local to the sub-company).'],
  ['punchType', 'enum:IN|OUT', ''],
  ['companyId', 'string', ''],
  ['subCompanyId', 'string', ''],
  ['date', 'date', 'The attendance date this punch belongs to (an overnight shift\'s OUT keeps the start date).'],
], F.punch(1, 'IN', '08:55'));

defineModel('AttendanceRecord', 'One employee-day, **calculated** from raw punches + shift + attendance settings. Never written directly; recalculated whenever inputs change.', [
  ['id', 'string', ''],
  ['employeeId', 'string', ''],
  ['employeeCode', 'string', ''],
  ['employeeName', 'string', ''],
  ['department', 'string', ''],
  ['designation', 'string', ''],
  ['date', 'date', ''],
  ['shiftId', 'string', ''],
  ['shiftName', 'string', ''],
  ['shiftStartTime', 'time', ''],
  ['shiftEndTime', 'time', ''],
  ['firstPunchIn', 'string?', 'Local wall-clock ISO string.'],
  ['lastPunchOut', 'string?', ''],
  ['punchRecords', 'PunchRecord[]', 'Device punches plus any manual punches, oldest first.'],
  ['workingMinutes', 'int', 'Sum of IN→OUT pairs.'],
  ['breakMinutes', 'int', 'Gaps between an OUT and the next IN.'],
  ['lateMinutes', 'int', 'Minutes after `start + grace`. 0 if on time.'],
  ['earlyOutMinutes', 'int', 'Minutes before `end − early-out threshold`.'],
  ['overtimeMinutes', 'int', 'Minutes past shift end when ≥ overtime threshold and overtime is enabled, else 0.'],
  ['status', 'enum:PRESENT|ABSENT|LATE|EARLY_OUT|INCOMPLETE|HOLIDAY|WEEKLY_OFF|ON_LEAVE', 'See the status rules in the Attendance module.'],
  ['companyId', 'string', ''],
  ['subCompanyId', 'string', ''],
  ['subCompanyName', 'string', ''],
  ['isManual', 'bool', 'True when a manual entry contributes punches to this day.'],
  ['manualReason', 'string?', ''],
  ['manualSource', 'enum:MANUAL|REGULARIZATION|MISSING_PUNCH?', ''],
  ['manualBy', 'string?', ''],
  ['manualAt', 'datetime?', ''],
  ['leaveType', 'string?', 'Set when the day is covered by approved leave.'],
  ['leaveRequestId', 'string?', ''],
], F.attendance);

defineModel('DailyAttendanceStats', 'Aggregate counts for a set of daily attendance records.', [
  ['total', 'int', ''], ['present', 'int', ''], ['absent', 'int', ''], ['late', 'int', ''],
  ['earlyOut', 'int', ''], ['missingPunch', 'int', 'Records with status INCOMPLETE.'],
  ['onLeave', 'int', ''], ['holiday', 'int', ''], ['weeklyOff', 'int', ''],
  ['overtimeMinutes', 'int', 'Total overtime minutes across the records.'],
], F.dailyStats);

defineModel('AttendanceRequest', 'A regularization, missing-punch or leave request. **The Requests/Leaves UI is currently commented out in the frontend; the API is specified for when it is re-enabled.**', [
  ['id', 'string', ''],
  ['type', 'enum:REGULARIZATION|MISSING_PUNCH|LEAVE', ''],
  ['status', 'enum:PENDING|APPROVED|REJECTED|CANCELLED', ''],
  ['employeeId', 'string', ''],
  ['employeeCode', 'string', ''],
  ['employeeName', 'string', ''],
  ['department', 'string', ''],
  ['companyId', 'string', ''],
  ['subCompanyId', 'string', ''],
  ['subCompanyName', 'string', ''],
  ['date', 'date', 'Attendance date, or first day of leave.'],
  ['endDate', 'date?', 'Last day of leave.'],
  ['punches', 'object[]?', '`[{ punchIn, punchOut }]` as `HH:mm` (empty string when only one side is supplied).'],
  ['leaveType', 'enum:CASUAL|SICK|EARNED|UNPAID?', ''],
  ['leaveDays', 'int?', 'Working days covered (weekly offs and holidays excluded).'],
  ['reason', 'string', ''],
  ['requestedBy', 'string', ''],
  ['requestedByRole', 'enum:HR|ADMIN', ''],
  ['requestedAt', 'datetime', ''],
  ['reviewedBy', 'string?', ''],
  ['reviewComment', 'string?', ''],
  ['reviewedAt', 'datetime?', ''],
], F.request);

defineModel('LeaveBalance', 'Leave entitlement and usage for one employee and year.', [
  ['employeeId', 'string', ''], ['employeeCode', 'string', ''], ['employeeName', 'string', ''],
  ['department', 'string', ''], ['subCompanyId', 'string', ''], ['subCompanyName', 'string', ''],
  ['year', 'int', ''],
  ['balances', 'object', '`{ CASUAL, SICK, EARNED: { total, used, pending }, UNPAID: { used, pending } }`. Remaining = `total − used − pending`.'],
], F.leaveBalance);

defineModel('AttendanceSettings', 'Company-wide attendance policy. Changing it recalculates attendance.', [
  ['companyId', 'string', ''],
  ['lateGracePeriodMinutes', 'int', 'Default grace for **new** shifts; each shift keeps its own value for late calculation.'],
  ['earlyOutThresholdMinutes', 'int', 'Buffer before shift end before an early leave counts.'],
  ['minimumWorkingHours', 'time', '`HH:mm`. Stored; not yet applied to status calculation.'],
  ['overtimeThresholdMinutes', 'int', 'Minutes past shift end before overtime starts counting.'],
  ['overtimeEnabled', 'bool', ''],
  ['autoAbsent', 'bool', 'Reserved: auto-mark absent after midnight. Stored; not yet applied.'],
  ['updatedAt', 'datetime', ''],
  ['updatedBy', 'string', ''],
], F.attendanceSettings);

defineModel('ActivityLog', 'Immutable audit-trail entry. Written by the server for every state-changing request.', [
  ['id', 'string', ''],
  ['date', 'datetime', ''],
  ['userId', 'string', ''],
  ['userName', 'string', ''],
  ['userRole', 'string', ''],
  ['action', 'enum:CREATED|UPDATED|DELETED|ACTIVATED|DEACTIVATED|ALLOCATED|DEALLOCATED|APPROVED|REJECTED|CANCELLED', ''],
  ['module', 'string', 'Companies, Sub Companies, Devices, Users, Employees, Shifts, Holidays, Attendance, Requests, Configuration.'],
  ['target', 'string', 'Human-readable subject.'],
  ['targetId', 'string?', ''],
  ['details', 'string', ''],
  ['ipAddress', 'string', 'Client IP taken from the request.'],
  ['companyId', 'string?', 'Company the action belongs to.'],
], F.activityLog);

defineModel('ReportJob', 'A generated export. Small reports complete synchronously; large ones return `PROCESSING` and are polled.', [
  ['id', 'string', ''],
  ['type', 'enum:DAILY|MONTHLY|EMPLOYEE|MULTI_EMPLOYEE', ''],
  ['format', 'enum:EXCEL|PDF|CSV', ''],
  ['status', 'enum:PROCESSING|COMPLETED|FAILED', ''],
  ['fileName', 'string?', ''],
  ['fileSize', 'int?', 'Bytes.'],
  ['rowCount', 'int?', ''],
  ['downloadUrl', 'string?', 'Relative URL, valid until `expiresAt`.'],
  ['expiresAt', 'datetime?', 'Files are kept 7 days.'],
  ['filters', 'object', 'The filters the report was generated with.'],
  ['requestedBy', 'string', ''],
  ['requestedAt', 'datetime', ''],
  ['completedAt', 'datetime?', ''],
  ['error', 'string?', 'Failure reason when `status = FAILED`.'],
], F.reportJob);
