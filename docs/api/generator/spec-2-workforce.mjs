import { defineModule, ep, crud, ok, list, err, validation, notFound, forbidden, conflict, PAGING, SEARCH, SORT, SA, SA_ADMIN, ADMIN_HR, ALL_ROLES } from './dsl.mjs';
import * as F from './fixtures.mjs';

// ════════════════════════════════════════════════════════════════════════════
// 06 · EMPLOYEES
// ════════════════════════════════════════════════════════════════════════════
const emps = defineModule('employees', 'Employees', 'People whose attendance is tracked. **An employee belongs to a sub-company, not to the company.** HR is pinned to one sub-company; Admin works across all sub-companies of their company; Super Admin has read-only access.');

const employeeFields = [
  ['employeeCode', 'string', true, 'Unique within the company. Must match the id enrolled on the device.'],
  ['firstName', 'string', true, ''], ['lastName', 'string', true, ''],
  ['email', 'email', true, ''], ['phone', 'string', true, 'Min 7 chars.'],
  ['dateOfBirth', 'date', true, '`YYYY-MM-DD`, must be in the past.'],
  ['address', 'string', true, 'Min 5 chars.'],
  ['department', 'string', true, 'Name of an ACTIVE department of the company.'],
  ['designation', 'string', true, ''],
  ['employeeType', 'enum:FULL_TIME|PART_TIME|CONTRACT|INTERN', true, ''],
  ['joiningDate', 'date', true, '`YYYY-MM-DD`.'],
  ['status', 'enum:ACTIVE|INACTIVE', true, ''],
  ['subCompanyId', 'string', true, 'HR: forced to their own sub-company. Admin: any sub-company of their company.'],
  ['shiftId', 'string', false, 'Must belong to the same sub-company. Omit / `null` = sub-company default.'],
  ['weeklyOff', 'string[]', false, 'Weekdays off. Default `["SATURDAY","SUNDAY"]`.'],
];
const employeeBody = { employeeCode: 'EMP-1016', firstName: 'Nikhil', lastName: 'Jose', email: 'nikhil.jose@nexustech.in', phone: '+91-9845001016', dateOfBirth: '1994-02-11', address: '7, Edappally, Kochi', department: 'Engineering', designation: 'Software Engineer', employeeType: 'FULL_TIME', joiningDate: '2026-09-01', status: 'ACTIVE', subCompanyId: 'sub-001', shiftId: 'shift-001', weeklyOff: ['SATURDAY', 'SUNDAY'] };

crud(emps, {
  tag: 'Employee', plural: 'employees', base: '/employees', idParam: 'employeeId',
  model: F.employee, model2: F.employee2, listRoles: ALL_ROLES, writeRoles: ADMIN_HR,
  usedBy: { list: 'EmployeesPage, pickers (Manual attendance, Reports), Sub-company detail', get: 'EmployeeDetailPage', create: 'EmployeeFormDialog', update: 'EmployeeFormDialog (edit)', status: 'EmployeesPage toggle' },
  filters: [
    ['companyId', 'string', false, 'Super Admin filter. Admin/HR: forced to own company.'],
    ['subCompanyId', 'string', false, 'HR: forced to own sub-company. Admin: optional narrowing (topbar selector).'],
    ['department', 'string', false, 'Exact department name.'],
    ['shiftId', 'string', false, ''],
    ['status', 'enum:ACTIVE|INACTIVE', false, 'Pickers use `ACTIVE`.'],
  ],
  sortFields: ['fullName', 'employeeCode', 'joiningDate', 'createdAt'],
  scopeNote: '**Scope:** HR → own sub-company only; Admin → every sub-company of own company; Super Admin → read-only, any. Out-of-scope ids return 404. `pageSize` may go up to **200** (pickers load a whole branch).',
  fields: employeeFields, createExample: employeeBody,
  updateFields: employeeFields.filter((f) => f[0] !== 'subCompanyId'),
  updateMethod: 'PUT',
  validationErrors: [['email', 'Enter a valid email address'], ['department', 'Department "Sales" does not exist or is inactive']],
  duplicate: { field: 'employeeCode', message: 'Employee code "EMP-1016" is already in use', scenario: 'Employee code already used' },
  status: { notes: ['An INACTIVE employee stops generating attendance from the next day; history is kept.'] },
  forbiddenMessage: 'You can only add employees to your own sub company',
  extraCreateResponses: [[422, 'Shift belongs to a different sub-company', validation(['shiftId', 'Shift does not belong to the selected sub company'])]],
  extraUpdateResponses: [[403, 'Employee is outside the caller\'s scope', forbidden('You cannot modify employees of another sub company')]],
});

