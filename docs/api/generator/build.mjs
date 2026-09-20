// Generates the API package from the spec:
//   docs/api/README.md                       overview, conventions, errors, RBAC, models, endpoint index
//   docs/api/modules/NN-<module>.md          full reference per module (purpose, payloads, scenarios)
//   docs/api/openapi.yaml                    OpenAPI 3.0.3
//   docs/api/AttendanceIQ.postman_collection.json
//
// Run:  node docs/api/generator/build.mjs

import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { modules, models } from './dsl.mjs';
import './spec-models.mjs';
import './spec-1-identity.mjs';
import './spec-2-workforce.mjs';
import './spec-3-operations.mjs';
import * as F from './fixtures.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE_URL = 'http://localhost:8000/api/v1';
const VERSION = '1.0.0';

const ROLE_LABEL = { SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin', HR: 'HR', PUBLIC: 'Public (no auth)', DEVICE: 'Device credentials' };
const STATUS_TEXT = { 200: 'OK', 201: 'Created', 202: 'Accepted', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 409: 'Conflict', 410: 'Gone', 413: 'Payload Too Large', 415: 'Unsupported Media Type', 422: 'Unprocessable Entity', 429: 'Too Many Requests', 500: 'Internal Server Error', 503: 'Service Unavailable' };
const json = (v) => JSON.stringify(v, null, 2);
const pad = (n) => String(n).padStart(2, '0');
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const modNo = new Map(modules.map((m, i) => [m.id, i + 1]));
const modFile = (m) => `${pad(modNo.get(m.id))}-${m.id}.md`;
let totalEndpoints = 0;
modules.forEach((m) => { totalEndpoints += m.endpoints.length; });

// ── type helpers ────────────────────────────────────────────────────────────
function typeLabel(t) {
  let s = t.replace(/\?$/, '');
  const isArr = s.endsWith('[]');
  if (isArr) s = s.slice(0, -2);
  const nullable = t.endsWith('?');
  let out;
  if (s.startsWith('enum:')) out = s.slice(5).split('|').map((v) => `\`${v}\``).join(' \\| ');
  else if (s === 'int') out = 'integer';
  else if (s === 'bool') out = 'boolean';
  else if (s === 'date') out = 'date (`YYYY-MM-DD`)';
  else if (s === 'datetime') out = 'datetime (ISO-8601)';
  else if (s === 'time') out = 'time (`HH:mm`)';
  else out = s;
  if (isArr) out = `${out}[]`;
  return nullable ? `${out} \\| null` : out;
}

const modelNames = new Set(models.map((m) => m.name));
function schemaFor(t) {
  let s = t;
  let nullable = false;
  if (s.endsWith('?')) { nullable = true; s = s.slice(0, -1); }
  if (s.endsWith('[]')) {
    const items = schemaFor(s.slice(0, -2));
    return { type: 'array', items, ...(nullable ? { nullable: true } : {}) };
  }
  let out;
  if (s.startsWith('enum:')) out = { type: 'string', enum: s.slice(5).split('|') };
  else if (s === 'int') out = { type: 'integer' };
  else if (s === 'number') out = { type: 'number' };
  else if (s === 'bool') out = { type: 'boolean' };
  else if (s === 'date') out = { type: 'string', format: 'date' };
  else if (s === 'datetime') out = { type: 'string', format: 'date-time' };
  else if (s === 'time') out = { type: 'string', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$', example: '09:00' };
  else if (s === 'email') out = { type: 'string', format: 'email' };
  else if (s === 'file') out = { type: 'string', format: 'binary' };
  else if (s === 'object') out = { type: 'object' };
  else if (modelNames.has(s)) out = { $ref: `#/components/schemas/${s}` };
  else out = { type: 'string' };
  return nullable ? { ...out, nullable: true } : out;
}

function objectSchema(fields, withRequired = true) {
  const properties = {};
  const required = [];
  for (const [name, type, req, desc] of fields) {
    if (name.includes('[].')) {
      const [parent, child] = name.split('[].');
      const p = properties[parent];
      if (p?.items) {
        p.items.type = 'object';
        p.items.properties = { ...(p.items.properties ?? {}), [child]: { ...schemaFor(type), ...(desc ? { description: desc } : {}) } };
      }
      continue;
    }
    properties[name] = { ...schemaFor(type), ...(desc ? { description: desc } : {}) };
    if (req === true) required.push(name);
  }
  return { type: 'object', properties, ...(withRequired && required.length ? { required } : {}) };
}

// ── YAML (strings are always double-quoted JSON strings, which is valid YAML) ─
function toYaml(v, indent = 0) {
  const sp = '  '.repeat(indent);
  if (v === null) return 'null';
  if (typeof v === 'string') return JSON.stringify(v);
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) {
    if (!v.length) return '[]';
    return v.map((item) => {
      const rendered = toYaml(item, indent + 1);
      if (item !== null && typeof item === 'object' && !(Array.isArray(item) && !item.length) && !(!Array.isArray(item) && !Object.keys(item).length)) {
        return `${sp}- ${rendered.trimStart()}`;
      }
      return `${sp}- ${rendered}`;
    }).join('\n');
  }
  const keys = Object.keys(v).filter((k) => v[k] !== undefined);
  if (!keys.length) return '{}';
  return keys.map((k) => {
    const val = v[k];
    const key = JSON.stringify(k);
    const complex = val !== null && typeof val === 'object' && (Array.isArray(val) ? val.length : Object.keys(val).length);
    return complex ? `${sp}${key}:\n${toYaml(val, indent + 1)}` : `${sp}${key}: ${toYaml(val, indent + 1)}`;
  }).join('\n');
}

// ── Markdown: endpoint ──────────────────────────────────────────────────────
const isAuthed = (e) => !e.roles.some((r) => r === 'PUBLIC' || r === 'DEVICE');
const rolesText = (e) => e.roles.map((r) => ROLE_LABEL[r] ?? r).join(', ');

function table(headers, rows) {
  if (!rows.length) return '';
  return `| ${headers.join(' | ')} |\n|${headers.map(() => '---').join('|')}|\n${rows.map((r) => `| ${r.join(' | ')} |`).join('\n')}\n`;
}

function endpointMd(m, e, idx) {
  const n = `${modNo.get(m.id)}.${idx + 1}`;
  const out = [];
  out.push(`### ${n} · ${e.title}`);
  out.push('');
  out.push(`\`${e.method}\` \`${e.path}\``);
  out.push('');
  out.push(`**Purpose:** ${e.purpose}`);
  out.push('');
  out.push(`- **Access:** ${rolesText(e)}`);
  if (e.usedBy) out.push(`- **Used by:** ${e.usedBy}`);
  if (e.roles.includes('PUBLIC')) out.push('- **Auth:** none');
  else if (e.roles.includes('DEVICE')) out.push('- **Auth:** headers `X-Device-Serial` + `X-Device-Key`');
  else out.push('- **Auth:** `Authorization: Bearer <accessToken>`');
  out.push('');

  if (e.pathParams.length) {
    out.push('**Path parameters**', '');
    out.push(table(['Name', 'Type', 'Description'], e.pathParams.map(([n2, t, d]) => [`\`${n2}\``, typeLabel(t), d])));
  }
  if (e.query.length) {
    out.push('**Query parameters**', '');
    out.push(table(['Name', 'Type', 'Required', 'Description'], e.query.map(([n2, t, r, d]) => [`\`${n2}\``, typeLabel(t), r ? '**yes**' : 'no', d])));
  }
  if (e.body) {
    out.push(`**Request body** (\`${e.body.contentType ?? 'application/json'}\`)`, '');
    out.push(table(['Field', 'Type', 'Required', 'Rules'], e.body.fields.map(([n2, t, r, d]) => [`\`${n2}\``, typeLabel(t), r ? '**yes**' : 'no', d])));
    out.push('```json', json(e.body.example), '```', '');
  }
  if (e.notes?.length) {
    out.push('**Notes**', '');
    e.notes.forEach((x) => out.push(`- ${x}`));
    out.push('');
  }

  out.push('**Response scenarios**', '');
  for (const r of e.responses) {
    const icon = r.status < 300 ? '✅' : '❌';
    out.push(`#### ${icon} \`${r.status} ${STATUS_TEXT[r.status] ?? ''}\` — ${r.scenario}`, '');
    if (typeof r.body === 'string') out.push(r.body, '');
    else out.push('```json', json(r.body), '```', '');
  }
  if (isAuthed(e)) {
    out.push('_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).', '');
  }
  out.push('---', '');
  return out.join('\n');
}

function moduleMd(m) {
  const out = [];
  out.push(`# ${modNo.get(m.id)}. ${m.title}`, '');
  out.push(m.description, '');
  if (m.extra) out.push(m.extra, '');
  out.push('[← Back to overview](../README.md)', '');
  out.push('## Endpoints in this module', '');
  out.push(table(['#', 'Method', 'Path', 'Purpose', 'Access'], m.endpoints.map((e, i) => [`${modNo.get(m.id)}.${i + 1}`, `\`${e.method}\``, `\`${e.path}\``, e.title, rolesText(e)])));
  out.push('---', '');
  m.endpoints.forEach((e, i) => out.push(endpointMd(m, e, i)));
  return out.join('\n');
}

// ── Markdown: README ────────────────────────────────────────────────────────
function rbacMatrix() {
  const cell = (m, role) => {
    const eps = m.endpoints.filter((e) => e.roles.includes(role));
    if (!eps.length) return '—';
    const write = eps.some((e) => e.method !== 'GET');
    return write ? '**Read + Write**' : 'Read';
  };
  const rows = modules
    .filter((m) => !['gateway', 'system'].includes(m.id))
    .map((m) => [m.title, cell(m, 'SUPER_ADMIN'), cell(m, 'ADMIN'), cell(m, 'HR')]);
  return table(['Module', 'Super Admin', 'Admin', 'HR'], rows);
}

function modelsMd() {
  const out = [];
  for (const mdl of models) {
    out.push(`### ${mdl.name}`, '', mdl.description, '');
    out.push(table(['Field', 'Type', 'Description'], mdl.fields.map(([n, t, d]) => [`\`${n}\``, typeLabel(t), d])));
    out.push('```json', json(mdl.example), '```', '');
  }
  return out.join('\n');
}

function indexMd() {
  const out = [];
  for (const m of modules) {
    out.push(`#### ${modNo.get(m.id)}. [${m.title}](modules/${modFile(m)}) — ${m.endpoints.length} endpoint${m.endpoints.length === 1 ? '' : 's'}`, '');
    out.push(table(['Method', 'Path', 'Purpose', 'Access'], m.endpoints.map((e) => [`\`${e.method}\``, `\`${e.path}\``, e.title, rolesText(e)])));
  }
  return out.join('\n');
}

const COMMON_ERRORS = [
  [400, 'BAD_REQUEST', 'Malformed JSON or an unsupported request', F.err('BAD_REQUEST', 'Malformed JSON in request body')],
  [401, 'UNAUTHENTICATED', 'No / invalid bearer token', F.err('UNAUTHENTICATED', 'Authentication required')],
  [401, 'TOKEN_EXPIRED', 'Access token expired — call `/auth/refresh`', F.err('TOKEN_EXPIRED', 'Access token has expired')],
  [403, 'FORBIDDEN', 'Authenticated but not allowed (role, or outside your company / sub-company scope)', F.forbidden()],
  [404, 'NOT_FOUND', 'Resource missing **or hidden by scope** (the API never confirms that an out-of-scope record exists)', F.notFound('Employee')],
  [409, 'CONFLICT / DUPLICATE_ENTRY / *_IN_USE', 'Unique constraint or a business conflict', F.conflict('A company with code "VRTXIN" already exists', 'DUPLICATE_ENTRY', { field: 'code' })],
  [422, 'VALIDATION_ERROR', 'Field-level validation failed — `errors[]` lists every problem at once', F.validation(['email', 'Enter a valid email address'], ['phone', 'Phone required'])],
  [422, 'BUSINESS_RULE_VIOLATION', 'Well-formed request that breaks a domain rule', F.err('BUSINESS_RULE_VIOLATION', 'Cannot enter attendance for a future date')],
  [429, 'RATE_LIMITED', 'Too many requests. Honour `Retry-After` / `retryAfterSeconds`', F.err('RATE_LIMITED', 'Too many requests. Try again later.', undefined, { retryAfterSeconds: 60 })],
  [500, 'INTERNAL_ERROR', 'Unexpected server error. Quote `requestId` to support', F.err('INTERNAL_ERROR', 'Something went wrong on our side')],
  [503, 'SERVICE_UNAVAILABLE', 'Dependency down / maintenance', F.err('SERVICE_UNAVAILABLE', 'Service temporarily unavailable')],
];

function readmeMd() {
  const out = [];
  out.push('# AttendanceIQ — Backend API Reference', '');
  out.push(`> **Version ${VERSION}** · Base URL \`${BASE_URL}\` · ${modules.length} modules · **${totalEndpoints} endpoints** · JSON over HTTPS`, '');
  out.push('Written for: **backend engineers implementing the Phase 2 REST API** for the AttendanceIQ frontend (React + Vite). Every endpoint below replaces a method of the mock service layer in `src/services/mock/`, so the frontend keeps its page components and hooks unchanged.', '');
  out.push('## Package contents', '');
  out.push(table(['File', 'What it is'], [
    ['`README.md` (this file)', 'Conventions, auth, errors, permissions, data models and the full endpoint index'],
    ['`modules/01-…17-*.md`', 'One file per module: purpose, access, parameters, request payloads and **every response scenario** as JSON'],
    ['`openapi.yaml`', 'OpenAPI 3.0.3 — import into Swagger UI / Redoc / code generators'],
    ['`AttendanceIQ.postman_collection.json`', 'Postman collection with example requests **and saved responses for every scenario**; the Login request stores the token automatically'],
    ['`generator/`', 'The single-source spec these files are generated from. Edit the spec, then run `node docs/api/generator/build.mjs`'],
  ]));
  out.push('## Contents', '');
  out.push('1. [Conventions](#conventions) · 2. [Authentication](#authentication) · 3. [Roles & scope](#roles--scope) · 4. [Common errors](#common-errors) · 5. [Enumerations](#enumerations) · 6. [Data models](#data-models) · 7. [Endpoint index](#endpoint-index) · 8. [Frontend integration notes](#frontend-integration-notes)', '');

  out.push('## Conventions', '');
  out.push(`### Request / response basics

- **Base URL:** \`${BASE_URL}\` (matches \`VITE_API_BASE_URL\`). All paths in this document are relative to it.
- **Format:** \`application/json; charset=utf-8\` (except multipart logo uploads and report downloads). Field names are \`camelCase\`.
- **IDs** are opaque strings (examples use readable ids like \`company-001\`; the server may use UUIDs). Never parse them.
- **Dates:** \`YYYY-MM-DD\`. **Times of day:** \`HH:mm\` (24 h). **Timestamps:** ISO-8601 UTC, e.g. \`2026-09-20T09:30:00Z\`.
- **Punch times** (\`punchTime\`, \`firstPunchIn\`, \`lastPunchOut\`) are **wall-clock time in the sub-company's timezone**, ISO-8601 *without* an offset (\`2026-09-19T08:55:00\`). The frontend renders them as-is. Store UTC, convert on output.
- **Request id:** every response carries \`X-Request-Id\`; error bodies repeat it as \`requestId\`.
- **Idempotency:** \`PATCH …/status\` sets an explicit status (safe to retry). Device punch ingest is de-duplicated by \`(device, employeeCode, punchTime)\`.

### Envelopes

Success (single resource / action):
\`\`\`json
${json(F.ok({ id: 'company-001', name: 'Nexus Technologies Pvt Ltd' }, 'Optional human-readable message'))}
\`\`\`

Success (list):
\`\`\`json
${json(F.list([{ id: 'company-001' }, { id: 'company-002' }], { page: 1, pageSize: 10, total: 25 }))}
\`\`\`

Error:
\`\`\`json
${json(F.validation(['email', 'Enter a valid email address']))}
\`\`\`

The frontend's \`ApiError\` reads \`message\`, \`code\` and the HTTP status (see \`normalizeApiError\` in \`src/lib/axios.ts\`), so \`message\` must always be a user-presentable sentence.

### Pagination, search, sorting

| Query | Meaning |
|---|---|
| \`page\` | 1-based. Default 1 |
| \`pageSize\` | Default 10, **max 200** (pickers load a whole branch at once) |
| \`search\` | Case-insensitive contains-match on the fields listed per endpoint |
| \`sortBy\` / \`sortOrder\` | \`asc\` (default) or \`desc\`; allowed \`sortBy\` values are listed per endpoint |

Lists that are naturally small and always shown whole (unallocated devices, allocation history, a company's sub-companies) return \`data\` without \`pagination\`.
`, '');

  out.push('## Authentication', '');
  out.push(`- \`POST /auth/login\` returns a **JWT access token** (1 h) and a **refresh token** (7 d, single-use, rotated).
- Send \`Authorization: Bearer <accessToken>\` on every request except the public ones (\`/auth/login\`, \`/auth/refresh\`, \`/auth/forgot-password\`, \`/auth/reset-password\`, \`/health\`).
- On \`401 TOKEN_EXPIRED\` the client calls \`POST /auth/refresh\` once and retries; any other 401 means "sign in again". **Never use 401 for business errors** (e.g. a wrong current password is \`422\`) — the axios interceptor treats every 401 as an expired session and redirects to \`/login\`.
- Token claims: \`sub\` (user id), \`role\`, \`companyId\`, \`subCompanyId\`, \`iat\`, \`exp\`. **Scope is always derived from the token, never trusted from request parameters** (see below).
- The **Device Gateway** uses \`X-Device-Serial\` + \`X-Device-Key\` instead of a JWT.
`, '');

  out.push('## Roles & scope', '');
  out.push(`There are three roles. **Companies own sub-companies; sub-companies own employees** — a company never has employees directly.

| Role | Sees | Typical actions |
|---|---|---|
| **SUPER_ADMIN** | The whole platform | Companies, sub-companies, users, devices (allocate / re-allocate / deallocate), audit logs. Read-only on employees and attendance. |
| **ADMIN** | **Every sub-company of their own company** (can narrow to one with \`subCompanyId\`) | Full edit of employees, shifts, holidays, departments, attendance and settings across all their sub-companies; manages HR users; approves requests; read-only device view. |
| **HR** | **One sub-company** (their own) | Employees, shifts, holidays, attendance (incl. manual entries), reports, requests. |

**Scope enforcement (all endpoints):**
1. The server takes \`companyId\` / \`subCompanyId\` from the token for Admin/HR and **overrides or validates** any value the client sends.
2. Filter params outside scope → \`403 FORBIDDEN\` (explicit filter) or silently narrowed to scope (no filter).
3. Fetching a single record outside scope → \`404 NOT_FOUND\` (the API never reveals that it exists).
4. Writes outside scope → \`403 FORBIDDEN\`.

### Access matrix (derived from the endpoint list)

${rbacMatrix()}
`, '');

  out.push('## Common errors', '');
  out.push('Every endpoint can return these in addition to the scenarios listed on it.', '');
  out.push(table(['HTTP', 'code', 'When'], COMMON_ERRORS.map(([s, c, w]) => [String(s), `\`${c}\``, w])));
  out.push('### Example bodies', '');
  for (const [s, c, , body] of COMMON_ERRORS) {
    out.push(`**${s} ${c}**`, '', '```json', json(body), '```', '');
  }

  out.push('## Enumerations', '');
  out.push(table(['Name', 'Values'], [
    ['Role', '`SUPER_ADMIN`, `ADMIN`, `HR`'],
    ['Status (company, sub-company, department, user, employee, shift, holiday)', '`ACTIVE`, `INACTIVE`'],
    ['Employee type', '`FULL_TIME`, `PART_TIME`, `CONTRACT`, `INTERN`'],
    ['Weekday', '`MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY`, `SATURDAY`, `SUNDAY`'],
    ['Attendance status', '`PRESENT`, `ABSENT`, `LATE`, `EARLY_OUT`, `INCOMPLETE`, `HOLIDAY`, `WEEKLY_OFF`, `ON_LEAVE`'],
    ['Punch type', '`IN`, `OUT`'],
    ['Manual source', '`MANUAL`, `REGULARIZATION`, `MISSING_PUNCH`'],
    ['Device status', '`ONLINE`, `OFFLINE`, `UNALLOCATED`, `MAINTENANCE`'],
    ['Request type', '`REGULARIZATION`, `MISSING_PUNCH`, `LEAVE`'],
    ['Request status', '`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`'],
    ['Leave type', '`CASUAL`, `SICK`, `EARNED`, `UNPAID`'],
    ['Report type / format', '`DAILY`, `MONTHLY`, `EMPLOYEE`, `MULTI_EMPLOYEE` / `EXCEL`, `PDF`, `CSV`'],
    ['Activity action', '`CREATED`, `UPDATED`, `DELETED`, `ACTIVATED`, `DEACTIVATED`, `ALLOCATED`, `DEALLOCATED`, `APPROVED`, `REJECTED`, `CANCELLED`'],
  ]));

  out.push('## Data models', '');
  out.push('Shapes returned by the API. The `data` in every success example in the module files is one of these (or a list of them).', '');
  out.push(modelsMd());

  out.push('## Endpoint index', '');
  out.push(`**${totalEndpoints} endpoints** across ${modules.length} modules. Click a module for full payloads and response scenarios.`, '');
  out.push(indexMd());

  out.push('## Frontend integration notes', '');
  out.push(`### Swapping the mock layer

Each mock service maps to a module; the hooks and pages do not change — only the service bodies (\`sleep()\` + in-memory arrays → \`apiClient\` calls).

| Mock service (\`src/services/mock/\`) | Module |
|---|---|
| \`auth.service.ts\` (in \`features/auth/services\`), profile page | 1 · Auth & Profile |
| \`company.service.ts\` (companies) | 2 · Companies |
| \`company.service.ts\` (sub-companies) | 3 · Sub-Companies |
| \`department.service.ts\` | 4 · Departments |
| \`user.service.ts\` | 5 · Users |
| \`employee.service.ts\` | 6 · Employees |
| \`shift.service.ts\` | 7 · Shifts |
| \`holiday.service.ts\` | 8 · Holidays |
| \`attendance.service.ts\`, \`manualAttendance.service.ts\`, \`attendanceEngine.ts\`/\`attendanceHistory.ts\`/\`attendanceStore.ts\` | 9 · Attendance (the engine files become **server-side** logic) |
| \`request.service.ts\` | 10 · Requests & Leaves (UI currently commented out) |
| \`device.service.ts\` | 11 · Devices |
| *(none — device firmware)* | 12 · Device Gateway |
| \`settings.service.ts\` | 13 · Settings |
| \`report.service.ts\` | 14 · Reports |
| \`dashboard.service.ts\` | 15 · Dashboards |
| \`activityLog.service.ts\` | 16 · Activity Logs |

### Changes the frontend needs

1. **Unwrap the envelope** in the service layer: \`res.data.data\` for single resources; for lists map \`{ data, pagination }\` to the existing \`PaginatedResponse\` (\`{ data, total, page, pageSize, totalPages }\`).
2. **Token refresh:** extend the axios 401 interceptor to try \`POST /auth/refresh\` on \`TOKEN_EXPIRED\` before clearing storage and redirecting.
3. **Status toggles:** hooks call \`toggleXStatus(id)\`. Read the current status (already in the cached row) and send the opposite to \`PATCH …/status\`.
4. **Daily attendance pagination:** the page currently slices the full list client-side. Pass \`page\`/\`pageSize\` and read \`pagination.total\`; \`stats\` already covers the whole result.
5. **Monthly summary:** \`summarizeMonthlyAttendance()\` is computed client-side today; use \`data.summary\` from \`/attendance/monthly\`.
6. **Remove mock-only code:** \`logActivity()\` calls and the actor sync in \`authStore\` (the backend writes the audit log), default password \`password123\`, \`getXSnapshot()\` helpers, and the in-memory attendance engine once the server calculates attendance.
7. **Scope params:** keep sending \`subCompanyId\` from the Admin topbar selector; HR/Admin \`companyId\` is optional (the token already fixes it).
8. **Reports & uploads:** replace the simulated 1.2–1.5 s exports with \`POST /reports/generate\` then \`GET /reports/{id}/download\` (\`responseType: 'blob'\`); wire "Upload Logo" to the logo endpoints.
9. **Requests / Leaves:** UI is commented out; nothing to change until it is re-enabled.
10. **Methods that map onto an existing endpoint** (no dedicated route): \`employeeService.getEmployeesBySubCompany(id)\` → \`GET /employees?subCompanyId=<id>&status=ACTIVE&pageSize=200\`; the profile page's \`useUser(ownId)\` → \`GET /profile\`; \`reportService.exportDailyReport / exportMonthlyReport\` → \`POST /reports/generate\` with \`type\` DAILY / MONTHLY.

### Business rules the server must own

- **Attendance is calculated, never posted.** Recalculate an employee-day whenever a punch, manual entry, shift, holiday, employee shift/weekly-off, approved leave, or attendance setting changes (see the Attendance module for status rules).
- **Manual entries add to device punches**, never replace them; deleting one reverts the day.
- **Derived counts** (\`employeeCount\`, \`deviceCount\`, \`subCompanyCount\`, \`hrCount\`) are computed, not stored.
- **Audit log** is written by the server for every write, with actor, IP and company.
- **Deactivation cascades logically:** inactive company/sub-company blocks sign-in and punch processing; data is retained.
`, '');
  return out.join('\n');
}

// ── OpenAPI ─────────────────────────────────────────────────────────────────
function opId(e, seen) {
  const words = e.path.replace(/[{}]/g, '').split('/').filter(Boolean).map((w) => w.replace(/(^|[-_])(\w)/g, (_, __, c) => c.toUpperCase()));
  let id = e.method.toLowerCase() + words.join('');
  id = id.replace(/[^A-Za-z0-9]/g, '');
  let n = 1;
  let unique = id;
  while (seen.has(unique)) { n += 1; unique = `${id}${n}`; }
  seen.add(unique);
  return unique;
}

function buildOpenApi() {
  const paths = {};
  const seen = new Set();
  const schemas = {
    Pagination: { type: 'object', properties: { page: { type: 'integer' }, pageSize: { type: 'integer' }, total: { type: 'integer' }, totalPages: { type: 'integer' } } },
    SuccessEnvelope: { type: 'object', required: ['success'], properties: { success: { type: 'boolean', enum: [true] }, message: { type: 'string' }, data: {} } },
    ErrorEnvelope: { type: 'object', required: ['success', 'code', 'message'], properties: { success: { type: 'boolean', enum: [false] }, code: { type: 'string' }, message: { type: 'string' }, errors: { type: 'array', items: { type: 'object', properties: { field: { type: 'string' }, message: { type: 'string' } } } }, requestId: { type: 'string' } } },
  };
  for (const mdl of models) schemas[mdl.name] = { ...objectSchema(mdl.fields.map(([n, t, d]) => [n, t, false, d]), false), description: mdl.description };

  const common = {
    Unauthorized: { description: 'Missing / invalid / expired token', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' }, example: F.err('UNAUTHENTICATED', 'Authentication required') } } },
    Forbidden: { description: 'Role or scope not allowed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' }, example: F.forbidden() } } },
    TooManyRequests: { description: 'Rate limited', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' }, example: F.err('RATE_LIMITED', 'Too many requests. Try again later.') } } },
    ServerError: { description: 'Unexpected error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' }, example: F.err('INTERNAL_ERROR', 'Something went wrong on our side') } } },
  };

  for (const m of modules) {
    for (const e of m.endpoints) {
      const op = { tags: [m.title], summary: e.title, description: [e.purpose, e.usedBy ? `**Used by:** ${e.usedBy}` : '', `**Access:** ${rolesText(e)}`, ...(e.notes ?? []).map((x) => `- ${x}`)].filter(Boolean).join('\n\n'), operationId: opId(e, seen) };

      const params = [
        ...e.pathParams.map(([name, type, description]) => ({ name, in: 'path', required: true, description, schema: schemaFor(type) })),
        ...e.query.map(([name, type, required, description]) => ({ name, in: 'query', required: !!required, description, schema: schemaFor(type) })),
      ];
      if (e.roles.includes('DEVICE')) {
        params.push({ name: 'X-Device-Serial', in: 'header', required: true, schema: { type: 'string' }, description: 'Device serial number' }, { name: 'X-Device-Key', in: 'header', required: true, schema: { type: 'string' }, description: 'Device API key' });
      }
      if (params.length) op.parameters = params;

      if (e.body) {
        const ct = e.body.contentType ?? 'application/json';
        op.requestBody = { required: true, content: { [ct]: { schema: objectSchema(e.body.fields), example: e.body.example } } };
      }

      const byStatus = new Map();
      for (const r of e.responses) {
        if (!byStatus.has(r.status)) byStatus.set(r.status, []);
        byStatus.get(r.status).push(r);
      }
      op.responses = {};
      for (const [status, items] of byStatus) {
        const isBinary = typeof items[0].body === 'string';
        const isErr = status >= 400;
        const content = isBinary
          ? { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } }
          : { 'application/json': { schema: isErr ? { $ref: '#/components/schemas/ErrorEnvelope' } : (e.path === '/health' ? { type: 'object' } : { $ref: '#/components/schemas/SuccessEnvelope' }), examples: Object.fromEntries(items.map((r, i) => [slug(r.scenario).slice(0, 60) || `example-${i + 1}`, { summary: r.scenario, value: r.body }])) } };
        op.responses[String(status)] = { description: items.map((r) => r.scenario).join(' / '), content };
      }
      if (isAuthed(e)) {
        op.security = [{ bearerAuth: [] }];
        if (!op.responses['401']) op.responses['401'] = { $ref: '#/components/responses/Unauthorized' };
        if (!op.responses['403']) op.responses['403'] = { $ref: '#/components/responses/Forbidden' };
        op.responses['429'] ??= { $ref: '#/components/responses/TooManyRequests' };
        op.responses['500'] = { $ref: '#/components/responses/ServerError' };
      } else if (e.roles.includes('DEVICE')) {
        op.security = [{ deviceKey: [] }];
        op.responses['500'] = { $ref: '#/components/responses/ServerError' };
      } else {
        op.security = [];
        op.responses['429'] ??= { $ref: '#/components/responses/TooManyRequests' };
        op.responses['500'] = { $ref: '#/components/responses/ServerError' };
      }

      const p = e.path;
      paths[p] ??= {};
      paths[p][e.method.toLowerCase()] = op;
    }
  }

  return {
    openapi: '3.0.3',
    info: {
      title: 'AttendanceIQ API',
      version: VERSION,
      description: 'Backend API for the AttendanceIQ punch-in / punch-out attendance platform. See README.md for conventions, roles & scope, error model and data models.',
    },
    servers: [{ url: BASE_URL, description: 'Local development' }],
    tags: modules.map((m) => ({ name: m.title, description: m.description.split('\n')[0] })),
    security: [{ bearerAuth: [] }],
    paths,
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        deviceKey: { type: 'apiKey', in: 'header', name: 'X-Device-Key', description: 'Also send X-Device-Serial.' },
      },
      responses: common,
      schemas,
    },
  };
}

