# 6. Employees

People whose attendance is tracked. **An employee belongs to a sub-company, not to the company.** HR is pinned to one sub-company; Admin works across all sub-companies of their company; Super Admin has read-only access.

[← Back to overview](../README.md)

## Endpoints in this module

| # | Method | Path | Purpose | Access |
|---|---|---|---|---|
| 6.1 | `GET` | `/employees` | List employees | Super Admin, Admin, HR |
| 6.2 | `GET` | `/employees/{employeeId}` | Get employee | Super Admin, Admin, HR |
| 6.3 | `POST` | `/employees` | Create employee | Admin, HR |
| 6.4 | `PUT` | `/employees/{employeeId}` | Update employee | Admin, HR |
| 6.5 | `PATCH` | `/employees/{employeeId}/status` | Activate / deactivate employee | Admin, HR |
| 6.6 | `PATCH` | `/employees/{employeeId}/shift` | Assign shift | Admin, HR |

---

### 6.1 · List employees

`GET` `/employees`

**Purpose:** Paginated list of employees, with filters and search. Powers the employees table.

- **Access:** Super Admin, Admin, HR
- **Used by:** EmployeesPage, pickers (Manual attendance, Reports), Sub-company detail
- **Auth:** `Authorization: Bearer <accessToken>`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `page` | integer | no | Page number, starting at 1. Default `1`. |
| `pageSize` | integer | no | Rows per page. Default `10`, max `200`. |
| `search` | string | no | Case-insensitive text search. |
| `companyId` | string | no | Super Admin filter. Admin/HR: forced to own company. |
| `subCompanyId` | string | no | HR: forced to own sub-company. Admin: optional narrowing (topbar selector). |
| `department` | string | no | Exact department name. |
| `shiftId` | string | no |  |
| `status` | `ACTIVE` \| `INACTIVE` | no | Pickers use `ACTIVE`. |
| `sortBy` | string | no | Sort field. One of: `fullName`, `employeeCode`, `joiningDate`, `createdAt`. |
| `sortOrder` | `asc` \| `desc` | no | Sort direction. Default `asc`. |

**Notes**

- **Scope:** HR → own sub-company only; Admin → every sub-company of own company; Super Admin → read-only, any. Out-of-scope ids return 404. `pageSize` may go up to **200** (pickers load a whole branch).

**Response scenarios**

#### ✅ `200 OK` — employees found

