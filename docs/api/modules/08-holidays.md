# 8. Holidays

Public holidays per sub-company. A holiday date turns everyone's attendance for that day into `HOLIDAY`.

[← Back to overview](../README.md)

## Endpoints in this module

| # | Method | Path | Purpose | Access |
|---|---|---|---|---|
| 8.1 | `GET` | `/holidays` | List holidays | Super Admin, Admin, HR |
| 8.2 | `POST` | `/holidays` | Create holiday | Admin, HR |
| 8.3 | `PUT` | `/holidays/{holidayId}` | Update holiday | Admin, HR |
| 8.4 | `DELETE` | `/holidays/{holidayId}` | Delete holiday | Admin, HR |

---

### 8.1 · List holidays

`GET` `/holidays`

**Purpose:** Paginated list of holidays, with filters and search. Powers the holidays table.

- **Access:** Super Admin, Admin, HR
- **Used by:** HolidaysPage, Sub-company detail
- **Auth:** `Authorization: Bearer <accessToken>`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `page` | integer | no | Page number, starting at 1. Default `1`. |
| `pageSize` | integer | no | Rows per page. Default `10`, max `200`. |
| `search` | string | no | Case-insensitive text search. |
| `year` | integer | no | Calendar year. Default: current year. |
| `subCompanyId` | string | no | HR: forced to own. Admin: optional. |
| `companyId` | string | no | Admin: forced to own company. |
| `status` | `ACTIVE` \| `INACTIVE` | no |  |
| `sortBy` | string | no | Sort field. One of: `date`, `name`. |
| `sortOrder` | `asc` \| `desc` | no | Sort direction. Default `asc`. |

**Notes**

- Sorted by `date` ascending by default. Changing a holiday recalculates attendance for that date.

**Response scenarios**

#### ✅ `200 OK` — holidays found

```json
{
  "success": true,
  "data": [
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
    },
    {
      "id": "hol-003",
      "name": "Holi",
      "date": "2026-03-21",
      "description": "Festival of Colors",
      "status": "ACTIVE",
      "companyId": "company-001",
      "subCompanyId": "sub-001",
      "year": 2026,
      "createdAt": "2025-12-01T09:00:00Z",
      "updatedAt": "2025-12-01T09:00:00Z"
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

### 8.2 · Create holiday

`POST` `/holidays`

**Purpose:** Create a new holiday.

- **Access:** Admin, HR
- **Used by:** HolidayFormDialog
- **Auth:** `Authorization: Bearer <accessToken>`

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | **yes** | 2–100 chars. |
| `date` | date (`YYYY-MM-DD`) | **yes** | `YYYY-MM-DD`. Unique per sub-company. |
| `description` | string | no |  |
| `status` | `ACTIVE` \| `INACTIVE` | **yes** |  |
| `subCompanyId` | string | **yes** | HR: forced to own. Admin: choose. Immutable after creation. |

```json
{
  "name": "Onam",
  "date": "2026-08-26",
  "description": "Harvest festival",
  "status": "ACTIVE",
  "subCompanyId": "sub-001"
}
```

**Notes**

- Sorted by `date` ascending by default. Changing a holiday recalculates attendance for that date.

**Response scenarios**

#### ✅ `201 Created` — Holiday created

```json
{
  "success": true,
  "message": "Holiday created successfully",
  "data": {
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
      "field": "date",
      "message": "Enter a valid date (YYYY-MM-DD)"
    },
    {
      "field": "name",
      "message": "Name must be at least 2 characters"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `409 Conflict` — Date already has a holiday

```json
{
  "success": false,
  "code": "DUPLICATE_ENTRY",
  "message": "A holiday already exists on 2026-08-26 for this sub company",
  "field": "date",
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

### 8.3 · Update holiday

`PUT` `/holidays/{holidayId}`

**Purpose:** Replace the editable fields of a holiday.

- **Access:** Admin, HR
- **Used by:** HolidayFormDialog (edit)
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `holidayId` | string | Holiday id. |

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | **yes** |  |
| `date` | date (`YYYY-MM-DD`) | **yes** |  |
| `description` | string | no |  |
| `status` | `ACTIVE` \| `INACTIVE` | **yes** |  |

```json
{
  "name": "Onam",
  "date": "2026-08-26",
  "description": "Harvest festival",
  "status": "ACTIVE",
  "subCompanyId": "sub-001"
}
```

**Notes**

- Sorted by `date` ascending by default. Changing a holiday recalculates attendance for that date.

**Response scenarios**

#### ✅ `200 OK` — Holiday updated

```json
{
  "success": true,
  "message": "Holiday updated successfully",
  "data": {
    "id": "hol-002",
    "name": "Onam",
    "date": "2026-08-26",
    "description": "Harvest festival",
    "status": "ACTIVE",
    "companyId": "company-001",
    "subCompanyId": "sub-001",
    "year": 2026,
    "createdAt": "2025-12-01T09:00:00Z",
    "updatedAt": "2025-12-01T09:00:00Z"
  }
}
```

#### ❌ `404 Not Found` — Holiday not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Holiday not found",
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
      "field": "date",
      "message": "Enter a valid date (YYYY-MM-DD)"
    },
    {
      "field": "name",
      "message": "Name must be at least 2 characters"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `409 Conflict` — Date already has a holiday

```json
{
  "success": false,
  "code": "DUPLICATE_ENTRY",
  "message": "A holiday already exists on 2026-08-26 for this sub company",
  "field": "date",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 8.4 · Delete holiday

`DELETE` `/holidays/{holidayId}`

**Purpose:** Delete a holiday.

- **Access:** Admin, HR
- **Used by:** HolidaysPage
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `holidayId` | string | Holiday id. |

**Notes**

- The lock rule is optional; without a payroll lock the delete always succeeds.

**Response scenarios**

#### ✅ `200 OK` — Holiday deleted

```json
{
  "success": true,
  "message": "Holiday deleted successfully",
  "data": null
}
```

#### ❌ `404 Not Found` — Holiday not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Holiday not found",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `409 Conflict` — Past holiday in a locked payroll period (optional rule)

```json
{
  "success": false,
  "code": "PERIOD_LOCKED",
  "message": "Holiday is in the past and its attendance is locked",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---