// ── Postman ─────────────────────────────────────────────────────────────────
const VARS = { baseUrl: BASE_URL, token: '', refreshToken: '', companyId: 'company-001', subCompanyId: 'sub-001', userId: 'user-004', employeeId: 'emp-001', shiftId: 'shift-001', holidayId: 'hol-002', departmentId: 'dept-company-001-1', deviceId: 'device-001', requestId: 'req-0001', reportId: 'rpt_01J8Z3K4M5', logId: 'log-0016', date: '2026-09-19', deviceSerial: 'BMP7K-20240301-001', deviceKey: 'dk_replace_me' };

function sampleValue(type) {
  const t = type.replace(/\?$/, '');
  if (t === 'int') return '1';
  if (t === 'bool') return 'true';
  if (t === 'date') return '2026-09-20';
  if (t.startsWith('enum:')) return t.slice(5).split('|')[0];
  return '';
}

function buildPostman() {
  const item = modules.map((m) => ({
    name: `${modNo.get(m.id)}. ${m.title}`,
    description: m.description,
    item: m.endpoints.map((e) => {
      const rawPath = e.path.replace(/\{(\w+)\}/g, ':$1');
      const req = {
        name: `${e.title}`,
        request: {
          method: e.method,
          header: [],
          url: {
            raw: `{{baseUrl}}${rawPath}`,
            host: ['{{baseUrl}}'],
            path: rawPath.split('/').filter(Boolean),
            variable: e.pathParams.map(([name, , description]) => ({ key: name, value: `{{${VARS[name] !== undefined ? name : 'date'}}}`, description })),
            query: e.query.map(([key, type, required, description]) => ({ key, value: sampleValue(type), description, disabled: !required })),
          },
          description: [e.purpose, `Access: ${rolesText(e)}`].join('\n\n'),
        },
        response: e.responses.map((r) => ({
          name: `${r.status} — ${r.scenario}`,
          originalRequest: undefined,
          status: STATUS_TEXT[r.status] ?? '',
          code: r.status,
          _postman_previewlanguage: typeof r.body === 'string' ? 'text' : 'json',
          header: [{ key: 'Content-Type', value: typeof r.body === 'string' ? 'application/octet-stream' : 'application/json' }],
          body: typeof r.body === 'string' ? r.body : json(r.body),
        })),
      };
      if (e.body) {
        if ((e.body.contentType ?? '').startsWith('multipart')) {
          req.request.body = { mode: 'formdata', formdata: [{ key: 'file', type: 'file', src: [] }] };
        } else {
          req.request.header.push({ key: 'Content-Type', value: 'application/json' });
          req.request.body = { mode: 'raw', raw: json(e.body.example), options: { raw: { language: 'json' } } };
        }
      }
      if (e.roles.includes('PUBLIC')) req.request.auth = { type: 'noauth' };
      if (e.roles.includes('DEVICE')) {
        req.request.auth = { type: 'noauth' };
        req.request.header.push({ key: 'X-Device-Serial', value: '{{deviceSerial}}' }, { key: 'X-Device-Key', value: '{{deviceKey}}' });
      }
      if (e.path === '/auth/login') {
        req.event = [{ listen: 'test', script: { type: 'text/javascript', exec: ['const res = pm.response.json();', 'if (res.success && res.data) {', "  pm.collectionVariables.set('token', res.data.token);", "  pm.collectionVariables.set('refreshToken', res.data.refreshToken);", '}'] } }];
      }
      if (e.path === '/auth/refresh') {
        req.request.body.raw = '{\n  "refreshToken": "{{refreshToken}}"\n}';
        req.event = [{ listen: 'test', script: { type: 'text/javascript', exec: ['const res = pm.response.json();', 'if (res.success && res.data) {', "  pm.collectionVariables.set('token', res.data.token);", "  pm.collectionVariables.set('refreshToken', res.data.refreshToken);", '}'] } }];
      }
      return req;
    }),
  }));

  return {
    info: {
      name: 'AttendanceIQ API',
      description: `Backend API v${VERSION}. Run **1. Authentication & Profile → Sign in** first; it stores the access token in the \`token\` collection variable. Every request then sends it as a Bearer token. Each request has saved example responses for all documented scenarios.`,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{token}}', type: 'string' }] },
    variable: Object.entries(VARS).map(([key, value]) => ({ key, value })),
    item,
  };
}

// ── Write everything ────────────────────────────────────────────────────────
rmSync(join(OUT, 'modules'), { recursive: true, force: true });
mkdirSync(join(OUT, 'modules'), { recursive: true });
writeFileSync(join(OUT, 'README.md'), readmeMd());
for (const m of modules) writeFileSync(join(OUT, 'modules', modFile(m)), moduleMd(m));
const openapi = buildOpenApi();
writeFileSync(join(OUT, 'openapi.yaml'), `${toYaml(openapi)}\n`);
writeFileSync(join(OUT, 'openapi.json'), `${json(openapi)}\n`);
writeFileSync(join(OUT, 'AttendanceIQ.postman_collection.json'), `${json(buildPostman())}\n`);

const scenarios = modules.reduce((s, m) => s + m.endpoints.reduce((a, e) => a + e.responses.length, 0), 0);
console.log(`Generated: ${modules.length} modules, ${totalEndpoints} endpoints, ${scenarios} response scenarios, ${models.length} models`);