```json
{
  "success": true,
  "data": [
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
    },
    {
      "id": "emp-002",
      "employeeCode": "EMP-1002",
      "firstName": "Aishwarya",
      "lastName": "Nair",
      "fullName": "Aishwarya Nair",
      "email": "aishwarya.nair@nexustech.in",
      "phone": "+91-9845001002",
      "dateOfBirth": "1992-05-15",
      "address": "12, Panampilly Nagar, Kochi",
      "avatarUrl": null,
      "department": "Engineering",
      "designation": "Software Engineer",
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

### 6.2 · Get employee

`GET` `/employees/{employeeId}`

**Purpose:** Fetch a single employee by id.

- **Access:** Super Admin, Admin, HR
- **Used by:** EmployeeDetailPage
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `employeeId` | string | Employee id. |

**Notes**

- **Scope:** HR → own sub-company only; Admin → every sub-company of own company; Super Admin → read-only, any. Out-of-scope ids return 404. `pageSize` may go up to **200** (pickers load a whole branch).

**Response scenarios**

#### ✅ `200 OK` — Employee found

```json
{
  "success": true,
  "data": {
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
}
```

#### ❌ `404 Not Found` — Employee does not exist (or is outside the caller's scope)

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Employee not found",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 6.3 · Create employee

`POST` `/employees`

**Purpose:** Create a new employee.

- **Access:** Admin, HR
- **Used by:** EmployeeFormDialog
- **Auth:** `Authorization: Bearer <accessToken>`

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `employeeCode` | string | **yes** | Unique within the company. Must match the id enrolled on the device. |
| `firstName` | string | **yes** |  |
| `lastName` | string | **yes** |  |
| `email` | email | **yes** |  |
| `phone` | string | **yes** | Min 7 chars. |
| `dateOfBirth` | date (`YYYY-MM-DD`) | **yes** | `YYYY-MM-DD`, must be in the past. |
| `address` | string | **yes** | Min 5 chars. |
| `department` | string | **yes** | Name of an ACTIVE department of the company. |
| `designation` | string | **yes** |  |
| `employeeType` | `FULL_TIME` \| `PART_TIME` \| `CONTRACT` \| `INTERN` | **yes** |  |
| `joiningDate` | date (`YYYY-MM-DD`) | **yes** | `YYYY-MM-DD`. |
| `status` | `ACTIVE` \| `INACTIVE` | **yes** |  |
| `subCompanyId` | string | **yes** | HR: forced to their own sub-company. Admin: any sub-company of their company. |
| `shiftId` | string | no | Must belong to the same sub-company. Omit / `null` = sub-company default. |
| `weeklyOff` | string[] | no | Weekdays off. Default `["SATURDAY","SUNDAY"]`. |

```json
{
  "employeeCode": "EMP-1016",
  "firstName": "Nikhil",
  "lastName": "Jose",
  "email": "nikhil.jose@nexustech.in",
  "phone": "+91-9845001016",
  "dateOfBirth": "1994-02-11",
  "address": "7, Edappally, Kochi",
  "department": "Engineering",
  "designation": "Software Engineer",
  "employeeType": "FULL_TIME",
  "joiningDate": "2026-09-01",
  "status": "ACTIVE",
  "subCompanyId": "sub-001",
  "shiftId": "shift-001",
  "weeklyOff": [
    "SATURDAY",
    "SUNDAY"
  ]
}
```

**Notes**

- **Scope:** HR → own sub-company only; Admin → every sub-company of own company; Super Admin → read-only, any. Out-of-scope ids return 404. `pageSize` may go up to **200** (pickers load a whole branch).

**Response scenarios**

#### ✅ `201 Created` — Employee created

```json
{
  "success": true,
  "message": "Employee created successfully",
  "data": {
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
      "field": "email",
      "message": "Enter a valid email address"
    },
    {
      "field": "department",
      "message": "Department \"Sales\" does not exist or is inactive"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `409 Conflict` — Employee code already used

```json
{
  "success": false,
  "code": "DUPLICATE_ENTRY",
  "message": "Employee code \"EMP-1016\" is already in use",
  "field": "employeeCode",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `403 Forbidden` — Caller cannot create in that scope

```json
{
  "success": false,
  "code": "FORBIDDEN",
  "message": "You can only add employees to your own sub company",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `422 Unprocessable Entity` — Shift belongs to a different sub-company

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "errors": [
    {
      "field": "shiftId",
      "message": "Shift does not belong to the selected sub company"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 6.4 · Update employee

`PUT` `/employees/{employeeId}`

**Purpose:** Replace the editable fields of a employee.

- **Access:** Admin, HR
- **Used by:** EmployeeFormDialog (edit)
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `employeeId` | string | Employee id. |

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `employeeCode` | string | **yes** | Unique within the company. Must match the id enrolled on the device. |
| `firstName` | string | **yes** |  |
| `lastName` | string | **yes** |  |
| `email` | email | **yes** |  |
| `phone` | string | **yes** | Min 7 chars. |
| `dateOfBirth` | date (`YYYY-MM-DD`) | **yes** | `YYYY-MM-DD`, must be in the past. |
| `address` | string | **yes** | Min 5 chars. |
| `department` | string | **yes** | Name of an ACTIVE department of the company. |
| `designation` | string | **yes** |  |
| `employeeType` | `FULL_TIME` \| `PART_TIME` \| `CONTRACT` \| `INTERN` | **yes** |  |
| `joiningDate` | date (`YYYY-MM-DD`) | **yes** | `YYYY-MM-DD`. |
| `status` | `ACTIVE` \| `INACTIVE` | **yes** |  |
| `shiftId` | string | no | Must belong to the same sub-company. Omit / `null` = sub-company default. |
| `weeklyOff` | string[] | no | Weekdays off. Default `["SATURDAY","SUNDAY"]`. |

```json
{
  "employeeCode": "EMP-1016",
  "firstName": "Nikhil",
  "lastName": "Jose",
  "email": "nikhil.jose@nexustech.in",
  "phone": "+91-9845001016",
  "dateOfBirth": "1994-02-11",
  "address": "7, Edappally, Kochi",
  "department": "Engineering",
  "designation": "Software Engineer",
  "employeeType": "FULL_TIME",
  "joiningDate": "2026-09-01",
  "status": "ACTIVE",
  "subCompanyId": "sub-001",
  "shiftId": "shift-001",
  "weeklyOff": [
    "SATURDAY",
    "SUNDAY"
  ]
}
```

**Notes**

- **Scope:** HR → own sub-company only; Admin → every sub-company of own company; Super Admin → read-only, any. Out-of-scope ids return 404. `pageSize` may go up to **200** (pickers load a whole branch).

**Response scenarios**

#### ✅ `200 OK` — Employee updated

```json
{
  "success": true,
  "message": "Employee updated successfully",
  "data": {
    "id": "emp-001",
    "employeeCode": "EMP-1016",
    "firstName": "Nikhil",
    "lastName": "Jose",
    "fullName": "Rahul Menon",
    "email": "nikhil.jose@nexustech.in",
    "phone": "+91-9845001016",
    "dateOfBirth": "1994-02-11",
    "address": "7, Edappally, Kochi",
    "avatarUrl": null,
    "department": "Engineering",
    "designation": "Software Engineer",
    "employeeType": "FULL_TIME",
    "joiningDate": "2026-09-01",
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
}
```

#### ❌ `404 Not Found` — Employee not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Employee not found",
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
      "field": "email",
      "message": "Enter a valid email address"
    },
    {
      "field": "department",
      "message": "Department \"Sales\" does not exist or is inactive"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `409 Conflict` — Employee code already used

```json
{
  "success": false,
  "code": "DUPLICATE_ENTRY",
  "message": "Employee code \"EMP-1016\" is already in use",
  "field": "employeeCode",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `403 Forbidden` — Employee is outside the caller's scope

```json
{
  "success": false,
  "code": "FORBIDDEN",
  "message": "You cannot modify employees of another sub company",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 6.5 · Activate / deactivate employee

`PATCH` `/employees/{employeeId}/status`

**Purpose:** Set a employee's status to ACTIVE or INACTIVE. Replaces the UI toggle (the server sets an explicit status instead of flipping it, so retries are safe).

- **Access:** Admin, HR
- **Used by:** EmployeesPage toggle
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `employeeId` | string | Employee id. |

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

- An INACTIVE employee stops generating attendance from the next day; history is kept.

**Response scenarios**

#### ✅ `200 OK` — Status changed

```json
{
  "success": true,
  "message": "Employee deactivated",
  "data": {
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
    "status": "INACTIVE",
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
}
```

#### ✅ `200 OK` — Already in that status (idempotent no-op)

```json
{
  "success": true,
  "message": "Employee is already ACTIVE",
  "data": {
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
}
```

#### ❌ `404 Not Found` — Employee not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Employee not found",
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

### 6.6 · Assign shift

`PATCH` `/employees/{employeeId}/shift`

**Purpose:** Assign (or clear) an employee's shift. Recalculates the employee's attendance from the effective date.

- **Access:** Admin, HR
- **Used by:** employeeService.assignShift (no dedicated UI yet; EmployeeFormDialog sets it today)
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `employeeId` | string | Employee id. |

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `shiftId` | string | **yes** | Shift id, or `null` to fall back to the sub-company default. |
| `effectiveFrom` | date (`YYYY-MM-DD`) | no | Recalculate attendance from this date. Default: today. |

```json
{
  "shiftId": "shift-002",
  "effectiveFrom": "2026-09-21"
}
```

**Notes**

- Past attendance before `effectiveFrom` is **not** changed.

**Response scenarios**

#### ✅ `200 OK` — Shift assigned

```json
{
  "success": true,
  "message": "Shift assigned",
  "data": {
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
    "shiftId": "shift-002",
    "shiftName": "Morning Shift",
    "weeklyOff": [
      "SATURDAY",
      "SUNDAY"
    ],
    "deviceId": null,
    "createdAt": "2020-03-01T09:00:00Z",
    "updatedAt": "2024-01-15T09:00:00Z"
  }
}
```

#### ❌ `404 Not Found` — Employee or shift not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Shift not found",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `422 Unprocessable Entity` — Shift is inactive or belongs to another sub-company

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "errors": [
    {
      "field": "shiftId",
      "message": "Shift does not belong to this employee's sub company"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---