ep(emps, {
  method: 'PATCH', path: '/employees/{employeeId}/shift', title: 'Assign shift',
  purpose: 'Assign (or clear) an employee\'s shift. Recalculates the employee\'s attendance from the effective date.',
  roles: ADMIN_HR, usedBy: 'employeeService.assignShift (no dedicated UI yet; EmployeeFormDialog sets it today)', pathParams: [['employeeId', 'string', 'Employee id.']],
  body: { fields: [['shiftId', 'string', true, 'Shift id, or `null` to fall back to the sub-company default.'], ['effectiveFrom', 'date', false, 'Recalculate attendance from this date. Default: today.']], example: { shiftId: 'shift-002', effectiveFrom: '2026-09-21' } },
  notes: ['Past attendance before `effectiveFrom` is **not** changed.'],
  responses: [
    [200, 'Shift assigned', ok({ ...F.employee, shiftId: 'shift-002', shiftName: 'Morning Shift' }, 'Shift assigned')],
    [404, 'Employee or shift not found', notFound('Shift')],
    [422, 'Shift is inactive or belongs to another sub-company', validation(['shiftId', 'Shift does not belong to this employee\'s sub company'])],
  ],
});

// ════════════════════════════════════════════════════════════════════════════
// 07 · SHIFTS
// ════════════════════════════════════════════════════════════════════════════
const shifts = defineModule('shifts', 'Shifts', 'Work schedules owned by a sub-company. Attendance late / early-out / overtime are calculated against the employee\'s shift.');

const shiftFields = [
  ['name', 'string', true, '2–60 chars. Unique within the sub-company.'],
  ['startTime', 'time', true, '`HH:mm`.'],
  ['endTime', 'time', true, '`HH:mm`. Earlier than start = overnight.'],
  ['breakStartTime', 'time', false, 'Both break times or neither.'],
  ['breakEndTime', 'time', false, ''],
  ['gracePeriodMinutes', 'int', true, '0–60. Default for new shifts comes from Attendance Settings.'],
  ['status', 'enum:ACTIVE|INACTIVE', true, ''],
  ['subCompanyId', 'string', true, 'HR: forced to own sub-company. Admin: choose one. Immutable after creation.'],
];
crud(shifts, {
  tag: 'Shift', plural: 'shifts', base: '/shifts', idParam: 'shiftId',
  model: F.shift, model2: F.nightShift, listRoles: ALL_ROLES, writeRoles: ADMIN_HR,
  usedBy: { list: 'ShiftsPage, EmployeeFormDialog, Sub-company detail', create: 'ShiftFormDialog', update: 'ShiftFormDialog (edit)', status: 'ShiftsPage toggle', del: 'ShiftsPage' },
  filters: [['subCompanyId', 'string', false, 'HR: forced to own sub-company. Admin/Super Admin: optional.'], ['companyId', 'string', false, 'Admin: forced to own company.'], ['status', 'enum:ACTIVE|INACTIVE', false, '']],
  sortFields: ['name', 'startTime'],
  scopeNote: 'Response includes derived `isOvernight` and `totalWorkMinutes`. Editing a shift recalculates attendance for its employees (current month).',
  fields: shiftFields, createExample: { name: 'Morning Shift', startTime: '06:00', endTime: '14:00', breakStartTime: '10:00', breakEndTime: '10:30', gracePeriodMinutes: 10, status: 'ACTIVE', subCompanyId: 'sub-001' },
  updateFields: shiftFields.filter((f) => f[0] !== 'subCompanyId'),
  validationErrors: [['gracePeriodMinutes', 'Must be between 0 and 60'], ['breakEndTime', 'Break end must be after break start']],
  duplicate: { field: 'name', message: 'A shift named "Morning Shift" already exists in this sub company', scenario: 'Name already used in the sub-company' },
  status: { notes: ['Deactivating a shift already assigned to employees is allowed; it is just not offered for new assignments.'] },
  del: { blockedMessage: 'Shift "General Shift" is assigned to 15 employees. Reassign them first.', blockedScenario: 'Employees still assigned', blockedCode: 'SHIFT_IN_USE', notes: ['Blocked while any employee is assigned to the shift.'] },
});

