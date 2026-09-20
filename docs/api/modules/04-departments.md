# 4. Departments

Company-level classification of employees (Engineering, HR, Finance…). One list shared by every sub-company of a company.

[← Back to overview](../README.md)

## Endpoints in this module

| # | Method | Path | Purpose | Access |
|---|---|---|---|---|
| 4.1 | `GET` | `/departments` | List departments | Super Admin, Admin, HR |
| 4.2 | `GET` | `/departments/{departmentId}` | Get department | Super Admin, Admin, HR |
| 4.3 | `POST` | `/departments` | Create department | Admin, HR |
| 4.4 | `PUT` | `/departments/{departmentId}` | Update department | Admin, HR |
| 4.5 | `PATCH` | `/departments/{departmentId}/status` | Activate / deactivate department | Admin, HR |
| 4.6 | `DELETE` | `/departments/{departmentId}` | Delete department | Admin, HR |

---

### 4.1 · List departments

`GET` `/departments`

**Purpose:** Paginated list of departments, with filters and search. Powers the departments table.

- **Access:** Super Admin, Admin, HR
- **Used by:** DepartmentsPage, employee / attendance / report filters
- **Auth:** `Authorization: Bearer <accessToken>`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `page` | integer | no | Page number, starting at 1. Default `1`. |
| `pageSize` | integer | no | Rows per page. Default `10`, max `200`. |
| `search` | string | no | Case-insensitive text search. |
| `companyId` | string | no | Required for Super Admin. Admin/HR: forced to their own company. |
| `status` | `ACTIVE` \| `INACTIVE` | no | Employee pickers use `ACTIVE`. |
| `sortBy` | string | no | Sort field. One of: `name`, `createdAt`. |
| `sortOrder` | `asc` \| `desc` | no | Sort direction. Default `asc`. |

**Notes**

- The company is taken from the caller's token; only a Super Admin passes `companyId`.

**Response scenarios**

#### ✅ `200 OK` — departments found

