# AttendanceIQ — Backend API Reference

> **Version 1.0.0** · Base URL `http://localhost:8000/api/v1` · 17 modules · **99 endpoints** · JSON over HTTPS

Written for: **backend engineers implementing the Phase 2 REST API** for the AttendanceIQ frontend (React + Vite). Every endpoint below replaces a method of the mock service layer in `src/services/mock/`, so the frontend keeps its page components and hooks unchanged.

## Package contents

| File | What it is |
|---|---|
| `README.md` (this file) | Conventions, auth, errors, permissions, data models and the full endpoint index |
| `modules/01-…17-*.md` | One file per module: purpose, access, parameters, request payloads and **every response scenario** as JSON |
| `openapi.yaml` | OpenAPI 3.0.3 — import into Swagger UI / Redoc / code generators |
| `AttendanceIQ.postman_collection.json` | Postman collection with example requests **and saved responses for every scenario**; the Login request stores the token automatically |
| `generator/` | The single-source spec these files are generated from. Edit the spec, then run `node docs/api/generator/build.mjs` |

## Contents

1. [Conventions](#conventions) · 2. [Authentication](#authentication) · 3. [Roles & scope](#roles--scope) · 4. [Common errors](#common-errors) · 5. [Enumerations](#enumerations) · 6. [Data models](#data-models) · 7. [Endpoint index](#endpoint-index) · 8. [Frontend integration notes](#frontend-integration-notes)

## Conventions

### Request / response basics

- **Base URL:** `http://localhost:8000/api/v1` (matches `VITE_API_BASE_URL`). All paths in this document are relative to it.
- **Format:** `application/json; charset=utf-8` (except multipart logo uploads and report downloads). Field names are `camelCase`.
- **IDs** are opaque strings (examples use readable ids like `company-001`; the server may use UUIDs). Never parse them.
- **Dates:** `YYYY-MM-DD`. **Times of day:** `HH:mm` (24 h). **Timestamps:** ISO-8601 UTC, e.g. `2026-09-20T09:30:00Z`.
- **Punch times** (`punchTime`, `firstPunchIn`, `lastPunchOut`) are **wall-clock time in the sub-company's timezone**, ISO-8601 *without* an offset (`2026-09-19T08:55:00`). The frontend renders them as-is. Store UTC, convert on output.
- **Request id:** every response carries `X-Request-Id`; error bodies repeat it as `requestId`.
- **Idempotency:** `PATCH …/status` sets an explicit status (safe to retry). Device punch ingest is de-duplicated by `(device, employeeCode, punchTime)`.

### Envelopes

Success (single resource / action):
```json
{
  "success": true,
  "message": "Optional human-readable message",
  "data": {
    "id": "company-001",
    "name": "Nexus Technologies Pvt Ltd"
  }
}
```

Success (list):
```json
{
  "success": true,
  "data": [
    {
      "id": "company-001"
    },
    {
      "id": "company-002"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

Error:
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "errors": [
    {
      "field": "email",
      "message": "Enter a valid email address"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

The frontend's `ApiError` reads `message`, `code` and the HTTP status (see `normalizeApiError` in `src/lib/axios.ts`), so `message` must always be a user-presentable sentence.

### Pagination, search, sorting

| Query | Meaning |
|---|---|
| `page` | 1-based. Default 1 |
| `pageSize` | Default 10, **max 200** (pickers load a whole branch at once) |
| `search` | Case-insensitive contains-match on the fields listed per endpoint |
| `sortBy` / `sortOrder` | `asc` (default) or `desc`; allowed `sortBy` values are listed per endpoint |

Lists that are naturally small and always shown whole (unallocated devices, allocation history, a company's sub-companies) return `data` without `pagination`.


## Authentication

- `POST /auth/login` returns a **JWT access token** (1 h) and a **refresh token** (7 d, single-use, rotated).
- Send `Authorization: Bearer <accessToken>` on every request except the public ones (`/auth/login`, `/auth/refresh`, `/auth/forgot-password`, `/auth/reset-password`, `/health`).
- On `401 TOKEN_EXPIRED` the client calls `POST /auth/refresh` once and retries; any other 401 means "sign in again". **Never use 401 for business errors** (e.g. a wrong current password is `422`) — the axios interceptor treats every 401 as an expired session and redirects to `/login`.
- Token claims: `sub` (user id), `role`, `companyId`, `subCompanyId`, `iat`, `exp`. **Scope is always derived from the token, never trusted from request parameters** (see below).
- The **Device Gateway** uses `X-Device-Serial` + `X-Device-Key` instead of a JWT.


## Roles & scope

There are three roles. **Companies own sub-companies; sub-companies own employees** — a company never has employees directly.

| Role | Sees | Typical actions |
|---|---|---|
| **SUPER_ADMIN** | The whole platform | Companies, sub-companies, users, devices (allocate / re-allocate / deallocate), audit logs. Read-only on employees and attendance. |
| **ADMIN** | **Every sub-company of their own company** (can narrow to one with `subCompanyId`) | Full edit of employees, shifts, holidays, departments, attendance and settings across all their sub-companies; manages HR users; approves requests; read-only device view. |
| **HR** | **One sub-company** (their own) | Employees, shifts, holidays, attendance (incl. manual entries), reports, requests. |

**Scope enforcement (all endpoints):**
1. The server takes `companyId` / `subCompanyId` from the token for Admin/HR and **overrides or validates** any value the client sends.
2. Filter params outside scope → `403 FORBIDDEN` (explicit filter) or silently narrowed to scope (no filter).
3. Fetching a single record outside scope → `404 NOT_FOUND` (the API never reveals that it exists).
4. Writes outside scope → `403 FORBIDDEN`.

### Access matrix (derived from the endpoint list)

| Module | Super Admin | Admin | HR |
|---|---|---|---|
| Authentication & Profile | **Read + Write** | **Read + Write** | **Read + Write** |
| Companies | **Read + Write** | **Read + Write** | — |
| Sub-Companies | **Read + Write** | **Read + Write** | **Read + Write** |
| Departments | Read | **Read + Write** | **Read + Write** |
| Users | **Read + Write** | **Read + Write** | — |
| Employees | Read | **Read + Write** | **Read + Write** |
| Shifts | Read | **Read + Write** | **Read + Write** |
| Holidays | Read | **Read + Write** | **Read + Write** |
| Attendance | Read | **Read + Write** | **Read + Write** |
| Requests & Leaves | Read | **Read + Write** | **Read + Write** |
| Devices | **Read + Write** | Read | — |
| Configuration — Attendance Settings | Read | **Read + Write** | **Read + Write** |
| Reports & Exports | — | **Read + Write** | **Read + Write** |
| Dashboards | Read | Read | Read |
| Activity Logs | Read | — | — |



## Common errors

Every endpoint can return these in addition to the scenarios listed on it.

| HTTP | code | When |
|---|---|---|
| 400 | `BAD_REQUEST` | Malformed JSON or an unsupported request |
| 401 | `UNAUTHENTICATED` | No / invalid bearer token |
| 401 | `TOKEN_EXPIRED` | Access token expired — call `/auth/refresh` |
| 403 | `FORBIDDEN` | Authenticated but not allowed (role, or outside your company / sub-company scope) |
| 404 | `NOT_FOUND` | Resource missing **or hidden by scope** (the API never confirms that an out-of-scope record exists) |
| 409 | `CONFLICT / DUPLICATE_ENTRY / *_IN_USE` | Unique constraint or a business conflict |
| 422 | `VALIDATION_ERROR` | Field-level validation failed — `errors[]` lists every problem at once |
| 422 | `BUSINESS_RULE_VIOLATION` | Well-formed request that breaks a domain rule |
| 429 | `RATE_LIMITED` | Too many requests. Honour `Retry-After` / `retryAfterSeconds` |
| 500 | `INTERNAL_ERROR` | Unexpected server error. Quote `requestId` to support |
| 503 | `SERVICE_UNAVAILABLE` | Dependency down / maintenance |

### Example bodies

**400 BAD_REQUEST**

```json
{
  "success": false,
  "code": "BAD_REQUEST",
  "message": "Malformed JSON in request body",
  "requestId": "req_8f3c2a91"
}
```

**401 UNAUTHENTICATED**

```json
{
  "success": false,
  "code": "UNAUTHENTICATED",
  "message": "Authentication required",
  "requestId": "req_8f3c2a91"
}
```

**401 TOKEN_EXPIRED**

```json
{
  "success": false,
  "code": "TOKEN_EXPIRED",
  "message": "Access token has expired",
  "requestId": "req_8f3c2a91"
}
```

**403 FORBIDDEN**

```json
{
  "success": false,
  "code": "FORBIDDEN",
  "message": "You do not have permission to perform this action",
  "requestId": "req_8f3c2a91"
}
```

**404 NOT_FOUND**

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Employee not found",
  "requestId": "req_8f3c2a91"
}
```

**409 CONFLICT / DUPLICATE_ENTRY / *_IN_USE**

```json
{
  "success": false,
  "code": "DUPLICATE_ENTRY",
  "message": "A company with code \"VRTXIN\" already exists",
  "field": "code",
  "requestId": "req_8f3c2a91"
}
```

**422 VALIDATION_ERROR**

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "errors": [
    {
      "field": "email",
      "message": "Enter a valid email address"
    },
    {
      "field": "phone",
      "message": "Phone required"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

**422 BUSINESS_RULE_VIOLATION**

```json
{
  "success": false,
  "code": "BUSINESS_RULE_VIOLATION",
  "message": "Cannot enter attendance for a future date",
  "requestId": "req_8f3c2a91"
}
```

**429 RATE_LIMITED**

```json
{
  "success": false,
  "code": "RATE_LIMITED",
  "message": "Too many requests. Try again later.",
  "retryAfterSeconds": 60,
  "requestId": "req_8f3c2a91"
}
```

**500 INTERNAL_ERROR**

```json
{
  "success": false,
  "code": "INTERNAL_ERROR",
  "message": "Something went wrong on our side",
  "requestId": "req_8f3c2a91"
}
```

**503 SERVICE_UNAVAILABLE**

```json
{
  "success": false,
  "code": "SERVICE_UNAVAILABLE",
  "message": "Service temporarily unavailable",
  "requestId": "req_8f3c2a91"
}
```

## Enumerations

| Name | Values |
|---|---|
| Role | `SUPER_ADMIN`, `ADMIN`, `HR` |
| Status (company, sub-company, department, user, employee, shift, holiday) | `ACTIVE`, `INACTIVE` |
| Employee type | `FULL_TIME`, `PART_TIME`, `CONTRACT`, `INTERN` |
| Weekday | `MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY`, `SATURDAY`, `SUNDAY` |
| Attendance status | `PRESENT`, `ABSENT`, `LATE`, `EARLY_OUT`, `INCOMPLETE`, `HOLIDAY`, `WEEKLY_OFF`, `ON_LEAVE` |
| Punch type | `IN`, `OUT` |
| Manual source | `MANUAL`, `REGULARIZATION`, `MISSING_PUNCH` |
| Device status | `ONLINE`, `OFFLINE`, `UNALLOCATED`, `MAINTENANCE` |
| Request type | `REGULARIZATION`, `MISSING_PUNCH`, `LEAVE` |
| Request status | `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED` |
| Leave type | `CASUAL`, `SICK`, `EARNED`, `UNPAID` |
| Report type / format | `DAILY`, `MONTHLY`, `EMPLOYEE`, `MULTI_EMPLOYEE` / `EXCEL`, `PDF`, `CSV` |
| Activity action | `CREATED`, `UPDATED`, `DELETED`, `ACTIVATED`, `DEACTIVATED`, `ALLOCATED`, `DEALLOCATED`, `APPROVED`, `REJECTED`, `CANCELLED` |

## Data models

Shapes returned by the API. The `data` in every success example in the module files is one of these (or a list of them).

### Company

A tenant on the platform. Companies own sub-companies; **employees belong to sub-companies, never directly to a company.** Counts are derived by the server, never stored.

| Field | Type | Description |
|---|---|---|
| `id` | string | Opaque unique id. |
| `name` | string | Legal name. |
| `code` | string | Short unique code, 2–10 chars. |
| `registrationNumber` | string | Company registration / CIN number. |
| `email` | email | Primary contact email. |
| `phone` | string | Primary contact phone. |
| `address` | string | Street address. |
| `city` | string |  |
| `state` | string |  |
| `country` | string |  |
| `logoUrl` | string \| null | Public URL of the uploaded logo, or `null`. |
| `status` | `ACTIVE` \| `INACTIVE` | Inactive companies cannot sign in. |
| `subCompanyCount` | integer | Derived: number of sub-companies. |
| `deviceCount` | integer | Derived: devices currently allocated to the company. |
| `employeeCount` | integer | Derived: employees across all sub-companies. |
| `createdAt` | datetime (ISO-8601) |  |
| `updatedAt` | datetime (ISO-8601) |  |

```json
{
  "id": "company-001",
  "name": "Nexus Technologies Pvt Ltd",
  "code": "NXTECH",
  "registrationNumber": "CIN-U72200KL2010PTC024312",
  "email": "admin@nexustech.in",
  "phone": "+91-484-2345678",
  "address": "3rd Floor, Carnival Infopark, Kakkanad",
  "city": "Kochi",
  "state": "Kerala",
  "country": "India",
  "logoUrl": null,
  "status": "ACTIVE",
  "subCompanyCount": 3,
  "deviceCount": 8,
  "employeeCount": 25,
  "createdAt": "2022-03-15T09:00:00Z",
  "updatedAt": "2024-08-10T14:30:00Z"
}
```

### SubCompany

A branch / office of a company. Owns employees, shifts, holidays and device allocations. HR users are pinned to one sub-company.

| Field | Type | Description |
|---|---|---|
| `id` | string |  |
| `companyId` | string | Parent company id. |
| `companyName` | string | Denormalised parent name. |
| `name` | string |  |
| `code` | string | Unique code, 2+ chars. |
| `email` | email |  |
| `phone` | string |  |
| `address` | string |  |
| `city` | string |  |
| `state` | string |  |
| `country` | string |  |
| `logoUrl` | string \| null |  |
| `status` | `ACTIVE` \| `INACTIVE` |  |
| `employeeCount` | integer | Derived. |
| `deviceCount` | integer | Derived: devices allocated to this sub-company. |
| `hrCount` | integer | Derived: active HR users pinned to this sub-company. |
| `timezone` | string | IANA timezone. Attendance times are calculated and displayed in this zone. |
| `workingDays` | `MONDAY` \| `TUESDAY` \| `WEDNESDAY` \| `THURSDAY` \| `FRIDAY` \| `SATURDAY` \| `SUNDAY`[] | Working days of the week. |
| `createdAt` | datetime (ISO-8601) |  |
| `updatedAt` | datetime (ISO-8601) |  |

```json
{
  "id": "sub-002",
  "companyId": "company-001",
  "companyName": "Nexus Technologies Pvt Ltd",
  "name": "Nexus Bangalore",
  "code": "NXTECH-BLR",
  "email": "blr@nexustech.in",
  "phone": "+91-80-41234568",
  "address": "Prestige Tech Park, Marathahalli",
  "city": "Bengaluru",
  "state": "Karnataka",
  "country": "India",
  "logoUrl": null,
  "status": "ACTIVE",
  "employeeCount": 5,
  "deviceCount": 3,
  "hrCount": 1,
  "timezone": "Asia/Kolkata",
  "workingDays": [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY"
  ],
  "createdAt": "2022-05-10T09:00:00Z",
  "updatedAt": "2024-08-15T11:00:00Z"
}
```

### Department

Company-level lookup used to classify employees. Shared by all sub-companies of a company.

| Field | Type | Description |
|---|---|---|
| `id` | string |  |
| `name` | string | Unique within the company (case-insensitive). |
| `description` | string \| null |  |
| `status` | `ACTIVE` \| `INACTIVE` | Only ACTIVE departments are offered when creating employees. |
| `companyId` | string |  |
| `createdAt` | datetime (ISO-8601) |  |
| `updatedAt` | datetime (ISO-8601) |  |

```json
{
  "id": "dept-company-001-1",
  "name": "Engineering",
  "description": "Software engineering and QA",
  "status": "ACTIVE",
  "companyId": "company-001",
  "createdAt": "2023-01-05T09:00:00Z",
  "updatedAt": "2023-01-05T09:00:00Z"
}
```

### AuthUser

The signed-in user, as returned at login and by `GET /auth/me`. Kept in the frontend auth store.

| Field | Type | Description |
|---|---|---|
| `id` | string |  |
| `email` | email |  |
| `firstName` | string |  |
| `lastName` | string |  |
| `role` | `SUPER_ADMIN` \| `ADMIN` \| `HR` | Drives routing and permissions. |
| `companyId` | string \| null | Absent for SUPER_ADMIN. |
| `companyName` | string \| null |  |
| `subCompanyId` | string \| null | Only for HR. |
| `subCompanyName` | string \| null | Only for HR. |
| `avatarUrl` | string \| null |  |
| `isActive` | boolean |  |

```json
{
  "id": "user-004",
  "email": "hr@example.com",
  "firstName": "Divya",
  "lastName": "Menon",
  "role": "HR",
  "companyId": "company-001",
  "companyName": "Nexus Technologies Pvt Ltd",
  "subCompanyId": "sub-001",
  "subCompanyName": "Nexus Kochi HQ",
  "avatarUrl": null,
  "isActive": true
}
```

### User

A platform user account (Super Admin, Admin or HR). Admins are scoped to a company, HR to a sub-company.

| Field | Type | Description |
|---|---|---|
| `id` | string |  |
| `firstName` | string |  |
| `lastName` | string |  |
| `fullName` | string | Derived. |
| `email` | email | Unique, used to sign in. |
| `phone` | string |  |
| `username` | string | Unique, 3+ chars. |
| `role` | `SUPER_ADMIN` \| `ADMIN` \| `HR` |  |
| `companyId` | string \| null |  |
| `companyName` | string \| null |  |
| `subCompanyId` | string \| null | HR only. |
| `subCompanyName` | string \| null |  |
| `status` | `ACTIVE` \| `INACTIVE` |  |
| `lastLogin` | datetime (ISO-8601) \| null |  |
| `createdAt` | datetime (ISO-8601) |  |
| `updatedAt` | datetime (ISO-8601) |  |

```json
{
  "id": "user-004",
  "firstName": "Divya",
  "lastName": "Menon",
  "fullName": "Divya Menon",
  "email": "hr@example.com",
  "phone": "+91-9876543213",
  "username": "hr_kochi",
  "role": "HR",
  "companyId": "company-001",
  "companyName": "Nexus Technologies Pvt Ltd",
  "subCompanyId": "sub-001",
  "subCompanyName": "Nexus Kochi HQ",
  "status": "ACTIVE",
  "lastLogin": "2026-09-19T08:45:00Z",
  "createdAt": "2022-04-01T09:00:00Z",
  "updatedAt": "2026-09-19T08:45:00Z"
}
```

### Employee

A person whose attendance is tracked. Belongs to exactly one sub-company.

| Field | Type | Description |
|---|---|---|
| `id` | string |  |
| `employeeCode` | string | Unique within the company. Also the id enrolled on the biometric device. |
| `firstName` | string |  |
| `lastName` | string |  |
| `fullName` | string | Derived. |
| `email` | email |  |
| `phone` | string |  |
| `dateOfBirth` | date (`YYYY-MM-DD`) |  |
| `address` | string |  |
| `avatarUrl` | string \| null |  |
| `department` | string | Department name (from the company department list). |
| `designation` | string |  |
| `employeeType` | `FULL_TIME` \| `PART_TIME` \| `CONTRACT` \| `INTERN` |  |
| `joiningDate` | date (`YYYY-MM-DD`) | No attendance is generated before this date. |
| `status` | `ACTIVE` \| `INACTIVE` | Inactive employees are excluded from attendance and pickers. |
| `companyId` | string |  |
| `companyName` | string |  |
| `subCompanyId` | string |  |
| `subCompanyName` | string |  |
| `shiftId` | string \| null | Assigned shift; when null the sub-company default shift applies. |
| `shiftName` | string \| null |  |
| `weeklyOff` | `MONDAY` \| `TUESDAY` \| `WEDNESDAY` \| `THURSDAY` \| `FRIDAY` \| `SATURDAY` \| `SUNDAY`[] | Weekly off days for this employee. |
| `deviceId` | string \| null | Optional device-side user id, if it differs from `employeeCode`. |
| `createdAt` | datetime (ISO-8601) |  |
| `updatedAt` | datetime (ISO-8601) |  |

```json
{
  "id": "emp-001",
  "employeeCode": "EMP-1001",
  "firstName": "Rahul",
  "lastName": "Menon",
  "fullName": "Rahul Menon",
  "email": "rahul.menon@nexustech.in",
  "phone": "+91-9845001001",
  "dateOfBirth": "1992-05-15",
  "address": "12, Panampilly Nagar, Kochi",
  "avatarUrl": null,
  "department": "Engineering",
  "designation": "Senior Software Engineer",
  "employeeType": "FULL_TIME",
  "joiningDate": "2020-03-01",
  "status": "ACTIVE",
  "companyId": "company-001",
  "companyName": "Nexus Technologies Pvt Ltd",
  "subCompanyId": "sub-001",
  "subCompanyName": "Nexus Kochi HQ",
  "shiftId": "shift-001",
  "shiftName": "General Shift",
  "weeklyOff": [
    "SATURDAY",
    "SUNDAY"
  ],
  "deviceId": null,
  "createdAt": "2020-03-01T09:00:00Z",
  "updatedAt": "2024-01-15T09:00:00Z"
}
```

### Shift

A work schedule owned by a sub-company.

| Field | Type | Description |
|---|---|---|
| `id` | string |  |
| `name` | string |  |
| `startTime` | time (`HH:mm`) | 24h `HH:mm`. |
| `endTime` | time (`HH:mm`) | Earlier than `startTime` means the shift ends the next day. |
| `breakStartTime` | time (`HH:mm`) \| null |  |
| `breakEndTime` | time (`HH:mm`) \| null |  |
| `gracePeriodMinutes` | integer | Minutes after start before an arrival counts as late (0–60). |
| `isOvernight` | boolean | Derived: `endTime < startTime`. |
| `totalWorkMinutes` | integer | Derived: paid minutes (end − start − break). |
| `status` | `ACTIVE` \| `INACTIVE` |  |
| `companyId` | string |  |
| `subCompanyId` | string |  |
| `createdAt` | datetime (ISO-8601) |  |
| `updatedAt` | datetime (ISO-8601) |  |

```json
{
  "id": "shift-001",
  "name": "General Shift",
  "startTime": "09:00",
  "endTime": "18:00",
  "breakStartTime": "13:00",
  "breakEndTime": "14:00",
  "gracePeriodMinutes": 15,
  "isOvernight": false,
  "totalWorkMinutes": 480,
  "status": "ACTIVE",
  "companyId": "company-001",
  "subCompanyId": "sub-001",
  "createdAt": "2022-04-01T09:00:00Z",
  "updatedAt": "2022-04-01T09:00:00Z"
}
```

### Holiday

A public holiday for one sub-company. Attendance on holidays is `HOLIDAY`.

| Field | Type | Description |
|---|---|---|
| `id` | string |  |
| `name` | string |  |
| `date` | date (`YYYY-MM-DD`) | Unique per sub-company. |
| `description` | string \| null |  |
| `status` | `ACTIVE` \| `INACTIVE` | INACTIVE holidays are ignored by attendance. |
| `companyId` | string |  |
| `subCompanyId` | string |  |
| `year` | integer | Derived from `date`. |
| `createdAt` | datetime (ISO-8601) |  |
| `updatedAt` | datetime (ISO-8601) |  |

```json
{
  "id": "hol-002",
  "name": "Republic Day",
  "date": "2026-01-26",
  "description": "National holiday",
  "status": "ACTIVE",
  "companyId": "company-001",
  "subCompanyId": "sub-001",
  "year": 2026,
  "createdAt": "2025-12-01T09:00:00Z",
  "updatedAt": "2025-12-01T09:00:00Z"
}
```

### Device

A biometric punch device. Allocated to one sub-company at a time (or unallocated).

| Field | Type | Description |
|---|---|---|
| `id` | string |  |
| `deviceId` | string | Human-readable device code, unique. |
| `name` | string |  |
| `modelNumber` | string |  |
| `serialNumber` | string | Unique. Used by the device gateway to identify itself. |
| `macAddress` | string | `AA:BB:CC:DD:EE:FF`. |
| `firmwareVersion` | string |  |
| `ipAddress` | string |  |
| `status` | `ONLINE` \| `OFFLINE` \| `UNALLOCATED` \| `MAINTENANCE` | ONLINE/OFFLINE are derived from the last heartbeat; UNALLOCATED when no active allocation; MAINTENANCE is set manually. |
| `companyId` | string \| null | Current allocation. |
| `companyName` | string \| null |  |
| `subCompanyId` | string \| null |  |
| `subCompanyName` | string \| null |  |
| `lastSeen` | datetime (ISO-8601) \| null | Last heartbeat. |
| `lastPunch` | datetime (ISO-8601) \| null | Last punch received. |
| `allocatedAt` | datetime (ISO-8601) \| null |  |
| `createdAt` | datetime (ISO-8601) |  |
| `updatedAt` | datetime (ISO-8601) |  |

```json
{
  "id": "device-001",
  "deviceId": "DEV-NX-001",
  "name": "Kochi Main Entrance",
  "modelNumber": "BioMax Pro 7000",
  "serialNumber": "BMP7K-20240301-001",
  "macAddress": "00:1A:2B:3C:4D:01",
  "firmwareVersion": "3.4.2",
  "ipAddress": "192.168.10.11",
  "status": "ONLINE",
  "companyId": "company-001",
  "companyName": "Nexus Technologies Pvt Ltd",
  "subCompanyId": "sub-001",
  "subCompanyName": "Nexus Kochi HQ",
  "lastSeen": "2026-09-20T09:45:00Z",
  "lastPunch": "2026-09-20T09:42:00Z",
  "allocatedAt": "2022-04-01T09:00:00Z",
  "createdAt": "2022-03-25T09:00:00Z",
  "updatedAt": "2026-09-20T09:45:00Z"
}
```

### DeviceAllocation

One entry in a device's allocation history. Re-allocating or deallocating closes the active entry and keeps it.

| Field | Type | Description |
|---|---|---|
| `id` | string |  |
| `deviceId` | string |  |
| `deviceName` | string |  |
| `companyId` | string |  |
| `companyName` | string |  |
| `subCompanyId` | string |  |
| `subCompanyName` | string |  |
| `allocatedBy` | string | Display name of the user who allocated. |
| `allocatedAt` | datetime (ISO-8601) |  |
| `deallocatedAt` | datetime (ISO-8601) \| null |  |
| `deallocatedBy` | string \| null |  |
| `deallocationReason` | string \| null |  |
| `isActive` | boolean | Exactly one active allocation per allocated device. |
| `notes` | string \| null |  |

```json
{
  "id": "alloc-003",
  "deviceId": "device-004",
  "deviceName": "Bangalore Entry",
  "companyId": "company-001",
  "companyName": "Nexus Technologies Pvt Ltd",
  "subCompanyId": "sub-002",
  "subCompanyName": "Nexus Bangalore",
  "allocatedBy": "Arjun Krishnaswamy",
  "allocatedAt": "2022-05-15T09:00:00Z",
  "deallocatedAt": null,
  "deallocatedBy": null,
  "deallocationReason": null,
  "isActive": true,
  "notes": "Main entry for Bangalore office"
}
```

### PunchRecord

A single IN/OUT punch. `punchTime` is the **wall-clock time in the sub-company's timezone**, ISO-8601 without an offset.

| Field | Type | Description |
|---|---|---|
| `id` | string |  |
| `employeeId` | string |  |
| `employeeCode` | string |  |
| `employeeName` | string |  |
| `deviceId` | string | Device id, or `MANUAL` for hand-entered punches. |
| `deviceName` | string | `Manual Entry` for manual punches. |
| `punchTime` | string | e.g. `2026-09-19T08:55:00` (local to the sub-company). |
| `punchType` | `IN` \| `OUT` |  |
| `companyId` | string |  |
| `subCompanyId` | string |  |
| `date` | date (`YYYY-MM-DD`) | The attendance date this punch belongs to (an overnight shift's OUT keeps the start date). |

```json
{
  "id": "p-001",
  "employeeId": "emp-001",
  "employeeCode": "EMP-1001",
  "employeeName": "Rahul Menon",
  "deviceId": "device-001",
  "deviceName": "Kochi Main Entrance",
  "punchTime": "2026-09-19T08:55:00",
  "punchType": "IN",
  "companyId": "company-001",
  "subCompanyId": "sub-001",
  "date": "2026-09-19"
}
```

### AttendanceRecord

One employee-day, **calculated** from raw punches + shift + attendance settings. Never written directly; recalculated whenever inputs change.

| Field | Type | Description |
|---|---|---|
| `id` | string |  |
| `employeeId` | string |  |
| `employeeCode` | string |  |
| `employeeName` | string |  |
| `department` | string |  |
| `designation` | string |  |
| `date` | date (`YYYY-MM-DD`) |  |
| `shiftId` | string |  |
| `shiftName` | string |  |
| `shiftStartTime` | time (`HH:mm`) |  |
| `shiftEndTime` | time (`HH:mm`) |  |
| `firstPunchIn` | string \| null | Local wall-clock ISO string. |
| `lastPunchOut` | string \| null |  |
| `punchRecords` | PunchRecord[] | Device punches plus any manual punches, oldest first. |
| `workingMinutes` | integer | Sum of IN→OUT pairs. |
| `breakMinutes` | integer | Gaps between an OUT and the next IN. |
| `lateMinutes` | integer | Minutes after `start + grace`. 0 if on time. |
| `earlyOutMinutes` | integer | Minutes before `end − early-out threshold`. |
| `overtimeMinutes` | integer | Minutes past shift end when ≥ overtime threshold and overtime is enabled, else 0. |
| `status` | `PRESENT` \| `ABSENT` \| `LATE` \| `EARLY_OUT` \| `INCOMPLETE` \| `HOLIDAY` \| `WEEKLY_OFF` \| `ON_LEAVE` | See the status rules in the Attendance module. |
| `companyId` | string |  |
| `subCompanyId` | string |  |
| `subCompanyName` | string |  |
| `isManual` | boolean | True when a manual entry contributes punches to this day. |
| `manualReason` | string \| null |  |
| `manualSource` | `MANUAL` \| `REGULARIZATION` \| `MISSING_PUNCH` \| null |  |
| `manualBy` | string \| null |  |
| `manualAt` | datetime (ISO-8601) \| null |  |
| `leaveType` | string \| null | Set when the day is covered by approved leave. |
| `leaveRequestId` | string \| null |  |

```json
{
  "id": "att-emp-001-2026-09-19",
  "employeeId": "emp-001",
  "employeeCode": "EMP-1001",
  "employeeName": "Rahul Menon",
  "department": "Engineering",
  "designation": "Senior Software Engineer",
  "date": "2026-09-19",
  "shiftId": "shift-001",
  "shiftName": "General Shift",
  "shiftStartTime": "09:00",
  "shiftEndTime": "18:00",
  "firstPunchIn": "2026-09-19T08:55:00",
  "lastPunchOut": "2026-09-19T18:35:00",
  "punchRecords": [
    {
      "id": "p-001",
      "employeeId": "emp-001",
      "employeeCode": "EMP-1001",
      "employeeName": "Rahul Menon",
      "deviceId": "device-001",
      "deviceName": "Kochi Main Entrance",
      "punchTime": "2026-09-19T08:55:00",
      "punchType": "IN",
      "companyId": "company-001",
      "subCompanyId": "sub-001",
      "date": "2026-09-19"
    },
    {
      "id": "p-002",
      "employeeId": "emp-001",
      "employeeCode": "EMP-1001",
      "employeeName": "Rahul Menon",
      "deviceId": "device-001",
      "deviceName": "Kochi Main Entrance",
      "punchTime": "2026-09-19T13:01:00",
      "punchType": "OUT",
      "companyId": "company-001",
      "subCompanyId": "sub-001",
      "date": "2026-09-19"
    },
    {
      "id": "p-003",
      "employeeId": "emp-001",
      "employeeCode": "EMP-1001",
      "employeeName": "Rahul Menon",
      "deviceId": "device-001",
      "deviceName": "Kochi Main Entrance",
      "punchTime": "2026-09-19T13:55:00",
      "punchType": "IN",
      "companyId": "company-001",
      "subCompanyId": "sub-001",
      "date": "2026-09-19"
    },
    {
      "id": "p-004",
      "employeeId": "emp-001",
      "employeeCode": "EMP-1001",
      "employeeName": "Rahul Menon",
      "deviceId": "device-001",
      "deviceName": "Kochi Main Entrance",
      "punchTime": "2026-09-19T18:35:00",
      "punchType": "OUT",
      "companyId": "company-001",
      "subCompanyId": "sub-001",
      "date": "2026-09-19"
    }
  ],
  "workingMinutes": 526,
  "breakMinutes": 54,
  "lateMinutes": 0,
  "earlyOutMinutes": 0,
  "overtimeMinutes": 35,
  "status": "PRESENT",
  "companyId": "company-001",
  "subCompanyId": "sub-001",
  "subCompanyName": "Nexus Kochi HQ",
  "isManual": false,
  "manualReason": null,
  "manualSource": null,
  "manualBy": null,
  "manualAt": null,
  "leaveType": null,
  "leaveRequestId": null
}
```

### DailyAttendanceStats

Aggregate counts for a set of daily attendance records.

| Field | Type | Description |
|---|---|---|
| `total` | integer |  |
| `present` | integer |  |
| `absent` | integer |  |
| `late` | integer |  |
| `earlyOut` | integer |  |
| `missingPunch` | integer | Records with status INCOMPLETE. |
| `onLeave` | integer |  |
| `holiday` | integer |  |
| `weeklyOff` | integer |  |
| `overtimeMinutes` | integer | Total overtime minutes across the records. |

```json
{
  "total": 25,
  "present": 9,
  "absent": 1,
  "late": 3,
  "earlyOut": 1,
  "missingPunch": 1,
  "onLeave": 0,
  "holiday": 0,
  "weeklyOff": 10,
  "overtimeMinutes": 57
}
```

### AttendanceRequest

A regularization, missing-punch or leave request. **The Requests/Leaves UI is currently commented out in the frontend; the API is specified for when it is re-enabled.**

| Field | Type | Description |
|---|---|---|
| `id` | string |  |
| `type` | `REGULARIZATION` \| `MISSING_PUNCH` \| `LEAVE` |  |
| `status` | `PENDING` \| `APPROVED` \| `REJECTED` \| `CANCELLED` |  |
| `employeeId` | string |  |
| `employeeCode` | string |  |
| `employeeName` | string |  |
| `department` | string |  |
| `companyId` | string |  |
| `subCompanyId` | string |  |
| `subCompanyName` | string |  |
| `date` | date (`YYYY-MM-DD`) | Attendance date, or first day of leave. |
| `endDate` | date (`YYYY-MM-DD`) \| null | Last day of leave. |
| `punches` | object[] \| null | `[{ punchIn, punchOut }]` as `HH:mm` (empty string when only one side is supplied). |
| `leaveType` | `CASUAL` \| `SICK` \| `EARNED` \| `UNPAID` \| null |  |
| `leaveDays` | integer \| null | Working days covered (weekly offs and holidays excluded). |
| `reason` | string |  |
| `requestedBy` | string |  |
| `requestedByRole` | `HR` \| `ADMIN` |  |
| `requestedAt` | datetime (ISO-8601) |  |
| `reviewedBy` | string \| null |  |
| `reviewComment` | string \| null |  |
| `reviewedAt` | datetime (ISO-8601) \| null |  |

```json
{
  "id": "req-0001",
  "type": "MISSING_PUNCH",
  "status": "PENDING",
  "employeeId": "emp-006",
  "employeeCode": "EMP-1006",
  "employeeName": "Mohammed Shafi",
  "department": "Finance",
  "companyId": "company-001",
  "subCompanyId": "sub-001",
  "subCompanyName": "Nexus Kochi HQ",
  "date": "2026-09-20",
  "endDate": null,
  "punches": [
    {
      "punchIn": "",
      "punchOut": "18:05"
    }
  ],
  "leaveType": null,
  "leaveDays": null,
  "reason": "Forgot to punch out; left at 6:05 PM after the release call",
  "requestedBy": "Divya Menon",
  "requestedByRole": "HR",
  "requestedAt": "2026-09-20T01:29:00Z",
  "reviewedBy": null,
  "reviewComment": null,
  "reviewedAt": null
}
```

### LeaveBalance

Leave entitlement and usage for one employee and year.

| Field | Type | Description |
|---|---|---|
| `employeeId` | string |  |
| `employeeCode` | string |  |
| `employeeName` | string |  |
| `department` | string |  |
| `subCompanyId` | string |  |
| `subCompanyName` | string |  |
| `year` | integer |  |
| `balances` | object | `{ CASUAL, SICK, EARNED: { total, used, pending }, UNPAID: { used, pending } }`. Remaining = `total − used − pending`. |

```json
{
  "employeeId": "emp-003",
  "employeeCode": "EMP-1003",
  "employeeName": "Vishnu Raj",
  "department": "Engineering",
  "subCompanyId": "sub-001",
  "subCompanyName": "Nexus Kochi HQ",
  "year": 2026,
  "balances": {
    "CASUAL": {
      "total": 12,
      "used": 3,
      "pending": 0
    },
    "SICK": {
      "total": 10,
      "used": 0,
      "pending": 0
    },
    "EARNED": {
      "total": 15,
      "used": 0,
      "pending": 0
    },
    "UNPAID": {
      "used": 0,
      "pending": 0
    }
  }
}
```

### AttendanceSettings

Company-wide attendance policy. Changing it recalculates attendance.

| Field | Type | Description |
|---|---|---|
| `companyId` | string |  |
| `lateGracePeriodMinutes` | integer | Default grace for **new** shifts; each shift keeps its own value for late calculation. |
| `earlyOutThresholdMinutes` | integer | Buffer before shift end before an early leave counts. |
| `minimumWorkingHours` | time (`HH:mm`) | `HH:mm`. Stored; not yet applied to status calculation. |
| `overtimeThresholdMinutes` | integer | Minutes past shift end before overtime starts counting. |
| `overtimeEnabled` | boolean |  |
| `autoAbsent` | boolean | Reserved: auto-mark absent after midnight. Stored; not yet applied. |
| `updatedAt` | datetime (ISO-8601) |  |
| `updatedBy` | string |  |

```json
{
  "companyId": "company-001",
  "lateGracePeriodMinutes": 15,
  "earlyOutThresholdMinutes": 15,
  "minimumWorkingHours": "07:00",
  "overtimeThresholdMinutes": 30,
  "overtimeEnabled": true,
  "autoAbsent": false,
  "updatedAt": "2026-09-14T10:45:00Z",
  "updatedBy": "Meera Nambiar"
}
```

### ActivityLog

Immutable audit-trail entry. Written by the server for every state-changing request.

| Field | Type | Description |
|---|---|---|
| `id` | string |  |
| `date` | datetime (ISO-8601) |  |
| `userId` | string |  |
| `userName` | string |  |
| `userRole` | string |  |
| `action` | `CREATED` \| `UPDATED` \| `DELETED` \| `ACTIVATED` \| `DEACTIVATED` \| `ALLOCATED` \| `DEALLOCATED` \| `APPROVED` \| `REJECTED` \| `CANCELLED` |  |
| `module` | string | Companies, Sub Companies, Devices, Users, Employees, Shifts, Holidays, Attendance, Requests, Configuration. |
| `target` | string | Human-readable subject. |
| `targetId` | string \| null |  |
| `details` | string |  |
| `ipAddress` | string | Client IP taken from the request. |
| `companyId` | string \| null | Company the action belongs to. |

```json
{
  "id": "log-0016",
  "date": "2026-09-20T09:30:00Z",
  "userId": "user-001",
  "userName": "Arjun Krishnaswamy",
  "userRole": "SUPER_ADMIN",
  "action": "ALLOCATED",
  "module": "Devices",
  "target": "DEV-NX-004 → Nexus Bangalore",
  "targetId": "device-004",
  "details": "Main entry for Bangalore office",
  "ipAddress": "203.0.113.24",
  "companyId": "company-001"
}
```

### ReportJob

A generated export. Small reports complete synchronously; large ones return `PROCESSING` and are polled.

| Field | Type | Description |
|---|---|---|
| `id` | string |  |
| `type` | `DAILY` \| `MONTHLY` \| `EMPLOYEE` \| `MULTI_EMPLOYEE` |  |
| `format` | `EXCEL` \| `PDF` \| `CSV` |  |
| `status` | `PROCESSING` \| `COMPLETED` \| `FAILED` |  |
| `fileName` | string \| null |  |
| `fileSize` | integer \| null | Bytes. |
| `rowCount` | integer \| null |  |
| `downloadUrl` | string \| null | Relative URL, valid until `expiresAt`. |
| `expiresAt` | datetime (ISO-8601) \| null | Files are kept 7 days. |
| `filters` | object | The filters the report was generated with. |
| `requestedBy` | string |  |
| `requestedAt` | datetime (ISO-8601) |  |
| `completedAt` | datetime (ISO-8601) \| null |  |
| `error` | string \| null | Failure reason when `status = FAILED`. |

```json
{
  "id": "rpt_01J8Z3K4M5",
  "type": "MONTHLY",
  "format": "EXCEL",
  "status": "COMPLETED",
  "fileName": "attendance_monthly_report_20260920_093000.xlsx",
  "fileSize": 48213,
  "rowCount": 550,
  "downloadUrl": "/api/v1/reports/rpt_01J8Z3K4M5/download",
  "expiresAt": "2026-09-27T09:30:00Z",
  "filters": {
    "type": "MONTHLY",
    "month": 9,
    "year": 2026,
    "subCompanyId": "sub-001",
    "format": "EXCEL"
  },
  "requestedBy": "Divya Menon",
  "requestedAt": "2026-09-20T09:30:00Z",
  "completedAt": "2026-09-20T09:30:02Z",
  "error": null
}
```

## Endpoint index

**99 endpoints** across 17 modules. Click a module for full payloads and response scenarios.

#### 1. [Authentication & Profile](modules/01-auth.md) — 9 endpoints

| Method | Path | Purpose | Access |
|---|---|---|---|
| `POST` | `/auth/login` | Sign in | Public (no auth) |
| `POST` | `/auth/refresh` | Refresh access token | Public (no auth) |
| `POST` | `/auth/logout` | Sign out | Super Admin, Admin, HR |
| `GET` | `/auth/me` | Current user | Super Admin, Admin, HR |
| `POST` | `/auth/forgot-password` | Request password reset | Public (no auth) |
| `POST` | `/auth/reset-password` | Reset password with token | Public (no auth) |
| `POST` | `/auth/change-password` | Change own password | Super Admin, Admin, HR |
| `GET` | `/profile` | Get my profile | Super Admin, Admin, HR |
| `PATCH` | `/profile` | Edit my profile | Super Admin, Admin, HR |

#### 2. [Companies](modules/02-companies.md) — 9 endpoints

| Method | Path | Purpose | Access |
|---|---|---|---|
| `GET` | `/companies` | List companies | Super Admin |
| `GET` | `/companies/{companyId}` | Get company | Super Admin, Admin |
| `POST` | `/companies` | Create company | Super Admin |
| `PUT` | `/companies/{companyId}` | Update company | Super Admin |
| `PATCH` | `/companies/{companyId}/status` | Activate / deactivate company | Super Admin |
| `DELETE` | `/companies/{companyId}` | Delete company | Super Admin |
| `GET` | `/companies/{companyId}/overview` | Company overview | Super Admin |
| `GET` | `/companies/{companyId}/sub-companies` | Sub-companies of a company | Super Admin, Admin |
| `POST` | `/companies/{companyId}/logo` | Upload company logo | Super Admin, Admin |

#### 3. [Sub-Companies](modules/03-sub-companies.md) — 8 endpoints

| Method | Path | Purpose | Access |
|---|---|---|---|
| `GET` | `/sub-companies` | List sub-companies | Super Admin, Admin |
| `GET` | `/sub-companies/{subCompanyId}` | Get sub company | Super Admin, Admin, HR |
| `POST` | `/sub-companies` | Create sub company | Super Admin |
| `PUT` | `/sub-companies/{subCompanyId}` | Update sub company | Super Admin |
| `PATCH` | `/sub-companies/{subCompanyId}/status` | Activate / deactivate sub company | Super Admin |
| `GET` | `/sub-companies/{subCompanyId}/overview` | Sub-company overview | Super Admin |
| `PATCH` | `/sub-companies/{subCompanyId}/profile` | Edit own branch profile | Admin, HR |
| `POST` | `/sub-companies/{subCompanyId}/logo` | Upload sub-company logo | Admin, HR |

#### 4. [Departments](modules/04-departments.md) — 6 endpoints

| Method | Path | Purpose | Access |
|---|---|---|---|
| `GET` | `/departments` | List departments | Super Admin, Admin, HR |
| `GET` | `/departments/{departmentId}` | Get department | Super Admin, Admin, HR |
| `POST` | `/departments` | Create department | Admin, HR |
| `PUT` | `/departments/{departmentId}` | Update department | Admin, HR |
| `PATCH` | `/departments/{departmentId}/status` | Activate / deactivate department | Admin, HR |
| `DELETE` | `/departments/{departmentId}` | Delete department | Admin, HR |

#### 5. [Users](modules/05-users.md) — 6 endpoints

| Method | Path | Purpose | Access |
|---|---|---|---|
| `GET` | `/users` | List users | Super Admin, Admin |
| `GET` | `/users/{userId}` | Get user | Super Admin, Admin |
| `POST` | `/users` | Create user | Super Admin, Admin |
| `PUT` | `/users/{userId}` | Update user | Super Admin, Admin |
| `PATCH` | `/users/{userId}/status` | Activate / deactivate user | Super Admin, Admin |
| `POST` | `/users/{userId}/reset-password` | Reset a user's password (admin action) | Super Admin, Admin |

#### 6. [Employees](modules/06-employees.md) — 6 endpoints

| Method | Path | Purpose | Access |
|---|---|---|---|
| `GET` | `/employees` | List employees | Super Admin, Admin, HR |
| `GET` | `/employees/{employeeId}` | Get employee | Super Admin, Admin, HR |
| `POST` | `/employees` | Create employee | Admin, HR |
| `PUT` | `/employees/{employeeId}` | Update employee | Admin, HR |
| `PATCH` | `/employees/{employeeId}/status` | Activate / deactivate employee | Admin, HR |
| `PATCH` | `/employees/{employeeId}/shift` | Assign shift | Admin, HR |

#### 7. [Shifts](modules/07-shifts.md) — 6 endpoints

| Method | Path | Purpose | Access |
|---|---|---|---|
| `GET` | `/shifts` | List shifts | Super Admin, Admin, HR |
| `GET` | `/shifts/{shiftId}` | Get shift | Super Admin, Admin, HR |
| `POST` | `/shifts` | Create shift | Admin, HR |
| `PUT` | `/shifts/{shiftId}` | Update shift | Admin, HR |
| `PATCH` | `/shifts/{shiftId}/status` | Activate / deactivate shift | Admin, HR |
| `DELETE` | `/shifts/{shiftId}` | Delete shift | Admin, HR |

#### 8. [Holidays](modules/08-holidays.md) — 4 endpoints

| Method | Path | Purpose | Access |
|---|---|---|---|
| `GET` | `/holidays` | List holidays | Super Admin, Admin, HR |
| `POST` | `/holidays` | Create holiday | Admin, HR |
| `PUT` | `/holidays/{holidayId}` | Update holiday | Admin, HR |
| `DELETE` | `/holidays/{holidayId}` | Delete holiday | Admin, HR |

#### 9. [Attendance](modules/09-attendance.md) — 9 endpoints

| Method | Path | Purpose | Access |
|---|---|---|---|
| `GET` | `/attendance/daily` | Daily attendance | Super Admin, Admin, HR |
| `GET` | `/attendance/monthly` | Monthly attendance | Super Admin, Admin, HR |
| `GET` | `/attendance/employees/{employeeId}/monthly` | One employee's month | Super Admin, Admin, HR |
| `GET` | `/attendance/employees/{employeeId}/dates/{date}` | One employee-day | Super Admin, Admin, HR |
| `GET` | `/attendance/manual-entries/{employeeId}/{date}` | Get manual entry | Admin, HR |
| `POST` | `/attendance/manual-entries` | Add manual entry | Admin, HR |
| `PUT` | `/attendance/manual-entries/{employeeId}/{date}` | Edit manual entry | Admin, HR |
| `DELETE` | `/attendance/manual-entries/{employeeId}/{date}` | Delete manual entry | Admin, HR |
| `POST` | `/attendance/recalculate` | Recalculate attendance | Admin, HR |

#### 10. [Requests & Leaves](modules/10-requests.md) — 10 endpoints

| Method | Path | Purpose | Access |
|---|---|---|---|
| `GET` | `/requests` | List requests | Admin, HR |
| `GET` | `/requests/{requestId}` | Get request | Admin, HR |
| `POST` | `/requests` | Create request | Admin, HR |
| `POST` | `/requests/{requestId}/approve` | Approve request | Admin |
| `POST` | `/requests/{requestId}/reject` | Reject request | Admin |
| `POST` | `/requests/{requestId}/cancel` | Cancel / revoke request | Admin, HR |
| `GET` | `/leaves/balances` | Leave balances | Admin, HR |
| `GET` | `/leaves/balances/{employeeId}` | One employee's leave balance | Admin, HR |
| `GET` | `/leaves/policy` | Get leave policy | Super Admin, Admin, HR |
| `PUT` | `/leaves/policy` | Update leave policy | Admin |

#### 11. [Devices](modules/11-devices.md) — 12 endpoints

| Method | Path | Purpose | Access |
|---|---|---|---|
| `GET` | `/devices` | List devices | Super Admin, Admin |
| `GET` | `/devices/unallocated` | List unallocated devices | Super Admin |
| `GET` | `/devices/{deviceId}` | Get device | Super Admin, Admin |
| `POST` | `/devices` | Register device | Super Admin |
| `PUT` | `/devices/{deviceId}` | Edit device | Super Admin |
| `PATCH` | `/devices/{deviceId}/maintenance` | Set maintenance mode | Super Admin |
| `POST` | `/devices/{deviceId}/allocate` | Allocate / re-allocate device | Super Admin |
| `POST` | `/devices/{deviceId}/deallocate` | Deallocate device | Super Admin |
| `GET` | `/devices/{deviceId}/allocations` | Allocation history of a device | Super Admin, Admin |
| `GET` | `/devices/allocations` | All allocations | Super Admin |
| `GET` | `/devices/{deviceId}/stats` | Device statistics | Super Admin, Admin |
| `GET` | `/devices/{deviceId}/punches` | Device punch log | Super Admin, Admin |

#### 12. [Device Gateway](modules/12-gateway.md) — 2 endpoints

| Method | Path | Purpose | Access |
|---|---|---|---|
| `POST` | `/gateway/punches` | Push punches | Device credentials |
| `POST` | `/gateway/heartbeat` | Device heartbeat | Device credentials |

#### 13. [Configuration — Attendance Settings](modules/13-settings.md) — 2 endpoints

| Method | Path | Purpose | Access |
|---|---|---|---|
| `GET` | `/settings/attendance` | Get attendance settings | Super Admin, Admin, HR |
| `PUT` | `/settings/attendance` | Update attendance settings | Admin, HR |

#### 14. [Reports & Exports](modules/14-reports.md) — 4 endpoints

| Method | Path | Purpose | Access |
|---|---|---|---|
| `POST` | `/reports/generate` | Generate report | Admin, HR |
| `GET` | `/reports` | Report history | Admin, HR |
| `GET` | `/reports/{reportId}` | Report status | Admin, HR |
| `GET` | `/reports/{reportId}/download` | Download report file | Admin, HR |

#### 15. [Dashboards](modules/15-dashboard.md) — 3 endpoints

| Method | Path | Purpose | Access |
|---|---|---|---|
| `GET` | `/dashboard/super-admin` | Super Admin dashboard | Super Admin |
| `GET` | `/dashboard/admin` | Admin dashboard | Admin |
| `GET` | `/dashboard/hr` | HR dashboard | HR |

#### 16. [Activity Logs](modules/16-activity-logs.md) — 2 endpoints

| Method | Path | Purpose | Access |
|---|---|---|---|
| `GET` | `/activity-logs` | List activity logs | Super Admin |
| `GET` | `/activity-logs/{logId}` | Get activity log entry | Super Admin |

#### 17. [System](modules/17-system.md) — 1 endpoint

| Method | Path | Purpose | Access |
|---|---|---|---|
| `GET` | `/health` | Health check | Public (no auth) |

## Frontend integration notes

### Swapping the mock layer

Each mock service maps to a module; the hooks and pages do not change — only the service bodies (`sleep()` + in-memory arrays → `apiClient` calls).

| Mock service (`src/services/mock/`) | Module |
|---|---|
| `auth.service.ts` (in `features/auth/services`), profile page | 1 · Auth & Profile |
| `company.service.ts` (companies) | 2 · Companies |
| `company.service.ts` (sub-companies) | 3 · Sub-Companies |
| `department.service.ts` | 4 · Departments |
| `user.service.ts` | 5 · Users |
| `employee.service.ts` | 6 · Employees |
| `shift.service.ts` | 7 · Shifts |
| `holiday.service.ts` | 8 · Holidays |
| `attendance.service.ts`, `manualAttendance.service.ts`, `attendanceEngine.ts`/`attendanceHistory.ts`/`attendanceStore.ts` | 9 · Attendance (the engine files become **server-side** logic) |
| `request.service.ts` | 10 · Requests & Leaves (UI currently commented out) |
| `device.service.ts` | 11 · Devices |
| *(none — device firmware)* | 12 · Device Gateway |
| `settings.service.ts` | 13 · Settings |
| `report.service.ts` | 14 · Reports |
| `dashboard.service.ts` | 15 · Dashboards |
| `activityLog.service.ts` | 16 · Activity Logs |

### Changes the frontend needs

1. **Unwrap the envelope** in the service layer: `res.data.data` for single resources; for lists map `{ data, pagination }` to the existing `PaginatedResponse` (`{ data, total, page, pageSize, totalPages }`).
2. **Token refresh:** extend the axios 401 interceptor to try `POST /auth/refresh` on `TOKEN_EXPIRED` before clearing storage and redirecting.
3. **Status toggles:** hooks call `toggleXStatus(id)`. Read the current status (already in the cached row) and send the opposite to `PATCH …/status`.
4. **Daily attendance pagination:** the page currently slices the full list client-side. Pass `page`/`pageSize` and read `pagination.total`; `stats` already covers the whole result.
5. **Monthly summary:** `summarizeMonthlyAttendance()` is computed client-side today; use `data.summary` from `/attendance/monthly`.
6. **Remove mock-only code:** `logActivity()` calls and the actor sync in `authStore` (the backend writes the audit log), default password `password123`, `getXSnapshot()` helpers, and the in-memory attendance engine once the server calculates attendance.
7. **Scope params:** keep sending `subCompanyId` from the Admin topbar selector; HR/Admin `companyId` is optional (the token already fixes it).
8. **Reports & uploads:** replace the simulated 1.2–1.5 s exports with `POST /reports/generate` then `GET /reports/{id}/download` (`responseType: 'blob'`); wire "Upload Logo" to the logo endpoints.
9. **Requests / Leaves:** UI is commented out; nothing to change until it is re-enabled.
10. **Methods that map onto an existing endpoint** (no dedicated route): `employeeService.getEmployeesBySubCompany(id)` → `GET /employees?subCompanyId=<id>&status=ACTIVE&pageSize=200`; the profile page's `useUser(ownId)` → `GET /profile`; `reportService.exportDailyReport / exportMonthlyReport` → `POST /reports/generate` with `type` DAILY / MONTHLY.

### Business rules the server must own

- **Attendance is calculated, never posted.** Recalculate an employee-day whenever a punch, manual entry, shift, holiday, employee shift/weekly-off, approved leave, or attendance setting changes (see the Attendance module for status rules).
- **Manual entries add to device punches**, never replace them; deleting one reverts the day.
- **Derived counts** (`employeeCount`, `deviceCount`, `subCompanyCount`, `hrCount`) are computed, not stored.
- **Audit log** is written by the server for every write, with actor, IP and company.
- **Deactivation cascades logically:** inactive company/sub-company blocks sign-in and punch processing; data is retained.