// ════════════════════════════════════════════════════════════════════════════
// 08 · HOLIDAYS
// ════════════════════════════════════════════════════════════════════════════
const hols = defineModule('holidays', 'Holidays', 'Public holidays per sub-company. A holiday date turns everyone\'s attendance for that day into `HOLIDAY`.');

crud(hols, {
  tag: 'Holiday', plural: 'holidays', base: '/holidays', idParam: 'holidayId',
  model: F.holiday, model2: { ...F.holiday, id: 'hol-003', name: 'Holi', date: '2026-03-21', description: 'Festival of Colors' },
  listRoles: ALL_ROLES, readRoles: null, writeRoles: ADMIN_HR,
  usedBy: { list: 'HolidaysPage, Sub-company detail', create: 'HolidayFormDialog', update: 'HolidayFormDialog (edit)', del: 'HolidaysPage' },
  filters: [['year', 'int', false, 'Calendar year. Default: current year.'], ['subCompanyId', 'string', false, 'HR: forced to own. Admin: optional.'], ['companyId', 'string', false, 'Admin: forced to own company.'], ['status', 'enum:ACTIVE|INACTIVE', false, '']],
  sortFields: ['date', 'name'], searchable: true,
  scopeNote: 'Sorted by `date` ascending by default. Changing a holiday recalculates attendance for that date.',
  fields: [['name', 'string', true, '2–100 chars.'], ['date', 'date', true, '`YYYY-MM-DD`. Unique per sub-company.'], ['description', 'string', false, ''], ['status', 'enum:ACTIVE|INACTIVE', true, ''], ['subCompanyId', 'string', true, 'HR: forced to own. Admin: choose. Immutable after creation.']],
  createExample: { name: 'Onam', date: '2026-08-26', description: 'Harvest festival', status: 'ACTIVE', subCompanyId: 'sub-001' },
  updateFields: [['name', 'string', true, ''], ['date', 'date', true, ''], ['description', 'string', false, ''], ['status', 'enum:ACTIVE|INACTIVE', true, '']],
  validationErrors: [['date', 'Enter a valid date (YYYY-MM-DD)'], ['name', 'Name must be at least 2 characters']],
  duplicate: { field: 'date', message: 'A holiday already exists on 2026-08-26 for this sub company', scenario: 'Date already has a holiday' },
  del: { blockedMessage: 'Holiday is in the past and its attendance is locked', blockedScenario: 'Past holiday in a locked payroll period (optional rule)', blockedCode: 'PERIOD_LOCKED', notes: ['The lock rule is optional; without a payroll lock the delete always succeeds.'] },
});

