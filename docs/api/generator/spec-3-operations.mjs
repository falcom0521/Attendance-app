import { defineModule, ep, ok, list, err, validation, notFound, forbidden, conflict, PAGING, SEARCH, SORT, SA, SA_ADMIN, ADMIN_HR, ALL_ROLES } from './dsl.mjs';
import * as F from './fixtures.mjs';

// ════════════════════════════════════════════════════════════════════════════
// 10 · REQUESTS & LEAVES
// ════════════════════════════════════════════════════════════════════════════
const reqs = defineModule('requests', 'Requests & Leaves', 'Regularization, missing-punch and leave requests with an approval workflow: **HR raises → Admin approves/rejects**; requests raised by an Admin are auto-approved. An approved request is applied to attendance (a manual entry, or `ON_LEAVE` days). \n\n> **Status:** the Requests and Leaves screens are commented out in the frontend for now. These endpoints are specified so they can be switched on later without redesign.');

ep(reqs, {
  method: 'GET', path: '/requests', title: 'List requests',
  purpose: 'Requests visible to the caller, newest first. Filter by status/type for the Pending / Approved / Rejected tabs, or by type `LEAVE` for the leave history.',
  roles: ADMIN_HR, usedBy: 'RequestsPage, LeavePage (history), AttendanceDetailPage ("requests for this day")',
  query: [
    ['status', 'enum:PENDING|APPROVED|REJECTED|CANCELLED', false, ''], ['type', 'enum:REGULARIZATION|MISSING_PUNCH|LEAVE', false, ''],
    ['employeeId', 'string', false, ''], ['date', 'date', false, 'Requests covering this date (a leave range matches every day inside it).'],
    ['subCompanyId', 'string', false, 'HR: forced to own. Admin: optional.'], ['companyId', 'string', false, 'Admin: forced to own company.'],
    ...SEARCH, ...PAGING,
  ],
  notes: ['The response also carries `counts` for the tab badges (independent of the `status` filter).'],
  responses: [
    [200, 'Requests', { success: true, data: [F.request, F.leaveRequest], counts: { PENDING: 5, APPROVED: 3, REJECTED: 1, CANCELLED: 0 }, pagination: { page: 1, pageSize: 10, total: 9, totalPages: 1 } }],
    [200, 'None match', { success: true, data: [], counts: { PENDING: 0, APPROVED: 0, REJECTED: 0, CANCELLED: 0 }, pagination: { page: 1, pageSize: 10, total: 0, totalPages: 1 } }],
  ],
});

ep(reqs, {
  method: 'GET', path: '/requests/{requestId}', title: 'Get request',
  purpose: 'One request with its full audit trail (who raised it, who reviewed it, comments).',
  roles: ADMIN_HR, usedBy: 'RequestReviewDialog', pathParams: [['requestId', 'string', 'Request id.']],
  responses: [[200, 'Request', ok(F.request)], [404, 'Not found / out of scope', notFound('Request')]],
});

ep(reqs, {
  method: 'POST', path: '/requests', title: 'Create request',
  purpose: 'Raise a correction or leave request. HR requests start as `PENDING`; Admin requests are validated, applied immediately and returned as `APPROVED`.',
  roles: ADMIN_HR, usedBy: 'RequestFormDialog',
  body: {
    fields: [
      ['type', 'enum:REGULARIZATION|MISSING_PUNCH|LEAVE', true, ''],
      ['employeeId', 'string', true, 'Active employee in scope.'],
      ['date', 'date', true, 'Attendance date (corrections: today or earlier) or leave start date.'],
      ['endDate', 'date', false, 'LEAVE only. Defaults to `date`. Max 60 days.'],
      ['punches', 'object[]', false, 'REGULARIZATION / MISSING_PUNCH. `[{ punchIn, punchOut }]` as `HH:mm`. MISSING_PUNCH sends only the missing side.'],
      ['leaveType', 'enum:CASUAL|SICK|EARNED|UNPAID', false, 'Required for LEAVE.'],
      ['reason', 'string', true, 'Min 5 characters.'],
    ],
    example: { type: 'MISSING_PUNCH', employeeId: 'emp-006', date: '2026-09-20', punches: [{ punchIn: '', punchOut: '18:05' }], reason: 'Forgot to punch out; left at 6:05 PM after the release call' },
  },
  notes: [
    '**Business rules** (each is a 422 `BUSINESS_RULE_VIOLATION`): a MISSING_PUNCH is only allowed on an `INCOMPLETE` day · one PENDING request per employee/date/type · leave may not overlap another pending/approved leave · leave must contain at least one working day · leave (except UNPAID) may not exceed the remaining balance.',
    'Leave example body: `{ "type":"LEAVE", "employeeId":"emp-002", "date":"2026-09-23", "endDate":"2026-09-25", "leaveType":"CASUAL", "reason":"Family function out of town" }`.',
  ],
  responses: [
    [201, 'HR request submitted (PENDING)', ok(F.request, 'Request submitted for approval')],
    [201, 'Admin request auto-approved and applied', ok({ ...F.leaveRequest, status: 'APPROVED', requestedBy: 'Meera Nambiar', requestedByRole: 'ADMIN', reviewedBy: 'Meera Nambiar', reviewComment: 'Auto-approved (raised by Admin)', reviewedAt: '2026-09-20T09:30:00Z' }, 'Request approved and applied')],
    [422, 'Field validation failed', validation(['reason', 'Please provide a reason (min 5 characters)'], ['leaveType', 'Select a leave type'])],
    [422, 'MISSING_PUNCH on a day without a missing punch', err('BUSINESS_RULE_VIOLATION', 'This day has no missing punch — use a regularization request instead')],
    [422, 'Leave exceeds balance', err('BUSINESS_RULE_VIOLATION', 'Only 9 day(s) of casual leave remaining')],
    [422, 'Leave overlaps an existing request', err('BUSINESS_RULE_VIOLATION', 'This overlaps an existing leave request for the employee')],
    [422, 'Leave falls only on offs/holidays', err('BUSINESS_RULE_VIOLATION', 'Selected dates fall entirely on weekly offs or holidays')],
    [409, 'A pending request already exists', conflict('A pending request already exists for this employee and date', 'REQUEST_ALREADY_PENDING')],
    [403, 'Employee outside caller\'s scope', forbidden('You cannot raise requests for this employee')],
  ],
});

