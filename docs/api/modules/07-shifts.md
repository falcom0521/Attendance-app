# 7. Shifts

Work schedules owned by a sub-company. Attendance late / early-out / overtime are calculated against the employee's shift.

[← Back to overview](../README.md)

## Endpoints in this module

| # | Method | Path | Purpose | Access |
|---|---|---|---|---|
| 7.1 | `GET` | `/shifts` | List shifts | Super Admin, Admin, HR |
| 7.2 | `GET` | `/shifts/{shiftId}` | Get shift | Super Admin, Admin, HR |
| 7.3 | `POST` | `/shifts` | Create shift | Admin, HR |
| 7.4 | `PUT` | `/shifts/{shiftId}` | Update shift | Admin, HR |
| 7.5 | `PATCH` | `/shifts/{shiftId}/status` | Activate / deactivate shift | Admin, HR |
| 7.6 | `DELETE` | `/shifts/{shiftId}` | Delete shift | Admin, HR |

---

### 7.1 · List shifts

`GET` `/shifts`

**Purpose:** Paginated list of shifts, with filters and search. Powers the shifts table.

- **Access:** Super Admin, Admin, HR
- **Used by:** ShiftsPage, EmployeeFormDialog, Sub-company detail
- **Auth:** `Authorization: Bearer <accessToken>`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `page` | integer | no | Page number, starting at 1. Default `1`. |
| `pageSize` | integer | no | Rows per page. Default `10`, max `200`. |
| `search` | string | no | Case-insensitive text search. |
| `subCompanyId` | string | no | HR: forced to own sub-company. Admin/Super Admin: optional. |
| `companyId` | string | no | Admin: forced to own company. |
| `status` | `ACTIVE` \| `INACTIVE` | no |  |
| `sortBy` | string | no | Sort field. One of: `name`, `startTime`. |
| `sortOrder` | `asc` \| `desc` | no | Sort direction. Default `asc`. |

**Notes**

- Response includes derived `isOvernight` and `totalWorkMinutes`. Editing a shift recalculates attendance for its employees (current month).

**Response scenarios**

#### ✅ `200 OK` — shifts found

```json
{
  "success": true,
  "data": [
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
    },
    {
      "id": "shift-006",
      "name": "US Shift",
      "startTime": "18:00",
      "endTime": "03:00",
      "breakStartTime": null,
      "breakEndTime": null,
      "gracePeriodMinutes": 15,
      "isOvernight": true,
      "totalWorkMinutes": 540,
      "status": "ACTIVE",
      "companyId": "company-001",
      "subCompanyId": "sub-002",
      "createdAt": "2022-04-01T09:00:00Z",
      "updatedAt": "2022-04-01T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 2,
    "totalPages": 1
  }
}
```