// ════════════════════════════════════════════════════════════════════════════
// 09 · ATTENDANCE
// ════════════════════════════════════════════════════════════════════════════
const att = defineModule('attendance', 'Attendance', 'Daily / monthly attendance, manual punch entries and recalculation. **Attendance records are calculated, never posted** — the inputs are device punches, manual entries, the shift, holidays, weekly offs, approved leave and the company attendance settings.', {
  extra: `### Status rules

| Status | When |
|---|---|
| \`WEEKLY_OFF\` | The weekday is in the employee's \`weeklyOff\` and there are no punches. |
| \`HOLIDAY\` | An ACTIVE holiday exists for the sub-company on that date and there are no punches. |
| \`ON_LEAVE\` | An approved leave request covers the day (overrides device punches, but not an explicit manual entry). |
| \`ABSENT\` | Working day, no punches. |
| \`INCOMPLETE\` | Punches exist but the last punch is an IN (or there is only an OUT). Also called "missing punch". |
| \`LATE\` | First IN is later than \`shiftStart + gracePeriod\` (takes priority over EARLY_OUT). |
| \`EARLY_OUT\` | Last OUT is earlier than \`shiftEnd − earlyOutThreshold\`. |
| \`PRESENT\` | Everything else. |

**Calculations:** \`workingMinutes\` = sum of IN→OUT pairs · \`breakMinutes\` = OUT→next IN gaps · \`lateMinutes\` = first IN − (start + grace) · \`earlyOutMinutes\` = (end − threshold) − last OUT · \`overtimeMinutes\` = last OUT − shift end, counted only when overtime is enabled and the value is ≥ the overtime threshold.
Overnight shifts (e.g. 18:00 → 03:00) belong to the **start date**; their OUT punch is on the next calendar day.`,
});

const dailyQuery = [
  ['date', 'date', true, '`YYYY-MM-DD`.'],
  ['subCompanyId', 'string', false, 'HR: forced to own sub-company. Admin: optional (topbar selector). Omit = all sub-companies of the company.'],
  ['companyId', 'string', false, 'Super Admin only. Admin/HR: forced to own company.'],
  ['departmentId', 'string', false, 'Department **name** (matches `AttendanceRecord.department`).'],
  ['status', 'enum:PRESENT|ABSENT|LATE|EARLY_OUT|INCOMPLETE|HOLIDAY|WEEKLY_OFF|ON_LEAVE', false, ''],
  ...SEARCH,
  ...PAGING,
];

ep(att, {
  method: 'GET', path: '/attendance/daily', title: 'Daily attendance',
  purpose: 'All employees\' attendance for one date, with aggregate stats for the stat cards. Ordered by employee code.',
  roles: ALL_ROLES, usedBy: 'AttendancePage, Sub-company detail ("Present today")', query: dailyQuery,
  notes: ['`stats` covers **all** records matching the filters (not just the current page).', 'Default `pageSize` for this endpoint is 10; the UI table uses 10.'],
  responses: [
    [200, 'Records + stats', { success: true, data: { records: [F.attendance, F.attendanceLate], stats: F.dailyStats }, pagination: { page: 1, pageSize: 10, total: 25, totalPages: 3 } }],
    [200, 'No records for the filters', { success: true, data: { records: [], stats: { total: 0, present: 0, absent: 0, late: 0, earlyOut: 0, missingPunch: 0, onLeave: 0, holiday: 0, weeklyOff: 0, overtimeMinutes: 0 } }, pagination: { page: 1, pageSize: 10, total: 0, totalPages: 1 } }],
    [422, 'Missing / invalid date', validation(['date', 'Date is required (YYYY-MM-DD)'])],
    [403, 'HR / Admin requested a sub-company outside their scope', forbidden('You cannot view attendance for this sub company')],
  ],
});

ep(att, {
  method: 'GET', path: '/attendance/monthly', title: 'Monthly attendance',
  purpose: 'Every employee-day in a month (or one employee\'s month) with a summary. For a single employee the response is filled so every calendar day up to today has a row.',
  roles: ALL_ROLES, usedBy: 'MonthlyAttendancePage',
  query: [
    ['month', 'int', true, '1–12.'], ['year', 'int', true, ''],
    ['employeeId', 'string', false, 'One employee. When supplied, missing days are filled (WEEKLY_OFF / HOLIDAY / ABSENT).'],
    ['subCompanyId', 'string', false, 'HR: forced to own. Admin: optional.'], ['companyId', 'string', false, 'Super Admin only.'],
    ['departmentId', 'string', false, 'Department name.'], ...PAGING,
  ],
  notes: ['`summary` counts PRESENT/LATE/EARLY_OUT as present days and totals working and overtime minutes across all matching records (not just the page).'],
  responses: [
    [200, 'Records + summary', { success: true, data: { records: [F.attendance, F.attendanceLate], summary: { present: 16, absent: 1, late: 3, earlyOut: 2, holiday: 0, weeklyOff: 8, leave: 0, totalMinutes: 8120, overtimeMinutes: 190 } }, pagination: { page: 1, pageSize: 15, total: 550, totalPages: 37 } }],
    [200, 'Nothing for that month', { success: true, data: { records: [], summary: { present: 0, absent: 0, late: 0, earlyOut: 0, holiday: 0, weeklyOff: 0, leave: 0, totalMinutes: 0, overtimeMinutes: 0 } }, pagination: { page: 1, pageSize: 15, total: 0, totalPages: 1 } }],
    [422, 'Bad month / year', validation(['month', 'Must be between 1 and 12'])],
    [404, '`employeeId` not found in scope', notFound('Employee')],
  ],
});