ep(reqs, {
  method: 'POST', path: '/requests/{requestId}/approve', title: 'Approve request',
  purpose: 'Approve a pending request and apply it: corrections become a manual entry on that day; leave marks the working days `ON_LEAVE`.',
  roles: SA_ADMIN.filter((r) => r === 'ADMIN'), usedBy: 'RequestReviewDialog → Approve', pathParams: [['requestId', 'string', 'Request id.']],
  body: { fields: [['comment', 'string', false, 'Optional note to the requester.']], example: { comment: 'Verified with the security log' } },
  notes: ['Only **Admin** can approve. Approval and application happen in one transaction — if applying fails, the request stays PENDING.'],
  responses: [
    [200, 'Approved and applied', ok({ ...F.request, status: 'APPROVED', reviewedBy: 'Meera Nambiar', reviewComment: 'Verified with the security log', reviewedAt: '2026-09-20T10:05:00Z' }, 'Request approved')],
    [403, 'Caller is HR', forbidden('Only an Admin can approve or reject requests')],
    [404, 'Request not found', notFound('Request')],
    [409, 'Already reviewed / cancelled', conflict('Request is already approved', 'REQUEST_NOT_PENDING')],
    [422, 'Could not be applied (data changed since it was raised)', err('BUSINESS_RULE_VIOLATION', 'Cannot enter attendance for a future date')],
  ],
});

ep(reqs, {
  method: 'POST', path: '/requests/{requestId}/reject', title: 'Reject request',
  purpose: 'Reject a pending request. A comment is mandatory so the requester knows why.',
  roles: ['ADMIN'], usedBy: 'RequestReviewDialog → Reject', pathParams: [['requestId', 'string', 'Request id.']],
  body: { fields: [['comment', 'string', true, 'Min 3 characters.']], example: { comment: 'No approval from the reporting manager on record' } },
  responses: [
    [200, 'Rejected', ok({ ...F.request, status: 'REJECTED', reviewedBy: 'Meera Nambiar', reviewComment: 'No approval from the reporting manager on record', reviewedAt: '2026-09-20T10:05:00Z' }, 'Request rejected')],
    [422, 'Comment missing', validation(['comment', 'A comment is required to reject'])],
    [403, 'Caller is HR', forbidden('Only an Admin can approve or reject requests')],
    [404, 'Request not found', notFound('Request')],
    [409, 'Not pending', conflict('Request is already rejected', 'REQUEST_NOT_PENDING')],
  ],
});

ep(reqs, {
  method: 'POST', path: '/requests/{requestId}/cancel', title: 'Cancel / revoke request',
  purpose: 'Withdraw a **pending** request (HR or Admin). An **Admin** can also revoke an already-approved **leave**, which removes its `ON_LEAVE` days.',
  roles: ADMIN_HR, usedBy: 'RequestReviewDialog → Cancel request / Revoke leave', pathParams: [['requestId', 'string', 'Request id.']],
  responses: [
    [200, 'Cancelled', ok({ ...F.request, status: 'CANCELLED', reviewedBy: 'Divya Menon', reviewComment: 'Cancelled by requester', reviewedAt: '2026-09-20T10:10:00Z' }, 'Request cancelled')],
    [404, 'Request not found', notFound('Request')],
    [409, 'Already reviewed (and not an approved leave being revoked by an Admin)', conflict('Only pending requests can be cancelled', 'REQUEST_NOT_PENDING')],
  ],
});

ep(reqs, {
  method: 'GET', path: '/leaves/balances', title: 'Leave balances',
  purpose: 'Leave entitlement / used / pending for every active employee in scope, for one year.',
  roles: ADMIN_HR, usedBy: 'LeavePage → Balances tab',
  query: [['year', 'int', false, 'Default: current year.'], ['subCompanyId', 'string', false, 'HR: forced to own. Admin: optional.'], ['companyId', 'string', false, 'Admin: forced to own company.'], ...SEARCH, ...PAGING],
  responses: [
    [200, 'Balances', list([F.leaveBalance], { pageSize: 10, total: 25 })],
    [422, 'Bad year', validation(['year', 'Must be a 4-digit year'])],
  ],
});

