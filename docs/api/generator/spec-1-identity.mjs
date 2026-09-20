import { defineModule, ep, crud, ok, list, err, validation, notFound, forbidden, conflict, PAGING, SEARCH, SORT, SA, SA_ADMIN, ADMIN_HR, ALL_ROLES } from './dsl.mjs';
import * as F from './fixtures.mjs';

// ════════════════════════════════════════════════════════════════════════════
// 01 · AUTH & PROFILE
// ════════════════════════════════════════════════════════════════════════════
const auth = defineModule('auth', 'Authentication & Profile', 'Sign-in, token refresh, password flows and the signed-in user\'s own profile. Tokens are JWT bearer tokens: a short-lived **access token** (1 h) sent as `Authorization: Bearer <token>`, and a long-lived **refresh token** (7 d, rotated on every use).');

ep(auth, {
  method: 'POST', path: '/auth/login', title: 'Sign in',
  purpose: 'Exchange email + password for tokens and the user profile. Replaces `authService.login`.',
  roles: ['PUBLIC'], usedBy: 'LoginPage',
  body: { fields: [['email', 'email', true, 'Account email.'], ['password', 'string', true, 'Account password.']], example: { email: 'hr@example.com', password: 'password123' } },
  notes: ['After **5 failed attempts in 15 minutes** the account/IP is locked for 15 minutes (`429 TOO_MANY_ATTEMPTS`).', 'The frontend stores `token` as `auth_token` and `user` as `auth_user` in localStorage.'],
  responses: [
    [200, 'Signed in', ok({ token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTAwNCIs...', refreshToken: 'rt_9d1f0c7e2b4a4f7c8a1e', tokenType: 'Bearer', expiresIn: 3600, user: F.authUser }, 'Signed in successfully')],
    [401, 'Wrong email or password', err('INVALID_CREDENTIALS', 'Invalid email or password')],
    [403, 'User account is deactivated', err('ACCOUNT_INACTIVE', 'Account is inactive. Contact your administrator.')],
    [403, 'User\'s company (or sub-company) is deactivated', err('COMPANY_INACTIVE', 'Your company is inactive. Contact the platform administrator.')],
    [422, 'Missing / malformed fields', validation(['email', 'Enter a valid email address'], ['password', 'Password is required'])],
    [429, 'Too many failed attempts', err('TOO_MANY_ATTEMPTS', 'Too many failed sign-in attempts. Try again in 15 minutes.', undefined, { retryAfterSeconds: 900 })],
  ],
});

ep(auth, {
  method: 'POST', path: '/auth/refresh', title: 'Refresh access token',
  purpose: 'Get a new access token (and a rotated refresh token) without asking the user to sign in again. Call this from the axios 401 interceptor **before** redirecting to `/login`.',
  roles: ['PUBLIC'], usedBy: 'axios interceptor (`src/lib/axios.ts`)',
  body: { fields: [['refreshToken', 'string', true, 'The refresh token issued at login / last refresh.']], example: { refreshToken: 'rt_9d1f0c7e2b4a4f7c8a1e' } },
  notes: ['Each refresh token is single-use. Re-using an already-rotated token revokes the whole token family (theft protection).'],
  responses: [
    [200, 'Tokens rotated', ok({ token: 'eyJhbGciOiJIUzI1NiIs...new', refreshToken: 'rt_b7c3a90d55e14a2f9c30', tokenType: 'Bearer', expiresIn: 3600 })],
    [401, 'Refresh token expired', err('TOKEN_EXPIRED', 'Session expired. Please sign in again.')],
    [401, 'Refresh token invalid / already used / revoked', err('INVALID_REFRESH_TOKEN', 'Invalid refresh token')],
    [422, 'Missing token', validation(['refreshToken', 'Refresh token is required'])],
  ],
});

ep(auth, {
  method: 'POST', path: '/auth/logout', title: 'Sign out',
  purpose: 'Revoke the refresh token so the session cannot be resumed. Replaces `authService.logout`.',
  roles: ALL_ROLES, usedBy: 'Topbar → Sign Out',
  body: { fields: [['refreshToken', 'string', false, 'Refresh token to revoke. If omitted, all of the caller\'s sessions on this device are revoked.']], example: { refreshToken: 'rt_9d1f0c7e2b4a4f7c8a1e' } },
  notes: ['Always succeeds for an authenticated caller; logging out twice is not an error.'],
  responses: [[200, 'Signed out', ok(null, 'Signed out successfully')]],
});

ep(auth, {
  method: 'GET', path: '/auth/me', title: 'Current user',
  purpose: 'Return the signed-in user. Used to validate a stored token on app start. Replaces `authService.getCurrentUser`.',
  roles: ALL_ROLES, usedBy: 'App bootstrap (`hydrateFromStorage`)',
  responses: [
    [200, 'Token valid', ok(F.authUser)],
    [401, 'Token missing / invalid / expired', err('UNAUTHENTICATED', 'Authentication required')],
    [403, 'Account deactivated since the token was issued', err('ACCOUNT_INACTIVE', 'Account is inactive. Contact your administrator.')],
  ],
});

ep(auth, {
  method: 'POST', path: '/auth/forgot-password', title: 'Request password reset',
  purpose: 'Email a single-use reset link (valid 30 minutes). Responds identically whether or not the email exists, so accounts cannot be enumerated.',
  roles: ['PUBLIC'], usedBy: 'Login page ("Forgot password") — not built yet',
  body: { fields: [['email', 'email', true, 'Account email.']], example: { email: 'hr@example.com' } },
  responses: [
    [200, 'Always returned (email sent if the account exists)', ok(null, 'If an account exists for that email, a reset link has been sent')],
    [422, 'Malformed email', validation(['email', 'Enter a valid email address'])],
    [429, 'Rate limited (3 requests / hour / email)', err('RATE_LIMITED', 'Too many requests. Try again later.', undefined, { retryAfterSeconds: 3600 })],
  ],
});

ep(auth, {
  method: 'POST', path: '/auth/reset-password', title: 'Reset password with token',
  purpose: 'Set a new password using the token from the reset email. Revokes all existing sessions.',
  roles: ['PUBLIC'], usedBy: 'Reset-password page — not built yet',
  body: { fields: [['token', 'string', true, 'Token from the email link.'], ['newPassword', 'string', true, 'Min 8 characters.'], ['confirmPassword', 'string', true, 'Must equal `newPassword`.']], example: { token: 'rst_4b8c1e77a9f24d0f', newPassword: 'N3w-Passw0rd!', confirmPassword: 'N3w-Passw0rd!' } },
  responses: [
    [200, 'Password updated', ok(null, 'Password has been reset. Please sign in.')],
    [400, 'Token invalid, expired or already used', err('INVALID_RESET_TOKEN', 'This reset link is invalid or has expired')],
    [422, 'Weak / mismatched password', validation(['newPassword', 'Use at least 8 characters'], ['confirmPassword', 'Passwords do not match'])],
  ],
});

ep(auth, {
  method: 'POST', path: '/auth/change-password', title: 'Change own password',
  purpose: 'Signed-in user changes their password. Backs the "Change Password" card on My Profile.',
  roles: ALL_ROLES, usedBy: 'ProfilePage → Change Password',
  body: { fields: [['currentPassword', 'string', true, 'Existing password.'], ['newPassword', 'string', true, 'Min 8 characters, different from the current one.'], ['confirmPassword', 'string', true, 'Must equal `newPassword`.']], example: { currentPassword: 'password123', newPassword: 'N3w-Passw0rd!', confirmPassword: 'N3w-Passw0rd!' } },
  notes: ['A wrong current password is returned as **422**, not 401 — the frontend interceptor treats every 401 as "session expired" and would log the user out.', 'Other sessions of the user are revoked; the current session keeps working.'],
  responses: [
    [200, 'Password changed', ok(null, 'Password changed successfully')],
    [422, 'Current password is wrong', err('VALIDATION_ERROR', 'One or more fields are invalid', [{ field: 'currentPassword', message: 'Current password is incorrect' }])],
    [422, 'New password same as current / too short / mismatched', validation(['newPassword', 'New password must be different from the current one'], ['confirmPassword', 'Passwords do not match'])],
  ],
});

ep(auth, {
  method: 'GET', path: '/profile', title: 'Get my profile',
  purpose: 'Full account record of the signed-in user (phone, username, last login, created date) shown on My Profile.',
  roles: ALL_ROLES, usedBy: 'ProfilePage',
  responses: [[200, 'Profile', ok(F.user)]],
});

ep(auth, {
  method: 'PATCH', path: '/profile', title: 'Edit my profile',
  purpose: 'Update the caller\'s own name and phone. Email, username, role and company are read-only here (managed by an administrator via `PUT /users/{userId}`).',
  roles: ALL_ROLES, usedBy: 'ProfilePage → Edit Profile',
  body: { fields: [['firstName', 'string', true, '1–50 chars.'], ['lastName', 'string', true, '1–50 chars.'], ['phone', 'string', true, 'Min 7 characters.']], example: { firstName: 'Divya', lastName: 'Menon', phone: '+91-9000000001' } },
  notes: ['Any other field in the body is rejected with 422 (`field is not editable`).'],
  responses: [
    [200, 'Profile updated', ok({ ...F.user, phone: '+91-9000000001' }, 'Profile updated')],
    [422, 'Validation failed', validation(['firstName', 'First name is required'], ['phone', 'Enter a valid phone number'])],
    [422, 'Tried to change a read-only field', validation(['role', 'This field cannot be changed here'])],
  ],
});

// ════════════════════════════════════════════════════════════════════════════
// 02 · COMPANIES
// ════════════════════════════════════════════════════════════════════════════
const companies = defineModule('companies', 'Companies', 'Tenants of the platform. Managed by the Super Admin; an Admin can read only their own company.');

const companyFields = [
  ['name', 'string', true, '2–100 chars.'],
  ['code', 'string', true, '2–10 chars, unique, stored upper-case.'],
  ['registrationNumber', 'string', true, 'Company registration / CIN number.'],
  ['email', 'email', true, ''],
  ['phone', 'string', true, 'Min 7 chars.'],
  ['address', 'string', true, 'Min 5 chars.'],
  ['city', 'string', true, 'Min 2 chars.'],
  ['state', 'string', true, 'Min 2 chars.'],
  ['country', 'string', true, 'Min 2 chars.'],
  ['status', 'enum:ACTIVE|INACTIVE', true, ''],
];
const companyBody = { name: 'Vertex Solutions India', code: 'VRTXIN', registrationNumber: 'CIN-U72300MH2014PTC154785', email: 'info@vertexsolutions.in', phone: '+91-22-67891234', address: 'Level 14, One BKC, Bandra Kurla Complex', city: 'Mumbai', state: 'Maharashtra', country: 'India', status: 'ACTIVE' };

crud(companies, {
  tag: 'Company', plural: 'companies', base: '/companies', idParam: 'companyId',
  model: F.company, model2: F.company2, listRoles: SA, readRoles: SA_ADMIN, writeRoles: SA,
  usedBy: { list: 'CompaniesPage, filters on Users / Activity Logs', get: 'CompanyDetailPage', create: 'CompanyFormDialog', update: 'CompanyFormDialog (edit)', status: 'CompaniesPage / CompanyDetailPage toggle' },
  filters: [['status', 'enum:ACTIVE|INACTIVE', false, 'Filter by status.']],
  sortFields: ['name', 'createdAt'],
  scopeNote: 'An **Admin** may only read their own company; any other id returns 404.',
  fields: companyFields, createExample: companyBody,
  validationErrors: [['code', 'Code must be 2–10 characters'], ['email', 'Enter a valid email address']],
  duplicate: { field: 'code', message: 'A company with code "VRTXIN" already exists', scenario: 'Company code already used' },
  status: { notes: ['Deactivating a company blocks sign-in for every user under it. Existing data is kept.'], extra: [] },
  del: { purpose: 'Soft-delete a company. Not exposed in the UI yet (deactivate is the normal path); kept because the permission `companies:delete` exists.', blockedMessage: 'Company still has sub companies, employees or devices. Deactivate it instead.', blockedScenario: 'Company still has data', blockedCode: 'COMPANY_IN_USE', notes: ['Allowed only when the company has no sub-companies, employees, devices or users.'] },
  updateMethod: 'PUT',
});

ep(companies, {
  method: 'GET', path: '/companies/{companyId}/overview', title: 'Company overview',
  purpose: 'Everything the Company detail page needs in one call: the company, live counts, device health breakdown and its Admin users.',
  roles: SA, usedBy: 'CompanyDetailPage', pathParams: [['companyId', 'string', 'Company id.']],
  responses: [
    [200, 'Overview', ok({
      company: F.company,
      stats: { subCompanies: 3, employees: 25, users: { total: 5, admins: 1, hr: 4 }, devices: { total: 8, online: 6, offline: 1, maintenance: 1, unallocated: 0 } },
      admins: [{ id: 'user-002', fullName: 'Meera Nambiar', email: 'admin@example.com', status: 'ACTIVE' }],
    })],
    [404, 'Company not found', notFound('Company')],
  ],
});

ep(companies, {
  method: 'GET', path: '/companies/{companyId}/sub-companies', title: 'Sub-companies of a company',
  purpose: 'Unpaginated list of one company\'s sub-companies. Feeds the Admin topbar "All Sub Companies" selector and the sub-company dropdowns in forms.',
  roles: SA_ADMIN, usedBy: 'SubCompanySelector, EmployeeFormDialog, Allocate device dialog', pathParams: [['companyId', 'string', 'Company id.']],
  notes: ['An Admin may only request their own company.'],
  responses: [
    [200, 'Sub-companies', ok([F.sub1, F.sub])],
    [403, 'Admin asked for another company', forbidden('You can only access your own company')],
    [404, 'Company not found', notFound('Company')],
  ],
});

ep(companies, {
  method: 'POST', path: '/companies/{companyId}/logo', title: 'Upload company logo',
  purpose: 'Upload / replace the company logo (the "Upload Logo" button on Configuration → Company).',
  roles: SA_ADMIN, usedBy: 'ConfigurationPage → Branding (button not wired yet)', pathParams: [['companyId', 'string', 'Company id.']],
  body: { contentType: 'multipart/form-data', fields: [['file', 'file', true, 'PNG or JPG, max 2 MB, min 64×64 px.']], example: { file: '(binary)' } },
  responses: [
    [200, 'Logo stored', ok({ logoUrl: 'https://cdn.example.com/logos/company-001.png' }, 'Logo updated')],
    [413, 'File larger than 2 MB', err('FILE_TOO_LARGE', 'Logo must be 2 MB or smaller')],
    [415, 'Not a PNG/JPG', err('UNSUPPORTED_MEDIA_TYPE', 'Only PNG and JPG images are allowed')],
    [404, 'Company not found', notFound('Company')],
  ],
});

// ════════════════════════════════════════════════════════════════════════════
// 03 · SUB-COMPANIES
// ════════════════════════════════════════════════════════════════════════════
const subs = defineModule('sub-companies', 'Sub-Companies', 'Branches of a company. **Employees, shifts, holidays and devices hang off sub-companies.** Super Admin manages them; Admin reads all of their company\'s branches; HR reads only their own.');

const subFields = [
  ['companyId', 'string', true, 'Parent company. Immutable after creation.'],
  ['name', 'string', true, '2–100 chars.'],
  ['code', 'string', true, 'Unique, min 2 chars.'],
  ['email', 'email', true, ''],
  ['phone', 'string', true, 'Min 7 chars.'],
  ['address', 'string', true, 'Min 5 chars.'],
  ['city', 'string', true, ''],
  ['state', 'string', true, ''],
  ['country', 'string', true, ''],
  ['timezone', 'string', true, 'Valid IANA zone, e.g. `Asia/Kolkata`.'],
  ['workingDays', 'string[]', true, '1–7 of `MONDAY … SUNDAY`. Default Mon–Fri.'],
  ['status', 'enum:ACTIVE|INACTIVE', true, ''],
];
const subBody = { companyId: 'company-001', name: 'Nexus Trivandrum', code: 'NXTVM', email: 'tvm@nexustech.in', phone: '+91-471-2345678', address: 'Technopark Phase 3', city: 'Trivandrum', state: 'Kerala', country: 'India', timezone: 'Asia/Kolkata', workingDays: F.DAYS_5, status: 'ACTIVE' };

crud(subs, {
  tag: 'Sub company', plural: 'sub-companies', base: '/sub-companies', idParam: 'subCompanyId',
  model: F.sub, model2: F.sub1, listRoles: SA_ADMIN, readRoles: ALL_ROLES, writeRoles: SA,
  usedBy: { list: 'SubCompaniesPage', get: 'SubCompanyDetailPage, HR Configuration → Company', create: 'SubCompanyFormDialog', update: 'SubCompanyFormDialog (edit)', status: 'SubCompaniesPage / SubCompanyDetailPage toggle' },
  filters: [['companyId', 'string', false, 'Only sub-companies of this company. Admin: forced to own company.'], ['status', 'enum:ACTIVE|INACTIVE', false, '']],
  scopeNote: '**Scope:** Super Admin sees all; Admin sees only their company; HR can read only their own sub-company (other ids → 404).',
  fields: subFields, createExample: subBody,
  updateFields: subFields.filter((f) => f[0] !== 'companyId'),
  validationErrors: [['workingDays', 'Select at least one working day'], ['timezone', 'Unknown timezone "Asia/Nowhere"']],
  duplicate: { field: 'code', message: 'A sub company with code "NXTVM" already exists', scenario: 'Sub-company code already used' },
  status: { notes: ['Deactivating a sub-company blocks sign-in for its HR users and stops attendance processing for it.'] },
  extraCreateResponses: [[404, 'Parent company not found', notFound('Company')], [422, 'Parent company is inactive', err('BUSINESS_RULE_VIOLATION', 'Cannot add a sub company to an inactive company')]],
});

ep(subs, {
  method: 'GET', path: '/sub-companies/{subCompanyId}/overview', title: 'Sub-company overview',
  purpose: 'Everything the Sub-company detail page needs: info, live counts, today\'s attendance summary, employees per department, shifts and holiday count.',
  roles: SA, usedBy: 'SubCompanyDetailPage', pathParams: [['subCompanyId', 'string', 'Sub-company id.']],
  responses: [
    [200, 'Overview', ok({
      subCompany: F.sub,
      stats: { employees: 5, hrUsers: 1, devices: { total: 3, online: 2 }, holidaysThisYear: 6 },
      attendanceToday: { date: '2026-09-20', ...F.dailyStats, total: 5, present: 4, absent: 1, late: 0, earlyOut: 0, missingPunch: 0, weeklyOff: 0, overtimeMinutes: 0 },
      departments: [{ name: 'Engineering', count: 4 }, { name: 'Data Science', count: 1 }],
      shifts: [{ id: 'shift-005', name: 'General Shift', startTime: '09:30', endTime: '18:30' }, { id: 'shift-006', name: 'US Shift', startTime: '18:00', endTime: '03:00' }],
    })],
    [404, 'Sub-company not found', notFound('Sub company')],
  ],
});

ep(subs, {
  method: 'PATCH', path: '/sub-companies/{subCompanyId}/profile', title: 'Edit own branch profile',
  purpose: 'Lets HR (own sub-company) and Admin (any sub-company of their company) edit contact details, timezone and working days. Backs the Configuration → Company tab (its Save button is a stub today). Does **not** allow changing name/code/status/parent — those stay with the Super Admin.',
  roles: ADMIN_HR, usedBy: 'ConfigurationPage → Company tab', pathParams: [['subCompanyId', 'string', 'Sub-company id.']],
  body: { fields: [['email', 'email', false, ''], ['phone', 'string', false, 'Min 7 chars.'], ['address', 'string', false, 'Min 5 chars.'], ['timezone', 'string', false, 'IANA zone.'], ['workingDays', 'string[]', false, '1–7 weekdays.']], example: { email: 'kochi@nexustech.in', phone: '+91-484-2345679', address: '3rd Floor, Carnival Infopark', timezone: 'Asia/Kolkata', workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] } },
  notes: ['Changing `timezone` or `workingDays` triggers an attendance recalculation for the current month (background job).'],
  responses: [
    [200, 'Profile updated', ok({ ...F.sub1, workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] }, 'Branch profile updated')],
    [403, 'HR tried to edit another sub-company', forbidden('You can only edit your own sub company')],
    [422, 'Invalid value', validation(['timezone', 'Unknown timezone "Asia/Nowhere"'])],
    [422, 'Immutable field supplied', validation(['name', 'This field can only be changed by a Super Admin'])],
  ],
});

ep(subs, {
  method: 'POST', path: '/sub-companies/{subCompanyId}/logo', title: 'Upload sub-company logo',
  purpose: 'Upload / replace the branch logo.',
  roles: ADMIN_HR, usedBy: 'ConfigurationPage → Branding (not wired yet)', pathParams: [['subCompanyId', 'string', 'Sub-company id.']],
  body: { contentType: 'multipart/form-data', fields: [['file', 'file', true, 'PNG or JPG, max 2 MB.']], example: { file: '(binary)' } },
  responses: [
    [200, 'Logo stored', ok({ logoUrl: 'https://cdn.example.com/logos/sub-001.png' }, 'Logo updated')],
    [413, 'Too large', err('FILE_TOO_LARGE', 'Logo must be 2 MB or smaller')],
    [415, 'Wrong type', err('UNSUPPORTED_MEDIA_TYPE', 'Only PNG and JPG images are allowed')],
  ],
});

// ════════════════════════════════════════════════════════════════════════════
// 04 · DEPARTMENTS
// ════════════════════════════════════════════════════════════════════════════
const depts = defineModule('departments', 'Departments', 'Company-level classification of employees (Engineering, HR, Finance…). One list shared by every sub-company of a company.');

crud(depts, {
  tag: 'Department', plural: 'departments', base: '/departments', idParam: 'departmentId',
  model: F.department, model2: { ...F.department, id: 'dept-company-001-2', name: 'Finance', description: 'Accounts and payroll' },
  listRoles: ALL_ROLES, writeRoles: ADMIN_HR,
  usedBy: { list: 'DepartmentsPage, employee / attendance / report filters', create: 'DepartmentFormDialog', update: 'DepartmentFormDialog (edit)', status: 'DepartmentsPage toggle', del: 'DepartmentsPage' },
  filters: [['companyId', 'string', false, 'Required for Super Admin. Admin/HR: forced to their own company.'], ['status', 'enum:ACTIVE|INACTIVE', false, 'Employee pickers use `ACTIVE`.']],
  fields: [['name', 'string', true, '2–60 chars. Unique within the company (case-insensitive).'], ['description', 'string', false, 'Max 200 chars.'], ['status', 'enum:ACTIVE|INACTIVE', true, '']],
  createExample: { name: 'Finance', description: 'Accounts and payroll', status: 'ACTIVE' },
  validationErrors: [['name', 'Name must be at least 2 characters'], ['description', 'Description must be 200 characters or fewer']],
  duplicate: { field: 'name', message: 'A department named "Finance" already exists.', scenario: 'Name already used in this company' },
  status: { notes: ['Deactivating does not change employees already in the department.'] },
  del: { blockedMessage: 'Department "Engineering" has 12 employees. Reassign them first.', blockedScenario: 'Employees still reference it', blockedCode: 'DEPARTMENT_IN_USE', notes: ['Blocked while any employee still has this department.'] },
  scopeNote: 'The company is taken from the caller\'s token; only a Super Admin passes `companyId`.',
  extraCreateResponses: [],
});

// ════════════════════════════════════════════════════════════════════════════
// 05 · USERS
// ════════════════════════════════════════════════════════════════════════════
const users = defineModule('users', 'Users', 'Platform accounts. **Super Admin** manages Admins and HR users anywhere; **Admin** manages HR users inside their own company. HR has no access.');

crud(users, {
  tag: 'User', plural: 'users', base: '/users', idParam: 'userId',
  model: F.user, model2: F.adminUser, listRoles: SA_ADMIN, writeRoles: SA_ADMIN,
  usedBy: { list: 'UsersPage, Company / Sub-company detail tabs', get: 'UserDetailDialog', create: 'UserFormDialog', update: 'UserFormDialog (edit)', status: 'UsersPage toggle' },
  filters: [['role', 'enum:ADMIN|HR', false, ''], ['status', 'enum:ACTIVE|INACTIVE', false, ''], ['companyId', 'string', false, 'Admin: forced to own company.'], ['subCompanyId', 'string', false, '']],
  sortFields: ['fullName', 'createdAt', 'lastLogin'],
  scopeNote: '**Scope:** an Admin only sees/manages users of their own company and can only create/edit role `HR`. Users outside scope return 404.',
  fields: [
    ['firstName', 'string', true, ''], ['lastName', 'string', true, ''], ['email', 'email', true, 'Unique.'],
    ['phone', 'string', true, 'Min 7 chars.'], ['username', 'string', true, 'Min 3 chars, unique.'],
    ['password', 'string', false, 'Min 6 chars. If omitted the server generates a temporary password and emails it; the user must change it at first login.'],
    ['role', 'enum:ADMIN|HR', true, 'Admin callers may only use `HR`.'],
    ['companyId', 'string', false, 'Required for ADMIN and HR. Admin callers: forced to their own company.'],
    ['subCompanyId', 'string', false, 'Required for HR; must belong to `companyId`.'],
    ['status', 'enum:ACTIVE|INACTIVE', true, ''],
  ],
  createExample: { firstName: 'Priya', lastName: 'Reddy', email: 'priya.reddy@nexustech.in', phone: '+91-9876543214', username: 'hr_blr', role: 'HR', companyId: 'company-001', subCompanyId: 'sub-002', status: 'ACTIVE' },
  updateFields: [
    ['firstName', 'string', true, ''], ['lastName', 'string', true, ''], ['email', 'email', true, 'Unique.'], ['phone', 'string', true, ''], ['username', 'string', true, 'Unique.'],
    ['role', 'enum:ADMIN|HR', true, ''], ['companyId', 'string', false, ''], ['subCompanyId', 'string', false, ''], ['status', 'enum:ACTIVE|INACTIVE', true, ''],
  ],
  validationErrors: [['role', 'Role must be ADMIN or HR'], ['subCompanyId', 'Sub company is required for HR users']],
  duplicate: { field: 'email', message: 'A user with this email already exists', scenario: 'Email or username already used' },
  status: { notes: ['A user cannot deactivate themselves.'], extra: [[409, 'Trying to deactivate own account', conflict('You cannot deactivate your own account', 'CANNOT_DEACTIVATE_SELF')]] },
  forbiddenMessage: 'Admins can only create HR users in their own company',
  extraCreateResponses: [[422, 'Sub-company does not belong to the company', validation(['subCompanyId', 'Sub company does not belong to the selected company'])]],
});

ep(users, {
  method: 'POST', path: '/users/{userId}/reset-password', title: 'Reset a user\'s password (admin action)',
  purpose: 'Administrator forces a password reset for a user (forgotten password with no email access). The server generates a temporary password, emails it, and flags the account to change it at next login.',
  roles: SA_ADMIN, usedBy: 'UsersPage / UserDetailDialog — action not built yet', pathParams: [['userId', 'string', 'Target user id.']],
  notes: ['Revokes all of the user\'s sessions. Admins can only reset HR users of their own company.'],
  responses: [
    [200, 'Temporary password issued', ok({ emailSent: true, mustChangePassword: true }, 'Temporary password sent to hr@example.com')],
    [403, 'Admin tried to reset a non-HR / other-company user', forbidden('You cannot reset this user\'s password')],
    [404, 'User not found', notFound('User')],
    [409, 'Trying to reset own password here', conflict('Use Change Password on your profile to change your own password', 'USE_CHANGE_PASSWORD')],
  ],
});