ep(att, {
  method: 'GET', path: '/attendance/employees/{employeeId}/monthly', title: 'One employee\'s month',
  purpose: 'An employee\'s attendance rows for a month (no fill, no summary). Used by the Employee detail → Attendance tab.',
  roles: ALL_ROLES, usedBy: 'EmployeeDetailPage → Attendance tab', pathParams: [['employeeId', 'string', 'Employee id.']],
  query: [['month', 'int', true, '1–12.'], ['year', 'int', true, '']],
  responses: [
    [200, 'Rows sorted by date', ok([F.attendance])],
    [404, 'Employee not found in scope', notFound('Employee')],
    [422, 'Bad month / year', validation(['year', 'Year is required'])],
  ],
});

ep(att, {
  method: 'GET', path: '/attendance/employees/{employeeId}/dates/{date}', title: 'One employee-day',
  purpose: 'A single day with the full punch timeline, calculated figures and manual-entry info. Powers the Attendance detail page.',
  roles: ALL_ROLES, usedBy: 'AttendanceDetailPage', pathParams: [['employeeId', 'string', 'Employee id.'], ['date', 'date', '`YYYY-MM-DD`.']],
  responses: [
    [200, 'Record found (with device punches)', ok(F.attendance)],
    [200, 'Day that also has a manual entry', ok(F.attendanceManual)],
    [200, 'No record for that day (e.g. before joining / future)', ok(null)],
    [404, 'Employee not found in scope', notFound('Employee')],
  ],
});

const manualFields = [
  ['employeeId', 'string', true, 'Active employee in scope.'],
  ['date', 'date', true, 'Today or earlier; not before the joining date.'],
  ['punches', 'object[]', true, 'At least one `{ punchIn, punchOut }`.'],
  ['punches[].punchIn', 'time', false, '`HH:mm`. Required on the first pair. Leave empty to add only an OUT punch.'],
  ['punches[].punchOut', 'time', false, '`HH:mm`, must be after `punchIn`. Empty = missing OUT.'],
  ['reason', 'string', true, 'Min 5 characters.'],
];

ep(att, {
  method: 'GET', path: '/attendance/manual-entries/{employeeId}/{date}', title: 'Get manual entry',
  purpose: 'The manual punches and reason stored for an employee-day (used to pre-fill the Edit Manual Entry dialog).',
  roles: ADMIN_HR, usedBy: 'ManualAttendanceDialog (edit mode)', pathParams: [['employeeId', 'string', ''], ['date', 'date', '']],
  responses: [
    [200, 'Entry exists', ok({ employeeId: 'emp-001', date: '2026-09-19', entries: [{ punchIn: '', punchOut: '18:05' }], reason: 'Device was offline; employee forgot to punch out', source: 'MANUAL', by: 'Divya Menon', at: '2026-09-20T09:12:00Z' })],
    [200, 'No manual entry for that day', ok(null)],
    [404, 'Employee not found in scope', notFound('Employee')],
  ],
});