ep(reqs, {
  method: 'GET', path: '/leaves/balances/{employeeId}', title: 'One employee\'s leave balance',
  purpose: 'Balance for a single employee (used to show "N days left" while applying leave).',
  roles: ADMIN_HR, usedBy: 'RequestFormDialog (leave)', pathParams: [['employeeId', 'string', '']], query: [['year', 'int', false, 'Default: current year.']],
  responses: [[200, 'Balance', ok(F.leaveBalance)], [404, 'Employee not found in scope', notFound('Employee')]],
});

ep(reqs, {
  method: 'GET', path: '/leaves/policy', title: 'Get leave policy',
  purpose: 'Annual quota per leave type for the company (today hard-coded: 12 casual, 10 sick, 15 earned).',
  roles: ALL_ROLES, usedBy: 'Not in UI yet', query: [['companyId', 'string', false, 'Required for Super Admin.']],
  responses: [[200, 'Policy', ok({ companyId: 'company-001', quotas: { CASUAL: 12, SICK: 10, EARNED: 15 }, carryForward: false, updatedAt: '2026-01-01T00:00:00Z' })], [422, 'Super Admin without companyId', validation(['companyId', 'companyId is required'])]],
});

ep(reqs, {
  method: 'PUT', path: '/leaves/policy', title: 'Update leave policy',
  purpose: 'Change the yearly quotas. Applies from the next balance calculation; existing usage is kept.',
  roles: ['ADMIN'], usedBy: 'Not in UI yet',
  body: { fields: [['quotas', 'object', true, '`{ CASUAL, SICK, EARNED }` each an integer 0–365.'], ['carryForward', 'bool', false, 'Reserved.']], example: { quotas: { CASUAL: 12, SICK: 10, EARNED: 18 }, carryForward: false } },
  responses: [
    [200, 'Updated', ok({ companyId: 'company-001', quotas: { CASUAL: 12, SICK: 10, EARNED: 18 }, carryForward: false, updatedAt: '2026-09-20T10:00:00Z' }, 'Leave policy updated')],
    [422, 'Invalid quota', validation(['quotas.EARNED', 'Must be between 0 and 365'])],
    [409, 'Quota lower than days already used', conflict('Casual quota cannot be lower than the 14 days already used by an employee', 'QUOTA_BELOW_USAGE')],
  ],
});

// ════════════════════════════════════════════════════════════════════════════
// 11 · DEVICES
// ════════════════════════════════════════════════════════════════════════════
const devs = defineModule('devices', 'Devices', 'Biometric punch devices. **Super Admin** registers, edits, allocates, re-allocates and deallocates. **Admin** has a read-only view of the devices allocated to their company. Punches reach the platform through the [Device Gateway](12-gateway.md).');

const deviceFields = [
  ['deviceId', 'string', true, 'Human-readable code, unique (e.g. `DEV-NX-001`).'],
  ['name', 'string', true, 'Min 2 chars.'],
  ['modelNumber', 'string', true, ''],
  ['serialNumber', 'string', true, 'Unique. The device sends this to the gateway.'],
  ['macAddress', 'string', true, '`AA:BB:CC:DD:EE:FF`, unique.'],
  ['firmwareVersion', 'string', true, ''],
  ['ipAddress', 'string', true, 'IPv4/IPv6.'],
];
const deviceBody = { deviceId: 'DEV-NEW-003', name: 'Spare Device 03', modelNumber: 'ZKTeco F22', serialNumber: 'ZKF22-20260915-101', macAddress: '00:FF:EE:DD:CC:03', firmwareVersion: '2.1.8', ipAddress: '192.168.1.130' };

ep(devs, {
  method: 'GET', path: '/devices', title: 'List devices',
  purpose: 'Paginated device inventory with allocation and health.',
  roles: SA_ADMIN, usedBy: 'DevicesPage, Company / Sub-company detail tabs',
  query: [...PAGING, ...SEARCH, ['status', 'enum:ONLINE|OFFLINE|UNALLOCATED|MAINTENANCE', false, ''], ['companyId', 'string', false, 'Admin: forced to own company.'], ['subCompanyId', 'string', false, '']],
  notes: ['**Scope:** Admin only receives devices currently allocated to their company (read-only). Search matches `deviceId`, `name`, `serialNumber`.'],
  responses: [
    [200, 'Devices', list([F.device, F.spareDevice], { total: 12 })],
    [200, 'No matches', list([], { total: 0 })],
    [422, 'Bad status', validation(['status', 'Must be one of ONLINE, OFFLINE, UNALLOCATED, MAINTENANCE'])],
  ],
});

ep(devs, {
  method: 'GET', path: '/devices/unallocated', title: 'List unallocated devices',
  purpose: 'Spare devices available to allocate (status `UNALLOCATED`).',
  roles: SA, usedBy: 'Allocate flow',
  responses: [[200, 'Spare devices', ok([F.spareDevice])], [200, 'None free', ok([])]],
});

ep(devs, {
  method: 'GET', path: '/devices/{deviceId}', title: 'Get device',
  purpose: 'Full device record for the Device detail page header and Overview tab.',
  roles: SA_ADMIN, usedBy: 'DeviceDetailPage', pathParams: [['deviceId', 'string', 'Device record id (not the `DEV-…` code).']],
  notes: ['An Admin gets 404 for a device that is not currently allocated to their company.'],
  responses: [[200, 'Device', ok(F.device)], [404, 'Not found / not visible to caller', notFound('Device')]],
});