#### ✅ `200 OK` — No matches (empty list, not an error)

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 0,
    "totalPages": 1
  }
}
```

#### ❌ `422 Unprocessable Entity` — Invalid paging / filter value

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "errors": [
    {
      "field": "pageSize",
      "message": "Must be between 1 and 200"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 7.2 · Get shift

`GET` `/shifts/{shiftId}`

**Purpose:** Fetch a single shift by id.

- **Access:** Super Admin, Admin, HR
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `shiftId` | string | Shift id. |

**Notes**

- Response includes derived `isOvernight` and `totalWorkMinutes`. Editing a shift recalculates attendance for its employees (current month).

**Response scenarios**

#### ✅ `200 OK` — Shift found

```json
{
  "success": true,
  "data": {
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
}
```

#### ❌ `404 Not Found` — Shift does not exist (or is outside the caller's scope)

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Shift not found",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 7.3 · Create shift

`POST` `/shifts`

**Purpose:** Create a new shift.

- **Access:** Admin, HR
- **Used by:** ShiftFormDialog
- **Auth:** `Authorization: Bearer <accessToken>`

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | **yes** | 2–60 chars. Unique within the sub-company. |
| `startTime` | time (`HH:mm`) | **yes** | `HH:mm`. |
| `endTime` | time (`HH:mm`) | **yes** | `HH:mm`. Earlier than start = overnight. |
| `breakStartTime` | time (`HH:mm`) | no | Both break times or neither. |
| `breakEndTime` | time (`HH:mm`) | no |  |
| `gracePeriodMinutes` | integer | **yes** | 0–60. Default for new shifts comes from Attendance Settings. |
| `status` | `ACTIVE` \| `INACTIVE` | **yes** |  |
| `subCompanyId` | string | **yes** | HR: forced to own sub-company. Admin: choose one. Immutable after creation. |

```json
{
  "name": "Morning Shift",
  "startTime": "06:00",
  "endTime": "14:00",
  "breakStartTime": "10:00",
  "breakEndTime": "10:30",
  "gracePeriodMinutes": 10,
  "status": "ACTIVE",
  "subCompanyId": "sub-001"
}
```

**Notes**

- Response includes derived `isOvernight` and `totalWorkMinutes`. Editing a shift recalculates attendance for its employees (current month).

**Response scenarios**

#### ✅ `201 Created` — Shift created

```json
{
  "success": true,
  "message": "Shift created successfully",
  "data": {
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
}
```

#### ❌ `422 Unprocessable Entity` — Validation failed

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "errors": [
    {
      "field": "gracePeriodMinutes",
      "message": "Must be between 0 and 60"
    },
    {
      "field": "breakEndTime",
      "message": "Break end must be after break start"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `409 Conflict` — Name already used in the sub-company

```json
{
  "success": false,
  "code": "DUPLICATE_ENTRY",
  "message": "A shift named \"Morning Shift\" already exists in this sub company",
  "field": "name",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `403 Forbidden` — Caller cannot create in that scope

```json
{
  "success": false,
  "code": "FORBIDDEN",
  "message": "You do not have permission to perform this action",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 7.4 · Update shift

`PUT` `/shifts/{shiftId}`

**Purpose:** Replace the editable fields of a shift.

- **Access:** Admin, HR
- **Used by:** ShiftFormDialog (edit)
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `shiftId` | string | Shift id. |

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | **yes** | 2–60 chars. Unique within the sub-company. |
| `startTime` | time (`HH:mm`) | **yes** | `HH:mm`. |
| `endTime` | time (`HH:mm`) | **yes** | `HH:mm`. Earlier than start = overnight. |
| `breakStartTime` | time (`HH:mm`) | no | Both break times or neither. |
| `breakEndTime` | time (`HH:mm`) | no |  |
| `gracePeriodMinutes` | integer | **yes** | 0–60. Default for new shifts comes from Attendance Settings. |
| `status` | `ACTIVE` \| `INACTIVE` | **yes** |  |

```json
{
  "name": "Morning Shift",
  "startTime": "06:00",
  "endTime": "14:00",
  "breakStartTime": "10:00",
  "breakEndTime": "10:30",
  "gracePeriodMinutes": 10,
  "status": "ACTIVE",
  "subCompanyId": "sub-001"
}
```

**Notes**

- Response includes derived `isOvernight` and `totalWorkMinutes`. Editing a shift recalculates attendance for its employees (current month).

**Response scenarios**

#### ✅ `200 OK` — Shift updated

```json
{
  "success": true,
  "message": "Shift updated successfully",
  "data": {
    "id": "shift-001",
    "name": "Morning Shift",
    "startTime": "06:00",
    "endTime": "14:00",
    "breakStartTime": "10:00",
    "breakEndTime": "10:30",
    "gracePeriodMinutes": 10,
    "isOvernight": false,
    "totalWorkMinutes": 480,
    "status": "ACTIVE",
    "companyId": "company-001",
    "subCompanyId": "sub-001",
    "createdAt": "2022-04-01T09:00:00Z",
    "updatedAt": "2022-04-01T09:00:00Z"
  }
}
```

#### ❌ `404 Not Found` — Shift not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Shift not found",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `422 Unprocessable Entity` — Validation failed

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "errors": [
    {
      "field": "gracePeriodMinutes",
      "message": "Must be between 0 and 60"
    },
    {
      "field": "breakEndTime",
      "message": "Break end must be after break start"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `409 Conflict` — Name already used in the sub-company

```json
{
  "success": false,
  "code": "DUPLICATE_ENTRY",
  "message": "A shift named \"Morning Shift\" already exists in this sub company",
  "field": "name",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 7.5 · Activate / deactivate shift

`PATCH` `/shifts/{shiftId}/status`

**Purpose:** Set a shift's status to ACTIVE or INACTIVE. Replaces the UI toggle (the server sets an explicit status instead of flipping it, so retries are safe).

- **Access:** Admin, HR
- **Used by:** ShiftsPage toggle
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `shiftId` | string | Shift id. |

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `status` | `ACTIVE` \| `INACTIVE` | **yes** | Target status. |

```json
{
  "status": "INACTIVE"
}
```

**Notes**

- Deactivating a shift already assigned to employees is allowed; it is just not offered for new assignments.

**Response scenarios**

#### ✅ `200 OK` — Status changed

```json
{
  "success": true,
  "message": "Shift deactivated",
  "data": {
    "id": "shift-001",
    "name": "General Shift",
    "startTime": "09:00",
    "endTime": "18:00",
    "breakStartTime": "13:00",
    "breakEndTime": "14:00",
    "gracePeriodMinutes": 15,
    "isOvernight": false,
    "totalWorkMinutes": 480,
    "status": "INACTIVE",
    "companyId": "company-001",
    "subCompanyId": "sub-001",
    "createdAt": "2022-04-01T09:00:00Z",
    "updatedAt": "2022-04-01T09:00:00Z"
  }
}
```

#### ✅ `200 OK` — Already in that status (idempotent no-op)

```json
{
  "success": true,
  "message": "Shift is already ACTIVE",
  "data": {
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
}
```

#### ❌ `404 Not Found` — Shift not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Shift not found",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `422 Unprocessable Entity` — Invalid status value

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "errors": [
    {
      "field": "status",
      "message": "Must be one of ACTIVE, INACTIVE"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 7.6 · Delete shift

`DELETE` `/shifts/{shiftId}`

**Purpose:** Delete a shift.

- **Access:** Admin, HR
- **Used by:** ShiftsPage
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `shiftId` | string | Shift id. |

**Notes**

- Blocked while any employee is assigned to the shift.

**Response scenarios**

#### ✅ `200 OK` — Shift deleted

```json
{
  "success": true,
  "message": "Shift deleted successfully",
  "data": null
}
```

#### ❌ `404 Not Found` — Shift not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Shift not found",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `409 Conflict` — Employees still assigned

```json
{
  "success": false,
  "code": "SHIFT_IN_USE",
  "message": "Shift \"General Shift\" is assigned to 15 employees. Reassign them first.",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---