ep(att, {
  method: 'POST', path: '/attendance/manual-entries', title: 'Add manual entry',
  purpose: 'Add hand-entered punches for a day (device offline, forgot to punch, etc.). **The manual punches are added to the day\'s device punches — they never replace them.** Late / early-out / overtime are recalculated immediately.',
  roles: ADMIN_HR, usedBy: 'ManualAttendanceDialog', body: { fields: manualFields, example: { employeeId: 'emp-001', date: '2026-09-19', punches: [{ punchIn: '', punchOut: '18:05' }], reason: 'Device was offline; employee forgot to punch out' } },
  notes: ['At most **one** manual entry per employee per day; a second `POST` returns 409 (use `PUT`).', 'Writes an activity-log entry (module `Attendance`).'],
  responses: [
    [201, 'Entry saved; recalculated record returned', ok(F.attendanceManual, 'Attendance recorded')],
    [409, 'A manual entry already exists for that day', conflict('A manual entry already exists for this employee and date. Edit it instead.', 'MANUAL_ENTRY_EXISTS')],
    [422, 'Validation failed', validation(['date', 'Date cannot be in the future'], ['punches.0.punchOut', 'Punch-out must be after punch-in'], ['reason', 'Please provide a reason (min 5 characters)'])],
    [422, 'Date before joining date', err('BUSINESS_RULE_VIOLATION', 'Date is before the employee joined')],
    [403, 'Employee outside caller\'s scope', forbidden('You cannot edit attendance for this employee')],
    [404, 'Employee not found', notFound('Employee')],
  ],
});

ep(att, {
  method: 'PUT', path: '/attendance/manual-entries/{employeeId}/{date}', title: 'Edit manual entry',
  purpose: 'Replace the manual punches and reason of an existing entry. Device punches are untouched.',
  roles: ADMIN_HR, usedBy: 'ManualAttendanceDialog (edit mode)', pathParams: [['employeeId', 'string', ''], ['date', 'date', '']],
  body: { fields: manualFields.filter((f) => !['employeeId', 'date'].includes(f[0])), example: { punches: [{ punchIn: '', punchOut: '19:30' }], reason: 'Corrected time after checking CCTV' } },
  responses: [
    [200, 'Entry updated', ok({ ...F.attendanceManual, overtimeMinutes: 90 }, 'Manual entry updated')],
    [404, 'No manual entry exists for that day', err('NOT_FOUND', 'No manual entry exists for this day')],
    [422, 'Validation failed', validation(['punches.0.punchIn', 'Punch-in time required'])],
  ],
});

ep(att, {
  method: 'DELETE', path: '/attendance/manual-entries/{employeeId}/{date}', title: 'Delete manual entry',
  purpose: 'Remove the manual punches. The day reverts to whatever the device recorded.',
  roles: ADMIN_HR, usedBy: 'AttendanceDetailPage → Delete Manual Entry', pathParams: [['employeeId', 'string', ''], ['date', 'date', '']],
  responses: [
    [200, 'Deleted; reverted record returned', ok(F.attendance, 'Manual entry deleted')],
    [404, 'No manual entry exists for that day', err('NOT_FOUND', 'No manual entry exists for this day')],
  ],
});

ep(att, {
  method: 'POST', path: '/attendance/recalculate', title: 'Recalculate attendance',
  purpose: 'Re-run the attendance calculation for a date range. The server does this automatically when settings, shifts, holidays or employee shifts change; this endpoint exists for support/backfill.',
  roles: ADMIN_HR, usedBy: 'Support / operations (no UI)',
  body: { fields: [['subCompanyId', 'string', false, 'HR: forced to own. Admin: optional (default all).'], ['employeeId', 'string', false, ''], ['startDate', 'date', true, ''], ['endDate', 'date', true, 'Range limited to 92 days.']], example: { subCompanyId: 'sub-001', startDate: '2026-09-01', endDate: '2026-09-20' } },
  responses: [
    [202, 'Job accepted (runs in the background)', ok({ jobId: 'job_7c1d9e', status: 'QUEUED', recordsEstimated: 300 }, 'Recalculation started')],
    [422, 'Range too large / reversed', validation(['endDate', 'Range cannot exceed 92 days'])],
  ],
});