ep(devs, {
  method: 'POST', path: '/devices', title: 'Register device',
  purpose: 'Add a new physical device to the inventory. It starts `UNALLOCATED`.',
  roles: SA, usedBy: 'DeviceFormDialog', body: { fields: deviceFields, example: deviceBody },
  responses: [
    [201, 'Device registered', ok({ ...F.spareDevice, ...deviceBody, id: 'device-013', status: 'UNALLOCATED' }, 'Device added')],
    [422, 'Validation failed', validation(['macAddress', 'Invalid MAC address'], ['serialNumber', 'Serial number required'])],
    [409, 'Device id / serial / MAC already registered', conflict('A device with serial number "ZKF22-20260915-101" already exists', 'DUPLICATE_ENTRY', { field: 'serialNumber' })],
  ],
});

ep(devs, {
  method: 'PUT', path: '/devices/{deviceId}', title: 'Edit device',
  purpose: 'Update descriptive fields (name, model, firmware, IP…).',
  roles: SA, usedBy: 'DeviceFormDialog (edit), DeviceDetailPage → Edit', pathParams: [['deviceId', 'string', 'Device record id.']],
  body: { fields: deviceFields, example: { ...deviceBody, name: 'Kochi Main Entrance', firmwareVersion: '3.4.3' } },
  responses: [
    [200, 'Updated', ok({ ...F.device, firmwareVersion: '3.4.3' }, 'Device updated')],
    [404, 'Not found', notFound('Device')],
    [422, 'Validation failed', validation(['macAddress', 'Invalid MAC address'])],
    [409, 'Serial / MAC / code clashes with another device', conflict('Another device already uses this MAC address', 'DUPLICATE_ENTRY', { field: 'macAddress' })],
  ],
});

ep(devs, {
  method: 'PATCH', path: '/devices/{deviceId}/maintenance', title: 'Set maintenance mode',
  purpose: 'Flag a device as `MAINTENANCE` (punches are still accepted but it is excluded from health alerts) or bring it back. ONLINE/OFFLINE are never set by hand — they follow the heartbeat.',
  roles: SA, usedBy: 'Not in UI yet (status exists in the model)', pathParams: [['deviceId', 'string', 'Device record id.']],
  body: { fields: [['enabled', 'bool', true, ''], ['reason', 'string', false, '']], example: { enabled: true, reason: 'Firmware upgrade' } },
  responses: [[200, 'Updated', ok({ ...F.device, status: 'MAINTENANCE' }, 'Device set to maintenance')], [404, 'Not found', notFound('Device')], [409, 'Unallocated device cannot be in maintenance', conflict('Only allocated devices can be put in maintenance', 'DEVICE_NOT_ALLOCATED')]],
});

ep(devs, {
  method: 'POST', path: '/devices/{deviceId}/allocate', title: 'Allocate / re-allocate device',
  purpose: 'Assign a device to a sub-company. If it is already allocated elsewhere this **re-allocates**: the previous allocation is closed (kept in history) and a new one opens. A re-allocated device keeps its health status; a spare comes ONLINE once it heartbeats.',
  roles: SA, usedBy: 'AllocateDeviceDialog (allocate and re-allocate modes)', pathParams: [['deviceId', 'string', 'Device record id.']],
  body: { fields: [['companyId', 'string', true, ''], ['subCompanyId', 'string', true, 'Must belong to `companyId` and be ACTIVE.'], ['notes', 'string', false, 'Deployment notes.']], example: { companyId: 'company-001', subCompanyId: 'sub-002', notes: 'Main entry for Bangalore office' } },
  responses: [
    [201, 'Allocated', ok(F.allocation, 'Device allocated')],
    [409, 'Already allocated to that sub-company', conflict('Device is already allocated to this sub company', 'ALREADY_ALLOCATED')],
    [404, 'Device / company / sub-company not found', notFound('Sub company')],
    [422, 'Sub-company not in company, or inactive', validation(['subCompanyId', 'Sub company does not belong to the selected company'])],
  ],
});

ep(devs, {
  method: 'POST', path: '/devices/{deviceId}/deallocate', title: 'Deallocate device',
  purpose: 'Return the device to the unallocated pool. Closes the active allocation (kept in history) and stops accepting its punches for the old sub-company.',
  roles: SA, usedBy: 'DeallocateDeviceDialog', pathParams: [['deviceId', 'string', 'Device record id.']],
  body: { fields: [['reason', 'string', false, 'Recorded on the allocation history entry.']], example: { reason: 'Bangalore office closing for renovation' } },
  responses: [
    [200, 'Deallocated', ok({ ...F.spareDevice, id: 'device-004', deviceId: 'DEV-NX-004', name: 'Bangalore Entry' }, 'Device deallocated')],
    [404, 'Not found', notFound('Device')],
    [409, 'Device is not allocated', conflict('Device is not allocated', 'DEVICE_NOT_ALLOCATED')],
  ],
});

