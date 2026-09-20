# 3. Sub-Companies

Branches of a company. **Employees, shifts, holidays and devices hang off sub-companies.** Super Admin manages them; Admin reads all of their company's branches; HR reads only their own.

[← Back to overview](../README.md)

## Endpoints in this module

| # | Method | Path | Purpose | Access |
|---|---|---|---|---|
| 3.1 | `GET` | `/sub-companies` | List sub-companies | Super Admin, Admin |
| 3.2 | `GET` | `/sub-companies/{subCompanyId}` | Get sub company | Super Admin, Admin, HR |
| 3.3 | `POST` | `/sub-companies` | Create sub company | Super Admin |
| 3.4 | `PUT` | `/sub-companies/{subCompanyId}` | Update sub company | Super Admin |
| 3.5 | `PATCH` | `/sub-companies/{subCompanyId}/status` | Activate / deactivate sub company | Super Admin |
| 3.6 | `GET` | `/sub-companies/{subCompanyId}/overview` | Sub-company overview | Super Admin |
| 3.7 | `PATCH` | `/sub-companies/{subCompanyId}/profile` | Edit own branch profile | Admin, HR |
| 3.8 | `POST` | `/sub-companies/{subCompanyId}/logo` | Upload sub-company logo | Admin, HR |

---

### 3.1 · List sub-companies

`GET` `/sub-companies`

**Purpose:** Paginated list of sub-companies, with filters and search. Powers the sub-companies table.

- **Access:** Super Admin, Admin
- **Used by:** SubCompaniesPage
- **Auth:** `Authorization: Bearer <accessToken>`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `page` | integer | no | Page number, starting at 1. Default `1`. |
| `pageSize` | integer | no | Rows per page. Default `10`, max `200`. |
| `search` | string | no | Case-insensitive text search. |
| `companyId` | string | no | Only sub-companies of this company. Admin: forced to own company. |
| `status` | `ACTIVE` \| `INACTIVE` | no |  |
| `sortBy` | string | no | Sort field. One of: `name`, `createdAt`. |
| `sortOrder` | `asc` \| `desc` | no | Sort direction. Default `asc`. |

**Notes**

- **Scope:** Super Admin sees all; Admin sees only their company; HR can read only their own sub-company (other ids → 404).

**Response scenarios**

#### ✅ `200 OK` — sub-companies found

