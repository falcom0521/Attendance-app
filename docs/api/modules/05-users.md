# 5. Users

Platform accounts. **Super Admin** manages Admins and HR users anywhere; **Admin** manages HR users inside their own company. HR has no access.

[← Back to overview](../README.md)

## Endpoints in this module

| # | Method | Path | Purpose | Access |
|---|---|---|---|---|
| 5.1 | `GET` | `/users` | List users | Super Admin, Admin |
| 5.2 | `GET` | `/users/{userId}` | Get user | Super Admin, Admin |
| 5.3 | `POST` | `/users` | Create user | Super Admin, Admin |
| 5.4 | `PUT` | `/users/{userId}` | Update user | Super Admin, Admin |
| 5.5 | `PATCH` | `/users/{userId}/status` | Activate / deactivate user | Super Admin, Admin |
| 5.6 | `POST` | `/users/{userId}/reset-password` | Reset a user's password (admin action) | Super Admin, Admin |

---

### 5.1 · List users

`GET` `/users`

**Purpose:** Paginated list of users, with filters and search. Powers the users table.

- **Access:** Super Admin, Admin
- **Used by:** UsersPage, Company / Sub-company detail tabs
- **Auth:** `Authorization: Bearer <accessToken>`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `page` | integer | no | Page number, starting at 1. Default `1`. |
| `pageSize` | integer | no | Rows per page. Default `10`, max `200`. |
| `search` | string | no | Case-insensitive text search. |
| `role` | `ADMIN` \| `HR` | no |  |
| `status` | `ACTIVE` \| `INACTIVE` | no |  |
| `companyId` | string | no | Admin: forced to own company. |
| `subCompanyId` | string | no |  |
| `sortBy` | string | no | Sort field. One of: `fullName`, `createdAt`, `lastLogin`. |
| `sortOrder` | `asc` \| `desc` | no | Sort direction. Default `asc`. |

**Notes**

- **Scope:** an Admin only sees/manages users of their own company and can only create/edit role `HR`. Users outside scope return 404.

**Response scenarios**

#### ✅ `200 OK` — users found