ep(devs, {
  method: 'GET', path: '/devices/{deviceId}/allocations', title: 'Allocation history of a device',
  purpose: 'Every allocation the device has had, newest first (Device detail → Allocation History).',
  roles: SA_ADMIN, usedBy: 'DeviceDetailPage → Allocation History', pathParams: [['deviceId', 'string', 'Device record id.']],
  responses: [
    [200, 'History', ok([F.allocation, { ...F.allocation, id: 'alloc-001', subCompanyId: 'sub-001', subCompanyName: 'Nexus Kochi HQ', allocatedAt: '2021-01-10T09:00:00Z', deallocatedAt: '2022-05-14T09:00:00Z', deallocatedBy: 'Arjun Krishnaswamy', deallocationReason: 'Re-allocated to another sub company', isActive: false }])],
    [200, 'Never allocated', ok([])],
    [404, 'Device not found', notFound('Device')],
  ],
});

ep(devs, {
  method: 'GET', path: '/devices/allocations', title: 'All allocations',
  purpose: 'Platform-wide allocation ledger with filters (audit / reporting).',
  roles: SA, usedBy: 'deviceService.getAllocations (no UI yet)',
  query: [...PAGING, ['deviceId', 'string', false, ''], ['companyId', 'string', false, ''], ['subCompanyId', 'string', false, ''], ['isActive', 'bool', false, 'Only current allocations when `true`.']],
  responses: [[200, 'Allocations', list([F.allocation], { total: 1 })]],
});

ep(devs, {
  method: 'GET', path: '/devices/{deviceId}/stats', title: 'Device statistics',
  purpose: 'Punch counters for the Device overview cards.',
  roles: SA_ADMIN, usedBy: 'DeviceDetailPage → Overview', pathParams: [['deviceId', 'string', 'Device record id.']],
  responses: [
    [200, 'Stats (counted in the allocated sub-company\'s timezone)', ok({ punchesToday: 35, punchesLast7Days: 175, uniqueEmployeesToday: 13, lastPunch: '2026-09-20T18:20:00' })],
    [404, 'Device not found / not visible', notFound('Device')],
  ],
});

ep(devs, {
  method: 'GET', path: '/devices/{deviceId}/punches', title: 'Device punch log',
  purpose: 'Raw punches received from this device, newest first (manual entries are not included).',
  roles: SA_ADMIN, usedBy: 'DeviceDetailPage → Punch Log', pathParams: [['deviceId', 'string', 'Device record id.']],
  query: [['startDate', 'date', false, 'Default: 7 days ago.'], ['endDate', 'date', false, 'Default: today.'], ...SEARCH, ...PAGING],
  responses: [
    [200, 'Punches', list([{ id: 'p-004', employeeId: 'emp-001', employeeCode: 'EMP-1001', employeeName: 'Rahul Menon', punchTime: '2026-09-20T18:05:00', punchType: 'OUT', subCompanyId: 'sub-001' }, { id: 'p-003', employeeId: 'emp-001', employeeCode: 'EMP-1001', employeeName: 'Rahul Menon', punchTime: '2026-09-20T13:55:00', punchType: 'IN', subCompanyId: 'sub-001' }], { pageSize: 15, total: 1235 })],
    [200, 'No punches in range', list([], { pageSize: 15, total: 0 })],
    [404, 'Device not found', notFound('Device')],
    [422, 'Range reversed', validation(['endDate', 'End date must be on or after start date'])],
  ],
});

// ════════════════════════════════════════════════════════════════════════════
// 12 · DEVICE GATEWAY
// ════════════════════════════════════════════════════════════════════════════
const gw = defineModule('gateway', 'Device Gateway', 'Machine-to-machine endpoints called **by the punch devices (or an on-site agent)**, not by the web app. Authenticated with the device\'s credentials instead of a user JWT. This is how raw punches enter the system; attendance is then calculated from them.', {
  extra: `**Authentication:** send both headers on every call.

| Header | Value |
|---|---|
| \`X-Device-Serial\` | The device's \`serialNumber\` |
| \`X-Device-Key\` | Secret API key issued when the device is registered |

**Idempotency:** a punch is uniquely identified by \`(device, employeeCode, punchTime)\`. Re-sending a batch is safe — duplicates are counted, not stored twice.`,
});

ep(gw, {
  method: 'POST', path: '/gateway/punches', title: 'Push punches',
  purpose: 'Deliver a batch of punches recorded by a device (offline devices send their backlog when they reconnect). Each accepted punch triggers recalculation of that employee-day.',
  roles: ['DEVICE'], usedBy: 'Device firmware / on-site agent',
  body: {
    fields: [
      ['punches', 'object[]', true, '1–500 items.'],
      ['punches[].employeeCode', 'string', true, 'Employee code enrolled on the device.'],
      ['punches[].punchTime', 'datetime', true, 'ISO-8601. With an offset/`Z` it is converted; without one it is read as local time of the sub-company.'],
      ['punches[].punchType', 'enum:IN|OUT', false, 'If omitted the server alternates IN/OUT per employee per day.'],
    ],
    example: { punches: [{ employeeCode: 'EMP-1001', punchTime: '2026-09-20T08:55:12+05:30', punchType: 'IN' }, { employeeCode: 'EMP-1002', punchTime: '2026-09-20T09:42:03+05:30' }, { employeeCode: 'EMP-9999', punchTime: '2026-09-20T09:50:00+05:30' }] },
  },
  responses: [
    [200, 'Processed — partial acceptance is normal', ok({ received: 3, accepted: 2, duplicates: 0, rejected: [{ index: 2, employeeCode: 'EMP-9999', reason: 'UNKNOWN_EMPLOYEE' }] }, 'Punches processed')],
    [200, 'Re-sent batch — everything already stored', ok({ received: 3, accepted: 0, duplicates: 3, rejected: [] }, 'Punches processed')],
    [401, 'Missing / wrong device key', err('INVALID_DEVICE_CREDENTIALS', 'Invalid device serial or key')],
    [403, 'Device is not allocated (or its sub-company is inactive)', err('DEVICE_NOT_ALLOCATED', 'Device is not allocated to a sub company')],
    [413, 'More than 500 punches', err('BATCH_TOO_LARGE', 'Send at most 500 punches per request')],
    [422, 'Malformed body', validation(['punches.0.punchTime', 'Invalid date-time'])],
  ],
});