```json
{
  "success": true,
  "data": [
    {
      "id": "dept-company-001-1",
      "name": "Engineering",
      "description": "Software engineering and QA",
      "status": "ACTIVE",
      "companyId": "company-001",
      "createdAt": "2023-01-05T09:00:00Z",
      "updatedAt": "2023-01-05T09:00:00Z"
    },
    {
      "id": "dept-company-001-2",
      "name": "Finance",
      "description": "Accounts and payroll",
      "status": "ACTIVE",
      "companyId": "company-001",
      "createdAt": "2023-01-05T09:00:00Z",
      "updatedAt": "2023-01-05T09:00:00Z"
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

### 4.2 · Get department

`GET` `/departments/{departmentId}`

**Purpose:** Fetch a single department by id.

- **Access:** Super Admin, Admin, HR
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `departmentId` | string | Department id. |

**Notes**

- The company is taken from the caller's token; only a Super Admin passes `companyId`.

**Response scenarios**

#### ✅ `200 OK` — Department found

```json
{
  "success": true,
  "data": {
    "id": "dept-company-001-1",
    "name": "Engineering",
    "description": "Software engineering and QA",
    "status": "ACTIVE",
    "companyId": "company-001",
    "createdAt": "2023-01-05T09:00:00Z",
    "updatedAt": "2023-01-05T09:00:00Z"
  }
}
```

#### ❌ `404 Not Found` — Department does not exist (or is outside the caller's scope)

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Department not found",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 4.3 · Create department

`POST` `/departments`

**Purpose:** Create a new department.

- **Access:** Admin, HR
- **Used by:** DepartmentFormDialog
- **Auth:** `Authorization: Bearer <accessToken>`

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | **yes** | 2–60 chars. Unique within the company (case-insensitive). |
| `description` | string | no | Max 200 chars. |
| `status` | `ACTIVE` \| `INACTIVE` | **yes** |  |

```json
{
  "name": "Finance",
  "description": "Accounts and payroll",
  "status": "ACTIVE"
}
```

**Notes**

- The company is taken from the caller's token; only a Super Admin passes `companyId`.

**Response scenarios**

#### ✅ `201 Created` — Department created

```json
{
  "success": true,
  "message": "Department created successfully",
  "data": {
    "id": "dept-company-001-1",
    "name": "Engineering",
    "description": "Software engineering and QA",
    "status": "ACTIVE",
    "companyId": "company-001",
    "createdAt": "2023-01-05T09:00:00Z",
    "updatedAt": "2023-01-05T09:00:00Z"
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
      "field": "name",
      "message": "Name must be at least 2 characters"
    },
    {
      "field": "description",
      "message": "Description must be 200 characters or fewer"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `409 Conflict` — Name already used in this company

```json
{
  "success": false,
  "code": "DUPLICATE_ENTRY",
  "message": "A department named \"Finance\" already exists.",
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

### 4.4 · Update department

`PUT` `/departments/{departmentId}`

**Purpose:** Replace the editable fields of a department.

- **Access:** Admin, HR
- **Used by:** DepartmentFormDialog (edit)
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `departmentId` | string | Department id. |

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | **yes** | 2–60 chars. Unique within the company (case-insensitive). |
| `description` | string | no | Max 200 chars. |
| `status` | `ACTIVE` \| `INACTIVE` | **yes** |  |

```json
{
  "name": "Finance",
  "description": "Accounts and payroll",
  "status": "ACTIVE"
}
```

**Notes**

- The company is taken from the caller's token; only a Super Admin passes `companyId`.

**Response scenarios**

#### ✅ `200 OK` — Department updated

```json
{
  "success": true,
  "message": "Department updated successfully",
  "data": {
    "id": "dept-company-001-1",
    "name": "Finance",
    "description": "Accounts and payroll",
    "status": "ACTIVE",
    "companyId": "company-001",
    "createdAt": "2023-01-05T09:00:00Z",
    "updatedAt": "2023-01-05T09:00:00Z"
  }
}
```

#### ❌ `404 Not Found` — Department not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Department not found",
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
      "field": "name",
      "message": "Name must be at least 2 characters"
    },
    {
      "field": "description",
      "message": "Description must be 200 characters or fewer"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `409 Conflict` — Name already used in this company

```json
{
  "success": false,
  "code": "DUPLICATE_ENTRY",
  "message": "A department named \"Finance\" already exists.",
  "field": "name",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 4.5 · Activate / deactivate department

`PATCH` `/departments/{departmentId}/status`

**Purpose:** Set a department's status to ACTIVE or INACTIVE. Replaces the UI toggle (the server sets an explicit status instead of flipping it, so retries are safe).

- **Access:** Admin, HR
- **Used by:** DepartmentsPage toggle
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `departmentId` | string | Department id. |

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

- Deactivating does not change employees already in the department.

**Response scenarios**

#### ✅ `200 OK` — Status changed

```json
{
  "success": true,
  "message": "Department deactivated",
  "data": {
    "id": "dept-company-001-1",
    "name": "Engineering",
    "description": "Software engineering and QA",
    "status": "INACTIVE",
    "companyId": "company-001",
    "createdAt": "2023-01-05T09:00:00Z",
    "updatedAt": "2023-01-05T09:00:00Z"
  }
}
```

#### ✅ `200 OK` — Already in that status (idempotent no-op)

```json
{
  "success": true,
  "message": "Department is already ACTIVE",
  "data": {
    "id": "dept-company-001-1",
    "name": "Engineering",
    "description": "Software engineering and QA",
    "status": "ACTIVE",
    "companyId": "company-001",
    "createdAt": "2023-01-05T09:00:00Z",
    "updatedAt": "2023-01-05T09:00:00Z"
  }
}
```

#### ❌ `404 Not Found` — Department not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Department not found",
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

### 4.6 · Delete department

`DELETE` `/departments/{departmentId}`

**Purpose:** Delete a department.

- **Access:** Admin, HR
- **Used by:** DepartmentsPage
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `departmentId` | string | Department id. |

**Notes**

- Blocked while any employee still has this department.

**Response scenarios**

#### ✅ `200 OK` — Department deleted

```json
{
  "success": true,
  "message": "Department deleted successfully",
  "data": null
}
```

#### ❌ `404 Not Found` — Department not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Department not found",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `409 Conflict` — Employees still reference it

```json
{
  "success": false,
  "code": "DEPARTMENT_IN_USE",
  "message": "Department \"Engineering\" has 12 employees. Reassign them first.",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---
