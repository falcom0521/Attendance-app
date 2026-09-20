# 2. Companies

Tenants of the platform. Managed by the Super Admin; an Admin can read only their own company.

[← Back to overview](../README.md)

## Endpoints in this module

| # | Method | Path | Purpose | Access |
|---|---|---|---|---|
| 2.1 | `GET` | `/companies` | List companies | Super Admin |
| 2.2 | `GET` | `/companies/{companyId}` | Get company | Super Admin, Admin |
| 2.3 | `POST` | `/companies` | Create company | Super Admin |
| 2.4 | `PUT` | `/companies/{companyId}` | Update company | Super Admin |
| 2.5 | `PATCH` | `/companies/{companyId}/status` | Activate / deactivate company | Super Admin |
| 2.6 | `DELETE` | `/companies/{companyId}` | Delete company | Super Admin |
| 2.7 | `GET` | `/companies/{companyId}/overview` | Company overview | Super Admin |
| 2.8 | `GET` | `/companies/{companyId}/sub-companies` | Sub-companies of a company | Super Admin, Admin |
| 2.9 | `POST` | `/companies/{companyId}/logo` | Upload company logo | Super Admin, Admin |

---

### 2.1 · List companies

`GET` `/companies`

**Purpose:** Paginated list of companies, with filters and search. Powers the companies table.

- **Access:** Super Admin
- **Used by:** CompaniesPage, filters on Users / Activity Logs
- **Auth:** `Authorization: Bearer <accessToken>`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `page` | integer | no | Page number, starting at 1. Default `1`. |
| `pageSize` | integer | no | Rows per page. Default `10`, max `200`. |
| `search` | string | no | Case-insensitive text search. |
| `status` | `ACTIVE` \| `INACTIVE` | no | Filter by status. |
| `sortBy` | string | no | Sort field. One of: `name`, `createdAt`. |
| `sortOrder` | `asc` \| `desc` | no | Sort direction. Default `asc`. |

**Notes**

- An **Admin** may only read their own company; any other id returns 404.

**Response scenarios**

#### ✅ `200 OK` — companies found