```json
{
  "success": true,
  "data": [
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
    },
    {
      "id": "sub-001",
      "companyId": "company-001",
      "companyName": "Nexus Technologies Pvt Ltd",
      "name": "Nexus Kochi HQ",
      "code": "NXTECH-KOC",
      "email": "kochi@nexustech.in",
      "phone": "+91-484-2345679",
      "address": "3rd Floor, Carnival Infopark",
      "city": "Kochi",
      "state": "Kerala",
      "country": "India",
      "logoUrl": null,
      "status": "ACTIVE",
      "employeeCount": 15,
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

### 3.2 · Get sub company

`GET` `/sub-companies/{subCompanyId}`

**Purpose:** Fetch a single sub company by id.

- **Access:** Super Admin, Admin, HR
- **Used by:** SubCompanyDetailPage, HR Configuration → Company
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `subCompanyId` | string | Sub company id. |

**Notes**

- **Scope:** Super Admin sees all; Admin sees only their company; HR can read only their own sub-company (other ids → 404).

**Response scenarios**

#### ✅ `200 OK` — Sub company found

```json
{
  "success": true,
  "data": {
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
}
```

#### ❌ `404 Not Found` — Sub company does not exist (or is outside the caller's scope)

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Sub company not found",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 3.3 · Create sub company

`POST` `/sub-companies`

**Purpose:** Create a new sub company.

- **Access:** Super Admin
- **Used by:** SubCompanyFormDialog
- **Auth:** `Authorization: Bearer <accessToken>`

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `companyId` | string | **yes** | Parent company. Immutable after creation. |
| `name` | string | **yes** | 2–100 chars. |
| `code` | string | **yes** | Unique, min 2 chars. |
| `email` | email | **yes** |  |
| `phone` | string | **yes** | Min 7 chars. |
| `address` | string | **yes** | Min 5 chars. |
| `city` | string | **yes** |  |
| `state` | string | **yes** |  |
| `country` | string | **yes** |  |
| `timezone` | string | **yes** | Valid IANA zone, e.g. `Asia/Kolkata`. |
| `workingDays` | string[] | **yes** | 1–7 of `MONDAY … SUNDAY`. Default Mon–Fri. |
| `status` | `ACTIVE` \| `INACTIVE` | **yes** |  |

```json
{
  "companyId": "company-001",
  "name": "Nexus Trivandrum",
  "code": "NXTVM",
  "email": "tvm@nexustech.in",
  "phone": "+91-471-2345678",
  "address": "Technopark Phase 3",
  "city": "Trivandrum",
  "state": "Kerala",
  "country": "India",
  "timezone": "Asia/Kolkata",
  "workingDays": [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY"
  ],
  "status": "ACTIVE"
}
```

**Notes**

- **Scope:** Super Admin sees all; Admin sees only their company; HR can read only their own sub-company (other ids → 404).

**Response scenarios**

#### ✅ `201 Created` — Sub company created

```json
{
  "success": true,
  "message": "Sub company created successfully",
  "data": {
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
      "field": "workingDays",
      "message": "Select at least one working day"
    },
    {
      "field": "timezone",
      "message": "Unknown timezone \"Asia/Nowhere\""
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `409 Conflict` — Sub-company code already used

```json
{
  "success": false,
  "code": "DUPLICATE_ENTRY",
  "message": "A sub company with code \"NXTVM\" already exists",
  "field": "code",
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

#### ❌ `404 Not Found` — Parent company not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Company not found",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `422 Unprocessable Entity` — Parent company is inactive

```json
{
  "success": false,
  "code": "BUSINESS_RULE_VIOLATION",
  "message": "Cannot add a sub company to an inactive company",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 3.4 · Update sub company

`PUT` `/sub-companies/{subCompanyId}`

**Purpose:** Replace the editable fields of a sub company.

- **Access:** Super Admin
- **Used by:** SubCompanyFormDialog (edit)
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `subCompanyId` | string | Sub company id. |

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | **yes** | 2–100 chars. |
| `code` | string | **yes** | Unique, min 2 chars. |
| `email` | email | **yes** |  |
| `phone` | string | **yes** | Min 7 chars. |
| `address` | string | **yes** | Min 5 chars. |
| `city` | string | **yes** |  |
| `state` | string | **yes** |  |
| `country` | string | **yes** |  |
| `timezone` | string | **yes** | Valid IANA zone, e.g. `Asia/Kolkata`. |
| `workingDays` | string[] | **yes** | 1–7 of `MONDAY … SUNDAY`. Default Mon–Fri. |
| `status` | `ACTIVE` \| `INACTIVE` | **yes** |  |

```json
{
  "companyId": "company-001",
  "name": "Nexus Trivandrum",
  "code": "NXTVM",
  "email": "tvm@nexustech.in",
  "phone": "+91-471-2345678",
  "address": "Technopark Phase 3",
  "city": "Trivandrum",
  "state": "Kerala",
  "country": "India",
  "timezone": "Asia/Kolkata",
  "workingDays": [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY"
  ],
  "status": "ACTIVE"
}
```

**Notes**

- **Scope:** Super Admin sees all; Admin sees only their company; HR can read only their own sub-company (other ids → 404).

**Response scenarios**

#### ✅ `200 OK` — Sub company updated

```json
{
  "success": true,
  "message": "Sub company updated successfully",
  "data": {
    "id": "sub-002",
    "companyId": "company-001",
    "companyName": "Nexus Technologies Pvt Ltd",
    "name": "Nexus Trivandrum",
    "code": "NXTVM",
    "email": "tvm@nexustech.in",
    "phone": "+91-471-2345678",
    "address": "Technopark Phase 3",
    "city": "Trivandrum",
    "state": "Kerala",
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
}
```

#### ❌ `404 Not Found` — Sub company not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Sub company not found",
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
      "field": "workingDays",
      "message": "Select at least one working day"
    },
    {
      "field": "timezone",
      "message": "Unknown timezone \"Asia/Nowhere\""
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `409 Conflict` — Sub-company code already used

```json
{
  "success": false,
  "code": "DUPLICATE_ENTRY",
  "message": "A sub company with code \"NXTVM\" already exists",
  "field": "code",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 3.5 · Activate / deactivate sub company

`PATCH` `/sub-companies/{subCompanyId}/status`

**Purpose:** Set a sub company's status to ACTIVE or INACTIVE. Replaces the UI toggle (the server sets an explicit status instead of flipping it, so retries are safe).

- **Access:** Super Admin
- **Used by:** SubCompaniesPage / SubCompanyDetailPage toggle
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `subCompanyId` | string | Sub company id. |

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

- Deactivating a sub-company blocks sign-in for its HR users and stops attendance processing for it.

**Response scenarios**

#### ✅ `200 OK` — Status changed

```json
{
  "success": true,
  "message": "Sub company deactivated",
  "data": {
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
    "status": "INACTIVE",
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
}
```

#### ✅ `200 OK` — Already in that status (idempotent no-op)

```json
{
  "success": true,
  "message": "Sub company is already ACTIVE",
  "data": {
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
}
```

#### ❌ `404 Not Found` — Sub company not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Sub company not found",
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

### 3.6 · Sub-company overview

`GET` `/sub-companies/{subCompanyId}/overview`

**Purpose:** Everything the Sub-company detail page needs: info, live counts, today's attendance summary, employees per department, shifts and holiday count.

- **Access:** Super Admin
- **Used by:** SubCompanyDetailPage
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `subCompanyId` | string | Sub-company id. |

**Response scenarios**

#### ✅ `200 OK` — Overview

```json
{
  "success": true,
  "data": {
    "subCompany": {
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
    },
    "stats": {
      "employees": 5,
      "hrUsers": 1,
      "devices": {
        "total": 3,
        "online": 2
      },
      "holidaysThisYear": 6
    },
    "attendanceToday": {
      "date": "2026-09-20",
      "total": 5,
      "present": 4,
      "absent": 1,
      "late": 0,
      "earlyOut": 0,
      "missingPunch": 0,
      "onLeave": 0,
      "holiday": 0,
      "weeklyOff": 0,
      "overtimeMinutes": 0
    },
    "departments": [
      {
        "name": "Engineering",
        "count": 4
      },
      {
        "name": "Data Science",
        "count": 1
      }
    ],
    "shifts": [
      {
        "id": "shift-005",
        "name": "General Shift",
        "startTime": "09:30",
        "endTime": "18:30"
      },
      {
        "id": "shift-006",
        "name": "US Shift",
        "startTime": "18:00",
        "endTime": "03:00"
      }
    ]
  }
}
```

#### ❌ `404 Not Found` — Sub-company not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Sub company not found",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 3.7 · Edit own branch profile

`PATCH` `/sub-companies/{subCompanyId}/profile`

**Purpose:** Lets HR (own sub-company) and Admin (any sub-company of their company) edit contact details, timezone and working days. Backs the Configuration → Company tab (its Save button is a stub today). Does **not** allow changing name/code/status/parent — those stay with the Super Admin.

- **Access:** Admin, HR
- **Used by:** ConfigurationPage → Company tab
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `subCompanyId` | string | Sub-company id. |

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `email` | email | no |  |
| `phone` | string | no | Min 7 chars. |
| `address` | string | no | Min 5 chars. |
| `timezone` | string | no | IANA zone. |
| `workingDays` | string[] | no | 1–7 weekdays. |

```json
{
  "email": "kochi@nexustech.in",
  "phone": "+91-484-2345679",
  "address": "3rd Floor, Carnival Infopark",
  "timezone": "Asia/Kolkata",
  "workingDays": [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY"
  ]
}
```

**Notes**

- Changing `timezone` or `workingDays` triggers an attendance recalculation for the current month (background job).

**Response scenarios**

#### ✅ `200 OK` — Profile updated

```json
{
  "success": true,
  "message": "Branch profile updated",
  "data": {
    "id": "sub-001",
    "companyId": "company-001",
    "companyName": "Nexus Technologies Pvt Ltd",
    "name": "Nexus Kochi HQ",
    "code": "NXTECH-KOC",
    "email": "kochi@nexustech.in",
    "phone": "+91-484-2345679",
    "address": "3rd Floor, Carnival Infopark",
    "city": "Kochi",
    "state": "Kerala",
    "country": "India",
    "logoUrl": null,
    "status": "ACTIVE",
    "employeeCount": 15,
    "deviceCount": 3,
    "hrCount": 1,
    "timezone": "Asia/Kolkata",
    "workingDays": [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY"
    ],
    "createdAt": "2022-05-10T09:00:00Z",
    "updatedAt": "2024-08-15T11:00:00Z"
  }
}
```

#### ❌ `403 Forbidden` — HR tried to edit another sub-company

```json
{
  "success": false,
  "code": "FORBIDDEN",
  "message": "You can only edit your own sub company",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `422 Unprocessable Entity` — Invalid value

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "errors": [
    {
      "field": "timezone",
      "message": "Unknown timezone \"Asia/Nowhere\""
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `422 Unprocessable Entity` — Immutable field supplied

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "errors": [
    {
      "field": "name",
      "message": "This field can only be changed by a Super Admin"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 3.8 · Upload sub-company logo

`POST` `/sub-companies/{subCompanyId}/logo`

**Purpose:** Upload / replace the branch logo.

- **Access:** Admin, HR
- **Used by:** ConfigurationPage → Branding (not wired yet)
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `subCompanyId` | string | Sub-company id. |

**Request body** (`multipart/form-data`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `file` | file | **yes** | PNG or JPG, max 2 MB. |

```json
{
  "file": "(binary)"
}
```

**Response scenarios**

#### ✅ `200 OK` — Logo stored

```json
{
  "success": true,
  "message": "Logo updated",
  "data": {
    "logoUrl": "https://cdn.example.com/logos/sub-001.png"
  }
}
```

#### ❌ `413 Payload Too Large` — Too large

```json
{
  "success": false,
  "code": "FILE_TOO_LARGE",
  "message": "Logo must be 2 MB or smaller",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `415 Unsupported Media Type` — Wrong type

```json
{
  "success": false,
  "code": "UNSUPPORTED_MEDIA_TYPE",
  "message": "Only PNG and JPG images are allowed",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---
