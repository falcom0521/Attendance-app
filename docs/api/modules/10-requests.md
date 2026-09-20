# 10. Requests & Leaves

Regularization, missing-punch and leave requests with an approval workflow: **HR raises → Admin approves/rejects**; requests raised by an Admin are auto-approved. An approved request is applied to attendance (a manual entry, or `ON_LEAVE` days). 

> **Status:** the Requests and Leaves screens are commented out in the frontend for now. These endpoints are specified so they can be switched on later without redesign.

[← Back to overview](../README.md)

## Endpoints in this module

| # | Method | Path | Purpose | Access |
|---|---|---|---|---|
| 10.1 | `GET` | `/requests` | List requests | Admin, HR |
| 10.2 | `GET` | `/requests/{requestId}` | Get request | Admin, HR |
| 10.3 | `POST` | `/requests` | Create request | Admin, HR |
| 10.4 | `POST` | `/requests/{requestId}/approve` | Approve request | Admin |
| 10.5 | `POST` | `/requests/{requestId}/reject` | Reject request | Admin |
| 10.6 | `POST` | `/requests/{requestId}/cancel` | Cancel / revoke request | Admin, HR |
| 10.7 | `GET` | `/leaves/balances` | Leave balances | Admin, HR |
| 10.8 | `GET` | `/leaves/balances/{employeeId}` | One employee's leave balance | Admin, HR |
| 10.9 | `GET` | `/leaves/policy` | Get leave policy | Super Admin, Admin, HR |
| 10.10 | `PUT` | `/leaves/policy` | Update leave policy | Admin |

---

### 10.1 · List requests

`GET` `/requests`

**Purpose:** Requests visible to the caller, newest first. Filter by status/type for the Pending / Approved / Rejected tabs, or by type `LEAVE` for the leave history.

- **Access:** Admin, HR
- **Used by:** RequestsPage, LeavePage (history), AttendanceDetailPage ("requests for this day")
- **Auth:** `Authorization: Bearer <accessToken>`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `status` | `PENDING` \| `APPROVED` \| `REJECTED` \| `CANCELLED` | no |  |
| `type` | `REGULARIZATION` \| `MISSING_PUNCH` \| `LEAVE` | no |  |
| `employeeId` | string | no |  |
| `date` | date (`YYYY-MM-DD`) | no | Requests covering this date (a leave range matches every day inside it). |
| `subCompanyId` | string | no | HR: forced to own. Admin: optional. |
| `companyId` | string | no | Admin: forced to own company. |
| `search` | string | no | Case-insensitive text search. |
| `page` | integer | no | Page number, starting at 1. Default `1`. |
| `pageSize` | integer | no | Rows per page. Default `10`, max `200`. |

**Notes**

- The response also carries `counts` for the tab badges (independent of the `status` filter).

**Response scenarios**

#### ✅ `200 OK` — Requests

```json
{
  "success": true,
  "data": [
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
    },
    {
      "id": "req-0003",
      "type": "LEAVE",
      "status": "PENDING",
      "employeeId": "emp-002",
      "employeeCode": "EMP-1002",
      "employeeName": "Aishwarya Nair",
      "department": "Engineering",
      "companyId": "company-001",
      "subCompanyId": "sub-001",
      "subCompanyName": "Nexus Kochi HQ",
      "date": "2026-09-23",
      "endDate": "2026-09-25",
      "punches": null,
      "leaveType": "CASUAL",
      "leaveDays": 3,
      "reason": "Family function out of town",
      "requestedBy": "Divya Menon",
      "requestedByRole": "HR",
      "requestedAt": "2026-09-20T01:29:00Z",
      "reviewedBy": null,
      "reviewComment": null,
      "reviewedAt": null
    }
  ],
  "counts": {
    "PENDING": 5,
    "APPROVED": 3,
    "REJECTED": 1,
    "CANCELLED": 0
  },
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 9,
    "totalPages": 1
  }
}
```

#### ✅ `200 OK` — None match