```json
{
  "success": true,
  "data": [
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
    },
    {
      "id": "company-002",
      "name": "Vertex Solutions India",
      "code": "VRTXIN",
      "registrationNumber": "CIN-U72300MH2014PTC154785",
      "email": "info@vertexsolutions.in",
      "phone": "+91-22-67891234",
      "address": "Level 14, One BKC, Bandra Kurla Complex",
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India",
      "logoUrl": null,
      "status": "ACTIVE",
      "subCompanyCount": 4,
      "deviceCount": 12,
      "employeeCount": 0,
      "createdAt": "2022-07-20T10:15:00Z",
      "updatedAt": "2024-08-10T14:30:00Z"
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

### 2.2 · Get company

`GET` `/companies/{companyId}`

**Purpose:** Fetch a single company by id.

- **Access:** Super Admin, Admin
- **Used by:** CompanyDetailPage
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `companyId` | string | Company id. |

**Notes**

- An **Admin** may only read their own company; any other id returns 404.

**Response scenarios**

#### ✅ `200 OK` — Company found

```json
{
  "success": true,
  "data": {
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
}
```

#### ❌ `404 Not Found` — Company does not exist (or is outside the caller's scope)

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Company not found",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 2.3 · Create company

`POST` `/companies`

**Purpose:** Create a new company.

- **Access:** Super Admin
- **Used by:** CompanyFormDialog
- **Auth:** `Authorization: Bearer <accessToken>`

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | **yes** | 2–100 chars. |
| `code` | string | **yes** | 2–10 chars, unique, stored upper-case. |
| `registrationNumber` | string | **yes** | Company registration / CIN number. |
| `email` | email | **yes** |  |
| `phone` | string | **yes** | Min 7 chars. |
| `address` | string | **yes** | Min 5 chars. |
| `city` | string | **yes** | Min 2 chars. |
| `state` | string | **yes** | Min 2 chars. |
| `country` | string | **yes** | Min 2 chars. |
| `status` | `ACTIVE` \| `INACTIVE` | **yes** |  |

```json
{
  "name": "Vertex Solutions India",
  "code": "VRTXIN",
  "registrationNumber": "CIN-U72300MH2014PTC154785",
  "email": "info@vertexsolutions.in",
  "phone": "+91-22-67891234",
  "address": "Level 14, One BKC, Bandra Kurla Complex",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "status": "ACTIVE"
}
```

**Notes**

- An **Admin** may only read their own company; any other id returns 404.

**Response scenarios**

#### ✅ `201 Created` — Company created

```json
{
  "success": true,
  "message": "Company created successfully",
  "data": {
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
      "field": "code",
      "message": "Code must be 2–10 characters"
    },
    {
      "field": "email",
      "message": "Enter a valid email address"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `409 Conflict` — Company code already used

```json
{
  "success": false,
  "code": "DUPLICATE_ENTRY",
  "message": "A company with code \"VRTXIN\" already exists",
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

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 2.4 · Update company

`PUT` `/companies/{companyId}`

**Purpose:** Replace the editable fields of a company.

- **Access:** Super Admin
- **Used by:** CompanyFormDialog (edit)
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `companyId` | string | Company id. |

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | **yes** | 2–100 chars. |
| `code` | string | **yes** | 2–10 chars, unique, stored upper-case. |
| `registrationNumber` | string | **yes** | Company registration / CIN number. |
| `email` | email | **yes** |  |
| `phone` | string | **yes** | Min 7 chars. |
| `address` | string | **yes** | Min 5 chars. |
| `city` | string | **yes** | Min 2 chars. |
| `state` | string | **yes** | Min 2 chars. |
| `country` | string | **yes** | Min 2 chars. |
| `status` | `ACTIVE` \| `INACTIVE` | **yes** |  |

```json
{
  "name": "Vertex Solutions India",
  "code": "VRTXIN",
  "registrationNumber": "CIN-U72300MH2014PTC154785",
  "email": "info@vertexsolutions.in",
  "phone": "+91-22-67891234",
  "address": "Level 14, One BKC, Bandra Kurla Complex",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "status": "ACTIVE"
}
```

**Notes**

- An **Admin** may only read their own company; any other id returns 404.

**Response scenarios**

#### ✅ `200 OK` — Company updated

```json
{
  "success": true,
  "message": "Company updated successfully",
  "data": {
    "id": "company-001",
    "name": "Vertex Solutions India",
    "code": "VRTXIN",
    "registrationNumber": "CIN-U72300MH2014PTC154785",
    "email": "info@vertexsolutions.in",
    "phone": "+91-22-67891234",
    "address": "Level 14, One BKC, Bandra Kurla Complex",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "logoUrl": null,
    "status": "ACTIVE",
    "subCompanyCount": 3,
    "deviceCount": 8,
    "employeeCount": 25,
    "createdAt": "2022-03-15T09:00:00Z",
    "updatedAt": "2024-08-10T14:30:00Z"
  }
}
```

#### ❌ `404 Not Found` — Company not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Company not found",
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
      "field": "code",
      "message": "Code must be 2–10 characters"
    },
    {
      "field": "email",
      "message": "Enter a valid email address"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `409 Conflict` — Company code already used

```json
{
  "success": false,
  "code": "DUPLICATE_ENTRY",
  "message": "A company with code \"VRTXIN\" already exists",
  "field": "code",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 2.5 · Activate / deactivate company

`PATCH` `/companies/{companyId}/status`

**Purpose:** Set a company's status to ACTIVE or INACTIVE. Replaces the UI toggle (the server sets an explicit status instead of flipping it, so retries are safe).

- **Access:** Super Admin
- **Used by:** CompaniesPage / CompanyDetailPage toggle
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `companyId` | string | Company id. |

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

- Deactivating a company blocks sign-in for every user under it. Existing data is kept.

**Response scenarios**

#### ✅ `200 OK` — Status changed

```json
{
  "success": true,
  "message": "Company deactivated",
  "data": {
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
    "status": "INACTIVE",
    "subCompanyCount": 3,
    "deviceCount": 8,
    "employeeCount": 25,
    "createdAt": "2022-03-15T09:00:00Z",
    "updatedAt": "2024-08-10T14:30:00Z"
  }
}
```

#### ✅ `200 OK` — Already in that status (idempotent no-op)

```json
{
  "success": true,
  "message": "Company is already ACTIVE",
  "data": {
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
}
```

#### ❌ `404 Not Found` — Company not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Company not found",
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

### 2.6 · Delete company

`DELETE` `/companies/{companyId}`

**Purpose:** Soft-delete a company. Not exposed in the UI yet (deactivate is the normal path); kept because the permission `companies:delete` exists.

- **Access:** Super Admin
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `companyId` | string | Company id. |

**Notes**

- Allowed only when the company has no sub-companies, employees, devices or users.

**Response scenarios**

#### ✅ `200 OK` — Company deleted

```json
{
  "success": true,
  "message": "Company deleted successfully",
  "data": null
}
```

#### ❌ `404 Not Found` — Company not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Company not found",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `409 Conflict` — Company still has data

```json
{
  "success": false,
  "code": "COMPANY_IN_USE",
  "message": "Company still has sub companies, employees or devices. Deactivate it instead.",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 2.7 · Company overview

`GET` `/companies/{companyId}/overview`

**Purpose:** Everything the Company detail page needs in one call: the company, live counts, device health breakdown and its Admin users.

- **Access:** Super Admin
- **Used by:** CompanyDetailPage
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `companyId` | string | Company id. |

**Response scenarios**

#### ✅ `200 OK` — Overview

```json
{
  "success": true,
  "data": {
    "company": {
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
    },
    "stats": {
      "subCompanies": 3,
      "employees": 25,
      "users": {
        "total": 5,
        "admins": 1,
        "hr": 4
      },
      "devices": {
        "total": 8,
        "online": 6,
        "offline": 1,
        "maintenance": 1,
        "unallocated": 0
      }
    },
    "admins": [
      {
        "id": "user-002",
        "fullName": "Meera Nambiar",
        "email": "admin@example.com",
        "status": "ACTIVE"
      }
    ]
  }
}
```

#### ❌ `404 Not Found` — Company not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Company not found",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 2.8 · Sub-companies of a company

`GET` `/companies/{companyId}/sub-companies`

**Purpose:** Unpaginated list of one company's sub-companies. Feeds the Admin topbar "All Sub Companies" selector and the sub-company dropdowns in forms.

- **Access:** Super Admin, Admin
- **Used by:** SubCompanySelector, EmployeeFormDialog, Allocate device dialog
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `companyId` | string | Company id. |

**Notes**

- An Admin may only request their own company.

**Response scenarios**

#### ✅ `200 OK` — Sub-companies

```json
{
  "success": true,
  "data": [
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
    },
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
  ]
}
```

#### ❌ `403 Forbidden` — Admin asked for another company

```json
{
  "success": false,
  "code": "FORBIDDEN",
  "message": "You can only access your own company",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `404 Not Found` — Company not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Company not found",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 2.9 · Upload company logo

`POST` `/companies/{companyId}/logo`

**Purpose:** Upload / replace the company logo (the "Upload Logo" button on Configuration → Company).

- **Access:** Super Admin, Admin
- **Used by:** ConfigurationPage → Branding (button not wired yet)
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `companyId` | string | Company id. |

**Request body** (`multipart/form-data`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `file` | file | **yes** | PNG or JPG, max 2 MB, min 64×64 px. |

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
    "logoUrl": "https://cdn.example.com/logos/company-001.png"
  }
}
```

#### ❌ `413 Payload Too Large` — File larger than 2 MB

```json
{
  "success": false,
  "code": "FILE_TOO_LARGE",
  "message": "Logo must be 2 MB or smaller",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `415 Unsupported Media Type` — Not a PNG/JPG

```json
{
  "success": false,
  "code": "UNSUPPORTED_MEDIA_TYPE",
  "message": "Only PNG and JPG images are allowed",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `404 Not Found` — Company not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Company not found",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---