```json
{
  "success": true,
  "data": [
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
    },
    {
      "id": "user-002",
      "firstName": "Meera",
      "lastName": "Nambiar",
      "fullName": "Meera Nambiar",
      "email": "admin@example.com",
      "phone": "+91-9876543211",
      "username": "admin_nexus",
      "role": "ADMIN",
      "companyId": "company-001",
      "companyName": "Nexus Technologies Pvt Ltd",
      "subCompanyId": null,
      "subCompanyName": null,
      "status": "ACTIVE",
      "lastLogin": "2026-09-19T08:45:00Z",
      "createdAt": "2022-04-01T09:00:00Z",
      "updatedAt": "2026-09-19T08:45:00Z"
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

### 5.2 · Get user

`GET` `/users/{userId}`

**Purpose:** Fetch a single user by id.

- **Access:** Super Admin, Admin
- **Used by:** UserDetailDialog
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `userId` | string | User id. |

**Notes**

- **Scope:** an Admin only sees/manages users of their own company and can only create/edit role `HR`. Users outside scope return 404.

**Response scenarios**

#### ✅ `200 OK` — User found

```json
{
  "success": true,
  "data": {
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
}
```

#### ❌ `404 Not Found` — User does not exist (or is outside the caller's scope)

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "User not found",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 5.3 · Create user

`POST` `/users`

**Purpose:** Create a new user.

- **Access:** Super Admin, Admin
- **Used by:** UserFormDialog
- **Auth:** `Authorization: Bearer <accessToken>`

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `firstName` | string | **yes** |  |
| `lastName` | string | **yes** |  |
| `email` | email | **yes** | Unique. |
| `phone` | string | **yes** | Min 7 chars. |
| `username` | string | **yes** | Min 3 chars, unique. |
| `password` | string | no | Min 6 chars. If omitted the server generates a temporary password and emails it; the user must change it at first login. |
| `role` | `ADMIN` \| `HR` | **yes** | Admin callers may only use `HR`. |
| `companyId` | string | no | Required for ADMIN and HR. Admin callers: forced to their own company. |
| `subCompanyId` | string | no | Required for HR; must belong to `companyId`. |
| `status` | `ACTIVE` \| `INACTIVE` | **yes** |  |

```json
{
  "firstName": "Priya",
  "lastName": "Reddy",
  "email": "priya.reddy@nexustech.in",
  "phone": "+91-9876543214",
  "username": "hr_blr",
  "role": "HR",
  "companyId": "company-001",
  "subCompanyId": "sub-002",
  "status": "ACTIVE"
}
```

**Notes**

- **Scope:** an Admin only sees/manages users of their own company and can only create/edit role `HR`. Users outside scope return 404.

**Response scenarios**

#### ✅ `201 Created` — User created

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
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
      "field": "role",
      "message": "Role must be ADMIN or HR"
    },
    {
      "field": "subCompanyId",
      "message": "Sub company is required for HR users"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `409 Conflict` — Email or username already used

```json
{
  "success": false,
  "code": "DUPLICATE_ENTRY",
  "message": "A user with this email already exists",
  "field": "email",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `403 Forbidden` — Caller cannot create in that scope

```json
{
  "success": false,
  "code": "FORBIDDEN",
  "message": "Admins can only create HR users in their own company",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `422 Unprocessable Entity` — Sub-company does not belong to the company

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "errors": [
    {
      "field": "subCompanyId",
      "message": "Sub company does not belong to the selected company"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 5.4 · Update user

`PUT` `/users/{userId}`

**Purpose:** Replace the editable fields of a user.

- **Access:** Super Admin, Admin
- **Used by:** UserFormDialog (edit)
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `userId` | string | User id. |

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `firstName` | string | **yes** |  |
| `lastName` | string | **yes** |  |
| `email` | email | **yes** | Unique. |
| `phone` | string | **yes** |  |
| `username` | string | **yes** | Unique. |
| `role` | `ADMIN` \| `HR` | **yes** |  |
| `companyId` | string | no |  |
| `subCompanyId` | string | no |  |
| `status` | `ACTIVE` \| `INACTIVE` | **yes** |  |

```json
{
  "firstName": "Priya",
  "lastName": "Reddy",
  "email": "priya.reddy@nexustech.in",
  "phone": "+91-9876543214",
  "username": "hr_blr",
  "role": "HR",
  "companyId": "company-001",
  "subCompanyId": "sub-002",
  "status": "ACTIVE"
}
```

**Notes**

- **Scope:** an Admin only sees/manages users of their own company and can only create/edit role `HR`. Users outside scope return 404.

**Response scenarios**

#### ✅ `200 OK` — User updated

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "user-004",
    "firstName": "Priya",
    "lastName": "Reddy",
    "fullName": "Divya Menon",
    "email": "priya.reddy@nexustech.in",
    "phone": "+91-9876543214",
    "username": "hr_blr",
    "role": "HR",
    "companyId": "company-001",
    "companyName": "Nexus Technologies Pvt Ltd",
    "subCompanyId": "sub-002",
    "subCompanyName": "Nexus Kochi HQ",
    "status": "ACTIVE",
    "lastLogin": "2026-09-19T08:45:00Z",
    "createdAt": "2022-04-01T09:00:00Z",
    "updatedAt": "2026-09-19T08:45:00Z"
  }
}
```

#### ❌ `404 Not Found` — User not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "User not found",
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
      "field": "role",
      "message": "Role must be ADMIN or HR"
    },
    {
      "field": "subCompanyId",
      "message": "Sub company is required for HR users"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `409 Conflict` — Email or username already used

```json
{
  "success": false,
  "code": "DUPLICATE_ENTRY",
  "message": "A user with this email already exists",
  "field": "email",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 5.5 · Activate / deactivate user

`PATCH` `/users/{userId}/status`

**Purpose:** Set a user's status to ACTIVE or INACTIVE. Replaces the UI toggle (the server sets an explicit status instead of flipping it, so retries are safe).

- **Access:** Super Admin, Admin
- **Used by:** UsersPage toggle
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `userId` | string | User id. |

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

- A user cannot deactivate themselves.

**Response scenarios**

#### ✅ `200 OK` — Status changed

```json
{
  "success": true,
  "message": "User deactivated",
  "data": {
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
    "status": "INACTIVE",
    "lastLogin": "2026-09-19T08:45:00Z",
    "createdAt": "2022-04-01T09:00:00Z",
    "updatedAt": "2026-09-19T08:45:00Z"
  }
}
```

#### ✅ `200 OK` — Already in that status (idempotent no-op)

```json
{
  "success": true,
  "message": "User is already ACTIVE",
  "data": {
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
}
```

#### ❌ `404 Not Found` — User not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "User not found",
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

#### ❌ `409 Conflict` — Trying to deactivate own account

```json
{
  "success": false,
  "code": "CANNOT_DEACTIVATE_SELF",
  "message": "You cannot deactivate your own account",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 5.6 · Reset a user's password (admin action)

`POST` `/users/{userId}/reset-password`

**Purpose:** Administrator forces a password reset for a user (forgotten password with no email access). The server generates a temporary password, emails it, and flags the account to change it at next login.

- **Access:** Super Admin, Admin
- **Used by:** UsersPage / UserDetailDialog — action not built yet
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `userId` | string | Target user id. |

**Notes**

- Revokes all of the user's sessions. Admins can only reset HR users of their own company.

**Response scenarios**

#### ✅ `200 OK` — Temporary password issued

```json
{
  "success": true,
  "message": "Temporary password sent to hr@example.com",
  "data": {
    "emailSent": true,
    "mustChangePassword": true
  }
}
```

#### ❌ `403 Forbidden` — Admin tried to reset a non-HR / other-company user

```json
{
  "success": false,
  "code": "FORBIDDEN",
  "message": "You cannot reset this user's password",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `404 Not Found` — User not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "User not found",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `409 Conflict` — Trying to reset own password here

```json
{
  "success": false,
  "code": "USE_CHANGE_PASSWORD",
  "message": "Use Change Password on your profile to change your own password",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---