```json
{
  "success": true,
  "data": [],
  "counts": {
    "PENDING": 0,
    "APPROVED": 0,
    "REJECTED": 0,
    "CANCELLED": 0
  },
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 0,
    "totalPages": 1
  }
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 10.2 · Get request

`GET` `/requests/{requestId}`

**Purpose:** One request with its full audit trail (who raised it, who reviewed it, comments).

- **Access:** Admin, HR
- **Used by:** RequestReviewDialog
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `requestId` | string | Request id. |

**Response scenarios**

#### ✅ `200 OK` — Request

```json
{
  "success": true,
  "data": {
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
}
```

#### ❌ `404 Not Found` — Not found / out of scope

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Request not found",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 10.3 · Create request

`POST` `/requests`

**Purpose:** Raise a correction or leave request. HR requests start as `PENDING`; Admin requests are validated, applied immediately and returned as `APPROVED`.

- **Access:** Admin, HR
- **Used by:** RequestFormDialog
- **Auth:** `Authorization: Bearer <accessToken>`

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `type` | `REGULARIZATION` \| `MISSING_PUNCH` \| `LEAVE` | **yes** |  |
| `employeeId` | string | **yes** | Active employee in scope. |
| `date` | date (`YYYY-MM-DD`) | **yes** | Attendance date (corrections: today or earlier) or leave start date. |
| `endDate` | date (`YYYY-MM-DD`) | no | LEAVE only. Defaults to `date`. Max 60 days. |
| `punches` | object[] | no | REGULARIZATION / MISSING_PUNCH. `[{ punchIn, punchOut }]` as `HH:mm`. MISSING_PUNCH sends only the missing side. |
| `leaveType` | `CASUAL` \| `SICK` \| `EARNED` \| `UNPAID` | no | Required for LEAVE. |
| `reason` | string | **yes** | Min 5 characters. |

```json
{
  "type": "MISSING_PUNCH",
  "employeeId": "emp-006",
  "date": "2026-09-20",
  "punches": [
    {
      "punchIn": "",
      "punchOut": "18:05"
    }
  ],
  "reason": "Forgot to punch out; left at 6:05 PM after the release call"
}
```

**Notes**

- **Business rules** (each is a 422 `BUSINESS_RULE_VIOLATION`): a MISSING_PUNCH is only allowed on an `INCOMPLETE` day · one PENDING request per employee/date/type · leave may not overlap another pending/approved leave · leave must contain at least one working day · leave (except UNPAID) may not exceed the remaining balance.
- Leave example body: `{ "type":"LEAVE", "employeeId":"emp-002", "date":"2026-09-23", "endDate":"2026-09-25", "leaveType":"CASUAL", "reason":"Family function out of town" }`.

**Response scenarios**

#### ✅ `201 Created` — HR request submitted (PENDING)

```json
{
  "success": true,
  "message": "Request submitted for approval",
  "data": {
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
}
```

#### ✅ `201 Created` — Admin request auto-approved and applied

```json
{
  "success": true,
  "message": "Request approved and applied",
  "data": {
    "id": "req-0003",
    "type": "LEAVE",
    "status": "APPROVED",
    "employeeId": "emp-002",
    "employeeCode": "EMP-1002",
    "employeeName": "Aishwarya Nair",
    "department": "Engineering",
    "companyId": "company-001",
    "subCompanyId": "sub-001",
    "subCompanyName": "Nexus Kochi HQ",
    "date": "2026-09-23",
    "endDate": "2026-09-25",
    "punches": null,
    "leaveType": "CASUAL",
    "leaveDays": 3,
    "reason": "Family function out of town",
    "requestedBy": "Meera Nambiar",
    "requestedByRole": "ADMIN",
    "requestedAt": "2026-09-20T01:29:00Z",
    "reviewedBy": "Meera Nambiar",
    "reviewComment": "Auto-approved (raised by Admin)",
    "reviewedAt": "2026-09-20T09:30:00Z"
  }
}
```

#### ❌ `422 Unprocessable Entity` — Field validation failed

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "errors": [
    {
      "field": "reason",
      "message": "Please provide a reason (min 5 characters)"
    },
    {
      "field": "leaveType",
      "message": "Select a leave type"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `422 Unprocessable Entity` — MISSING_PUNCH on a day without a missing punch

```json
{
  "success": false,
  "code": "BUSINESS_RULE_VIOLATION",
  "message": "This day has no missing punch — use a regularization request instead",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `422 Unprocessable Entity` — Leave exceeds balance

```json
{
  "success": false,
  "code": "BUSINESS_RULE_VIOLATION",
  "message": "Only 9 day(s) of casual leave remaining",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `422 Unprocessable Entity` — Leave overlaps an existing request

```json
{
  "success": false,
  "code": "BUSINESS_RULE_VIOLATION",
  "message": "This overlaps an existing leave request for the employee",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `422 Unprocessable Entity` — Leave falls only on offs/holidays

```json
{
  "success": false,
  "code": "BUSINESS_RULE_VIOLATION",
  "message": "Selected dates fall entirely on weekly offs or holidays",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `409 Conflict` — A pending request already exists

```json
{
  "success": false,
  "code": "REQUEST_ALREADY_PENDING",
  "message": "A pending request already exists for this employee and date",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `403 Forbidden` — Employee outside caller's scope

```json
{
  "success": false,
  "code": "FORBIDDEN",
  "message": "You cannot raise requests for this employee",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 10.4 · Approve request

`POST` `/requests/{requestId}/approve`

**Purpose:** Approve a pending request and apply it: corrections become a manual entry on that day; leave marks the working days `ON_LEAVE`.

- **Access:** Admin
- **Used by:** RequestReviewDialog → Approve
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `requestId` | string | Request id. |

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `comment` | string | no | Optional note to the requester. |

```json
{
  "comment": "Verified with the security log"
}
```

**Notes**

- Only **Admin** can approve. Approval and application happen in one transaction — if applying fails, the request stays PENDING.

**Response scenarios**

#### ✅ `200 OK` — Approved and applied

```json
{
  "success": true,
  "message": "Request approved",
  "data": {
    "id": "req-0001",
    "type": "MISSING_PUNCH",
    "status": "APPROVED",
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
    "reviewedBy": "Meera Nambiar",
    "reviewComment": "Verified with the security log",
    "reviewedAt": "2026-09-20T10:05:00Z"
  }
}
```

#### ❌ `403 Forbidden` — Caller is HR

```json
{
  "success": false,
  "code": "FORBIDDEN",
  "message": "Only an Admin can approve or reject requests",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `404 Not Found` — Request not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Request not found",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `409 Conflict` — Already reviewed / cancelled

```json
{
  "success": false,
  "code": "REQUEST_NOT_PENDING",
  "message": "Request is already approved",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `422 Unprocessable Entity` — Could not be applied (data changed since it was raised)

```json
{
  "success": false,
  "code": "BUSINESS_RULE_VIOLATION",
  "message": "Cannot enter attendance for a future date",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 10.5 · Reject request

`POST` `/requests/{requestId}/reject`

**Purpose:** Reject a pending request. A comment is mandatory so the requester knows why.

- **Access:** Admin
- **Used by:** RequestReviewDialog → Reject
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `requestId` | string | Request id. |

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `comment` | string | **yes** | Min 3 characters. |

```json
{
  "comment": "No approval from the reporting manager on record"
}
```

**Response scenarios**

#### ✅ `200 OK` — Rejected

```json
{
  "success": true,
  "message": "Request rejected",
  "data": {
    "id": "req-0001",
    "type": "MISSING_PUNCH",
    "status": "REJECTED",
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
    "reviewedBy": "Meera Nambiar",
    "reviewComment": "No approval from the reporting manager on record",
    "reviewedAt": "2026-09-20T10:05:00Z"
  }
}
```

#### ❌ `422 Unprocessable Entity` — Comment missing

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "errors": [
    {
      "field": "comment",
      "message": "A comment is required to reject"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `403 Forbidden` — Caller is HR

```json
{
  "success": false,
  "code": "FORBIDDEN",
  "message": "Only an Admin can approve or reject requests",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `404 Not Found` — Request not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Request not found",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `409 Conflict` — Not pending

```json
{
  "success": false,
  "code": "REQUEST_NOT_PENDING",
  "message": "Request is already rejected",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 10.6 · Cancel / revoke request

`POST` `/requests/{requestId}/cancel`

**Purpose:** Withdraw a **pending** request (HR or Admin). An **Admin** can also revoke an already-approved **leave**, which removes its `ON_LEAVE` days.

- **Access:** Admin, HR
- **Used by:** RequestReviewDialog → Cancel request / Revoke leave
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `requestId` | string | Request id. |

**Response scenarios**

#### ✅ `200 OK` — Cancelled

```json
{
  "success": true,
  "message": "Request cancelled",
  "data": {
    "id": "req-0001",
    "type": "MISSING_PUNCH",
    "status": "CANCELLED",
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
    "reviewedBy": "Divya Menon",
    "reviewComment": "Cancelled by requester",
    "reviewedAt": "2026-09-20T10:10:00Z"
  }
}
```

#### ❌ `404 Not Found` — Request not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Request not found",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `409 Conflict` — Already reviewed (and not an approved leave being revoked by an Admin)

```json
{
  "success": false,
  "code": "REQUEST_NOT_PENDING",
  "message": "Only pending requests can be cancelled",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 10.7 · Leave balances

`GET` `/leaves/balances`

**Purpose:** Leave entitlement / used / pending for every active employee in scope, for one year.

- **Access:** Admin, HR
- **Used by:** LeavePage → Balances tab
- **Auth:** `Authorization: Bearer <accessToken>`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `year` | integer | no | Default: current year. |
| `subCompanyId` | string | no | HR: forced to own. Admin: optional. |
| `companyId` | string | no | Admin: forced to own company. |
| `search` | string | no | Case-insensitive text search. |
| `page` | integer | no | Page number, starting at 1. Default `1`. |
| `pageSize` | integer | no | Rows per page. Default `10`, max `200`. |

**Response scenarios**

#### ✅ `200 OK` — Balances

```json
{
  "success": true,
  "data": [
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
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

#### ❌ `422 Unprocessable Entity` — Bad year

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "errors": [
    {
      "field": "year",
      "message": "Must be a 4-digit year"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 10.8 · One employee's leave balance

`GET` `/leaves/balances/{employeeId}`

**Purpose:** Balance for a single employee (used to show "N days left" while applying leave).

- **Access:** Admin, HR
- **Used by:** RequestFormDialog (leave)
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `employeeId` | string |  |

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `year` | integer | no | Default: current year. |

**Response scenarios**

#### ✅ `200 OK` — Balance

```json
{
  "success": true,
  "data": {
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
}
```

#### ❌ `404 Not Found` — Employee not found in scope

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

### 10.9 · Get leave policy

`GET` `/leaves/policy`

**Purpose:** Annual quota per leave type for the company (today hard-coded: 12 casual, 10 sick, 15 earned).

- **Access:** Super Admin, Admin, HR
- **Used by:** Not in UI yet
- **Auth:** `Authorization: Bearer <accessToken>`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `companyId` | string | no | Required for Super Admin. |

**Response scenarios**

#### ✅ `200 OK` — Policy

```json
{
  "success": true,
  "data": {
    "companyId": "company-001",
    "quotas": {
      "CASUAL": 12,
      "SICK": 10,
      "EARNED": 15
    },
    "carryForward": false,
    "updatedAt": "2026-01-01T00:00:00Z"
  }
}
```

#### ❌ `422 Unprocessable Entity` — Super Admin without companyId

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "errors": [
    {
      "field": "companyId",
      "message": "companyId is required"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 10.10 · Update leave policy

`PUT` `/leaves/policy`

**Purpose:** Change the yearly quotas. Applies from the next balance calculation; existing usage is kept.

- **Access:** Admin
- **Used by:** Not in UI yet
- **Auth:** `Authorization: Bearer <accessToken>`

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `quotas` | object | **yes** | `{ CASUAL, SICK, EARNED }` each an integer 0–365. |
| `carryForward` | boolean | no | Reserved. |

```json
{
  "quotas": {
    "CASUAL": 12,
    "SICK": 10,
    "EARNED": 18
  },
  "carryForward": false
}
```

**Response scenarios**

#### ✅ `200 OK` — Updated

```json
{
  "success": true,
  "message": "Leave policy updated",
  "data": {
    "companyId": "company-001",
    "quotas": {
      "CASUAL": 12,
      "SICK": 10,
      "EARNED": 18
    },
    "carryForward": false,
    "updatedAt": "2026-09-20T10:00:00Z"
  }
}
```

#### ❌ `422 Unprocessable Entity` — Invalid quota

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "errors": [
    {
      "field": "quotas.EARNED",
      "message": "Must be between 0 and 365"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `409 Conflict` — Quota lower than days already used

```json
{
  "success": false,
  "code": "QUOTA_BELOW_USAGE",
  "message": "Casual quota cannot be lower than the 14 days already used by an employee",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---