ep(gw, {
  method: 'POST', path: '/gateway/heartbeat', title: 'Device heartbeat',
  purpose: 'Sent every 60 s. Updates `lastSeen`, `firmwareVersion` and `ipAddress` and drives ONLINE/OFFLINE (no heartbeat for 5 minutes ⇒ OFFLINE).',
  roles: ['DEVICE'], usedBy: 'Device firmware / on-site agent',
  body: { fields: [['firmwareVersion', 'string', false, ''], ['ipAddress', 'string', false, ''], ['pendingPunches', 'int', false, 'Punches still queued on the device.']], example: { firmwareVersion: '3.4.2', ipAddress: '192.168.10.11', pendingPunches: 0 } },
  responses: [
    [200, 'Acknowledged', ok({ serverTime: '2026-09-20T09:45:00Z', status: 'ONLINE', pushIntervalSeconds: 60 })],
    [401, 'Bad credentials', err('INVALID_DEVICE_CREDENTIALS', 'Invalid device serial or key')],
  ],
});

// ════════════════════════════════════════════════════════════════════════════
// 13 · SETTINGS
// ════════════════════════════════════════════════════════════════════════════
const settings = defineModule('settings', 'Configuration — Attendance Settings', 'Company-wide attendance policy (Configuration → Attendance Settings). Shifts, holidays and departments have their own modules; the branch profile is under [Sub-Companies](03-sub-companies.md).');

ep(settings, {
  method: 'GET', path: '/settings/attendance', title: 'Get attendance settings',
  purpose: 'Current policy for the caller\'s company.', roles: ALL_ROLES, usedBy: 'ConfigurationPage → Attendance Settings, ShiftFormDialog (default grace)',
  query: [['companyId', 'string', false, 'Required for Super Admin; ignored for Admin/HR.']],
  responses: [[200, 'Settings (defaults returned if never saved)', ok(F.attendanceSettings)], [422, 'Super Admin without companyId', validation(['companyId', 'companyId is required'])], [404, 'Company not found', notFound('Company')]],
});

ep(settings, {
  method: 'PUT', path: '/settings/attendance', title: 'Update attendance settings',
  purpose: 'Save the policy. **Triggers a background recalculation** of late / early-out / overtime for the company\'s attendance (current and previous month).',
  roles: ADMIN_HR, usedBy: 'ConfigurationPage → Save Attendance Settings',
  body: {
    fields: [
      ['lateGracePeriodMinutes', 'int', true, '0–120. Default for new shifts.'],
      ['earlyOutThresholdMinutes', 'int', true, '0–120.'],
      ['minimumWorkingHours', 'time', true, '`HH:mm`.'],
      ['overtimeThresholdMinutes', 'int', true, '0–240.'],
      ['overtimeEnabled', 'bool', true, ''],
      ['autoAbsent', 'bool', true, ''],
    ],
    example: { lateGracePeriodMinutes: 15, earlyOutThresholdMinutes: 15, minimumWorkingHours: '07:00', overtimeThresholdMinutes: 60, overtimeEnabled: true, autoAbsent: false },
  },
  responses: [
    [200, 'Saved; recalculation queued', ok({ ...F.attendanceSettings, overtimeThresholdMinutes: 60, recalculation: { jobId: 'job_a41e77', status: 'QUEUED' } }, 'Attendance settings saved')],
    [422, 'Validation failed', validation(['overtimeThresholdMinutes', 'Must be between 0 and 240'], ['minimumWorkingHours', 'Use HH:mm format'])],
  ],
});

// ════════════════════════════════════════════════════════════════════════════
// 14 · REPORTS
// ════════════════════════════════════════════════════════════════════════════
const reports = defineModule('reports', 'Reports & Exports', 'Excel / PDF / CSV exports of attendance. Today the UI only simulates these with a timer; this defines the real thing. Small reports finish inside the request; large ones return `202` and are polled.');

