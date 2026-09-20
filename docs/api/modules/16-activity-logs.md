# 16. Activity Logs

Immutable audit trail of every state-changing action (create, update, delete, activate, allocate, approve…). **Written by the server** from the authenticated request — clients never post log entries. Super Admin only.

[← Back to overview](../README.md)

## Endpoints in this module

| # | Method | Path | Purpose | Access |
|---|---|---|---|---|
| 16.1 | `GET` | `/activity-logs` | List activity logs | Super Admin |
| 16.2 | `GET` | `/activity-logs/{logId}` | Get activity log entry | Super Admin |

---

### 16.1 · List activity logs

`GET` `/activity-logs`

**Purpose:** Filterable, paginated audit trail, newest first. Also used embedded: a company's Activity tab (`companyId`) and a user's "recent activity" (`userId`).

- **Access:** Super Admin
- **Used by:** ActivityLogsPage, CompanyDetailPage → Activity, UserDetailDialog, Super Admin dashboard (recent)
- **Auth:** `Authorization: Bearer <accessToken>`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `page` | integer | no | Page number, starting at 1. Default `1`. |
| `pageSize` | integer | no | Rows per page. Default `10`, max `200`. |
| `search` | string | no | Case-insensitive text search. |
| `module` | string | no | Companies, Sub Companies, Devices, Users, Employees, Shifts, Holidays, Attendance, Requests, Configuration. |
| `action` | `CREATED` \| `UPDATED` \| `DELETED` \| `ACTIVATED` \| `DEACTIVATED` \| `ALLOCATED` \| `DEALLOCATED` \| `APPROVED` \| `REJECTED` \| `CANCELLED` | no |  |
| `role` | `SUPER_ADMIN` \| `ADMIN` \| `HR` | no | Role of the actor. |
| `userId` | string | no | Actor. |
| `companyId` | string | no |  |
| `startDate` | date (`YYYY-MM-DD`) | no | Inclusive. |
| `endDate` | date (`YYYY-MM-DD`) | no | Inclusive. |

**Response scenarios**

#### ✅ `200 OK` — Logs

```json
{
  "success": true,
  "data": [
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
  ],
  "pagination": {
    "page": 1,
    "pageSize": 15,
    "total": 16,
    "totalPages": 2
  }
}
```

#### ✅ `200 OK` — No matches

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 15,
    "total": 0,
    "totalPages": 1
  }
}
```

#### ❌ `422 Unprocessable Entity` — Reversed date range

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "errors": [
    {
      "field": "endDate",
      "message": "End date must be on or after start date"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `403 Forbidden` — Caller is not a Super Admin

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

### 16.2 · Get activity log entry

`GET` `/activity-logs/{logId}`

**Purpose:** One audit entry (for deep links / support).

- **Access:** Super Admin
- **Used by:** Not in UI yet
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `logId` | string | Log id. |

**Response scenarios**

#### ✅ `200 OK` — Entry

```json
{
  "success": true,
  "data": {
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
}
```

#### ❌ `404 Not Found` — Not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Activity log not found",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---