ep(reports, {
  method: 'POST', path: '/reports/generate', title: 'Generate report',
  purpose: 'Create an export. Replaces `reportService.generateReport / exportDailyReport / exportMonthlyReport`.',
  roles: ADMIN_HR, usedBy: 'ReportsPage (4 tabs), MonthlyAttendancePage export buttons, EmployeeDetailPage → Reports',
  body: {
    fields: [
      ['type', 'enum:DAILY|MONTHLY|EMPLOYEE|MULTI_EMPLOYEE', true, ''],
      ['format', 'enum:EXCEL|PDF|CSV', true, ''],
      ['date', 'date', false, 'DAILY: required.'],
      ['month', 'int', false, 'MONTHLY / EMPLOYEE: with `year` (or use a date range for EMPLOYEE).'],
      ['year', 'int', false, ''],
      ['startDate', 'date', false, 'EMPLOYEE / MULTI_EMPLOYEE alternative to month+year.'],
      ['endDate', 'date', false, 'Range max 92 days.'],
      ['employeeIds', 'string[]', false, 'EMPLOYEE: exactly 1. MULTI_EMPLOYEE: 2–100.'],
      ['departmentId', 'string', false, 'Department name.'],
      ['shiftId', 'string', false, ''],
      ['subCompanyId', 'string', false, 'HR: forced to own. Admin: optional (default all).'],
    ],
    example: { type: 'MONTHLY', format: 'EXCEL', month: 9, year: 2026, subCompanyId: 'sub-001' },
  },
  notes: ['File name pattern: `attendance_<type>_report_<yyyyMMdd_HHmmss>.<xlsx|pdf|csv>`.', 'Reports are built in the sub-company\'s timezone and kept for 7 days.'],
  responses: [
    [200, 'Completed synchronously', ok(F.reportJob, 'Report generated successfully')],
    [202, 'Large report — poll `GET /reports/{reportId}`', ok({ ...F.reportJob, status: 'PROCESSING', fileName: null, fileSize: null, rowCount: null, downloadUrl: null, expiresAt: null, completedAt: null }, 'Report is being generated')],
    [422, 'Missing required filters for the type', validation(['date', 'Date is required for a daily report'])],
    [422, 'MULTI_EMPLOYEE with fewer than 2 employees', validation(['employeeIds', 'Select at least 2 employees'])],
    [422, 'No data', err('NO_DATA', 'No attendance data for the selected filters')],
    [403, 'Sub-company / employee out of scope', forbidden('You cannot generate reports for this sub company')],
  ],
});

ep(reports, {
  method: 'GET', path: '/reports', title: 'Report history',
  purpose: 'The caller\'s recent exports (last 7 days) so a download can be repeated.',
  roles: ADMIN_HR, usedBy: 'Not in UI yet', query: [...PAGING],
  responses: [[200, 'History', list([F.reportJob], { total: 1 })]],
});

ep(reports, {
  method: 'GET', path: '/reports/{reportId}', title: 'Report status',
  purpose: 'Poll a `PROCESSING` report until it is `COMPLETED` or `FAILED`.',
  roles: ADMIN_HR, usedBy: 'ReportsPage (polling)', pathParams: [['reportId', 'string', 'Report id.']],
  responses: [[200, 'Completed', ok(F.reportJob)], [200, 'Failed', ok({ ...F.reportJob, status: 'FAILED', downloadUrl: null, error: 'Report exceeded the 100,000 row limit' })], [404, 'Not found / belongs to another user', notFound('Report')]],
});

ep(reports, {
  method: 'GET', path: '/reports/{reportId}/download', title: 'Download report file',
  purpose: 'Stream the generated file. Response is the binary file, not JSON: `Content-Disposition: attachment; filename="…"` and `Content-Type` = `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (EXCEL), `application/pdf` (PDF) or `text/csv` (CSV).',
  roles: ADMIN_HR, usedBy: 'ReportsPage (after generation)', pathParams: [['reportId', 'string', 'Report id.']],
  responses: [
    [200, 'File stream (binary)', '(binary file)'],
    [404, 'Not found', notFound('Report')],
    [409, 'Still processing', conflict('Report is still being generated', 'REPORT_NOT_READY')],
    [410, 'File expired (older than 7 days)', err('REPORT_EXPIRED', 'This report has expired. Generate it again.')],
  ],
});

// ════════════════════════════════════════════════════════════════════════════
// 15 · DASHBOARD
// ════════════════════════════════════════════════════════════════════════════
const dash = defineModule('dashboard', 'Dashboards', 'Pre-aggregated data for each role\'s landing page. All figures are computed from live data — nothing here is hand-maintained.');

ep(dash, {
  method: 'GET', path: '/dashboard/super-admin', title: 'Super Admin dashboard',
  purpose: 'Platform-wide KPIs, company growth, device health, largest companies and recent activity.',
  roles: SA, usedBy: 'SuperAdminDashboard',
  responses: [[200, 'Dashboard', ok({
    totalCompanies: 5, activeCompanies: 4, totalSubCompanies: 12, totalEmployees: 25, totalUsers: 7, totalDevices: 12, onlineDevices: 8, offlineDevices: 1,
    companyTrend: [{ month: 'Apr', companies: 5 }, { month: 'May', companies: 5 }, { month: 'Jun', companies: 5 }, { month: 'Jul', companies: 5 }, { month: 'Aug', companies: 5 }, { month: 'Sep', companies: 5 }],
    deviceStatus: [{ name: 'Online', value: 8, color: '#22c55e' }, { name: 'Offline', value: 1, color: '#ef4444' }, { name: 'Unallocated', value: 2, color: '#94a3b8' }, { name: 'Maintenance', value: 1, color: '#f59e0b' }],
    topCompanies: [{ id: 'company-001', name: 'Nexus Technologies Pvt Ltd', employees: 25, subCompanies: 3 }],
    recentActivity: [{ id: 'log-0016', action: 'ALLOCATED', module: 'Devices', target: 'DEV-NX-004 → Nexus Bangalore', userName: 'Arjun Krishnaswamy', date: '2026-09-20T09:30:00Z' }],
  })]],
});

ep(dash, {
  method: 'GET', path: '/dashboard/admin', title: 'Admin dashboard',
  purpose: 'Company-level attendance KPIs, a 7-day trend and department distribution, optionally narrowed to one sub-company.',
  roles: ['ADMIN'], usedBy: 'AdminDashboard', query: [['subCompanyId', 'string', false, 'Narrow to one sub-company (topbar selector). Omit = all.']],
  responses: [
    [200, 'Dashboard', ok({
      totalEmployees: 25, presentToday: 9, absentToday: 1, lateToday: 3, totalSubCompanies: 3, totalDevices: 8,
      attendanceTrend: [{ date: 'Mon', present: 22, absent: 1, late: 2 }, { date: 'Tue', present: 21, absent: 2, late: 3 }, { date: 'Sat', present: 0, absent: 0, late: 0 }],
      departmentDistribution: [{ name: 'Engineering', value: 15, color: '#3b82f6' }, { name: 'Product', value: 2, color: '#22c55e' }],
    })],
    [403, 'Sub-company outside the company', forbidden('You cannot view this sub company')],
  ],
});

ep(dash, {
  method: 'GET', path: '/dashboard/hr', title: 'HR dashboard',
  purpose: 'Today\'s status counts for the HR user\'s sub-company, a 7-day trend, department attendance and the latest records.',
  roles: ['HR'], usedBy: 'HRDashboard',
  responses: [[200, 'Dashboard', ok({
    totalEmployees: 14, presentToday: 9, absentToday: 1, lateToday: 3, earlyOut: 1, missingPunch: 1, onLeave: 0, holiday: 0,
    weeklyAttendance: [{ date: 'Mon', present: 12, absent: 1, late: 1 }],
    departmentAttendance: [{ dept: 'Engineering', present: 6, total: 7 }],
    recentAttendance: [F.attendance, F.attendanceLate],
  })]],
});

// ════════════════════════════════════════════════════════════════════════════
// 16 · ACTIVITY LOGS
// ════════════════════════════════════════════════════════════════════════════
const logs = defineModule('activity-logs', 'Activity Logs', 'Immutable audit trail of every state-changing action (create, update, delete, activate, allocate, approve…). **Written by the server** from the authenticated request — clients never post log entries. Super Admin only.');

ep(logs, {
  method: 'GET', path: '/activity-logs', title: 'List activity logs',
  purpose: 'Filterable, paginated audit trail, newest first. Also used embedded: a company\'s Activity tab (`companyId`) and a user\'s "recent activity" (`userId`).',
  roles: SA, usedBy: 'ActivityLogsPage, CompanyDetailPage → Activity, UserDetailDialog, Super Admin dashboard (recent)',
  query: [...PAGING, ...SEARCH, ['module', 'string', false, 'Companies, Sub Companies, Devices, Users, Employees, Shifts, Holidays, Attendance, Requests, Configuration.'], ['action', 'enum:CREATED|UPDATED|DELETED|ACTIVATED|DEACTIVATED|ALLOCATED|DEALLOCATED|APPROVED|REJECTED|CANCELLED', false, ''], ['role', 'enum:SUPER_ADMIN|ADMIN|HR', false, 'Role of the actor.'], ['userId', 'string', false, 'Actor.'], ['companyId', 'string', false, ''], ['startDate', 'date', false, 'Inclusive.'], ['endDate', 'date', false, 'Inclusive.']],
  responses: [
    [200, 'Logs', list([F.activityLog], { pageSize: 15, total: 16 })],
    [200, 'No matches', list([], { pageSize: 15, total: 0 })],
    [422, 'Reversed date range', validation(['endDate', 'End date must be on or after start date'])],
    [403, 'Caller is not a Super Admin', forbidden()],
  ],
});

ep(logs, {
  method: 'GET', path: '/activity-logs/{logId}', title: 'Get activity log entry',
  purpose: 'One audit entry (for deep links / support).', roles: SA, usedBy: 'Not in UI yet', pathParams: [['logId', 'string', 'Log id.']],
  responses: [[200, 'Entry', ok(F.activityLog)], [404, 'Not found', notFound('Activity log')]],
});

// ════════════════════════════════════════════════════════════════════════════
// 17 · SYSTEM
// ════════════════════════════════════════════════════════════════════════════
const sys = defineModule('system', 'System', 'Operational endpoints.');

ep(sys, {
  method: 'GET', path: '/health', title: 'Health check',
  purpose: 'Liveness/readiness probe for load balancers and monitoring. No authentication, no envelope.',
  roles: ['PUBLIC'], usedBy: 'Infrastructure',
  responses: [
    [200, 'Healthy', { status: 'ok', version: '1.0.0', uptimeSeconds: 86412, checks: { database: 'ok', cache: 'ok', queue: 'ok' }, time: '2026-09-20T09:30:00Z' }],
    [503, 'A dependency is down', { status: 'degraded', version: '1.0.0', uptimeSeconds: 86412, checks: { database: 'ok', cache: 'down', queue: 'ok' }, time: '2026-09-20T09:30:00Z' }],
  ],
});
