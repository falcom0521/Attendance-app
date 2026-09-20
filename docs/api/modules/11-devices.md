# 11. Devices

Biometric punch devices. **Super Admin** registers, edits, allocates, re-allocates and deallocates. **Admin** has a read-only view of the devices allocated to their company. Punches reach the platform through the [Device Gateway](12-gateway.md).

[← Back to overview](../README.md)

## Endpoints in this module

| # | Method | Path | Purpose | Access |
|---|---|---|---|---|
| 11.1 | `GET` | `/devices` | List devices | Super Admin, Admin |
| 11.2 | `GET` | `/devices/unallocated` | List unallocated devices | Super Admin |
| 11.3 | `GET` | `/devices/{deviceId}` | Get device | Super Admin, Admin |
| 11.4 | `POST` | `/devices` | Register device | Super Admin |
| 11.5 | `PUT` | `/devices/{deviceId}` | Edit device | Super Admin |
| 11.6 | `PATCH` | `/devices/{deviceId}/maintenance` | Set maintenance mode | Super Admin |
| 11.7 | `POST` | `/devices/{deviceId}/allocate` | Allocate / re-allocate device | Super Admin |
| 11.8 | `POST` | `/devices/{deviceId}/deallocate` | Deallocate device | Super Admin |
| 11.9 | `GET` | `/devices/{deviceId}/allocations` | Allocation history of a device | Super Admin, Admin |
| 11.10 | `GET` | `/devices/allocations` | All allocations | Super Admin |
| 11.11 | `GET` | `/devices/{deviceId}/stats` | Device statistics | Super Admin, Admin |
| 11.12 | `GET` | `/devices/{deviceId}/punches` | Device punch log | Super Admin, Admin |

---

### 11.1 · List devices

`GET` `/devices`

**Purpose:** Paginated device inventory with allocation and health.

- **Access:** Super Admin, Admin
- **Used by:** DevicesPage, Company / Sub-company detail tabs
- **Auth:** `Authorization: Bearer <accessToken>`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `page` | integer | no | Page number, starting at 1. Default `1`. |
| `pageSize` | integer | no | Rows per page. Default `10`, max `200`. |
| `search` | string | no | Case-insensitive text search. |
| `status` | `ONLINE` \| `OFFLINE` \| `UNALLOCATED` \| `MAINTENANCE` | no |  |
| `companyId` | string | no | Admin: forced to own company. |
| `subCompanyId` | string | no |  |

**Notes**

- **Scope:** Admin only receives devices currently allocated to their company (read-only). Search matches `deviceId`, `name`, `serialNumber`.

**Response scenarios**

#### ✅ `200 OK` — Devices

```json
{
  "success": true,
  "data": [
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
    },
    {
      "id": "device-011",
      "deviceId": "DEV-NEW-001",
      "name": "Spare Device 01",
      "modelNumber": "BioMax Pro 7000",
      "serialNumber": "BMP7K-20260901-099",
      "macAddress": "00:FF:EE:DD:CC:01",
      "firmwareVersion": "3.4.2",
      "ipAddress": "0.0.0.0",
      "status": "UNALLOCATED",
      "companyId": null,
      "companyName": null,
      "subCompanyId": null,
      "subCompanyName": null,
      "lastSeen": null,
      "lastPunch": null,
      "allocatedAt": null,
      "createdAt": "2026-09-01T09:00:00Z",
      "updatedAt": "2026-09-01T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 12,
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
    "pageSize": 10,
    "total": 0,
    "totalPages": 1
  }
}
```

#### ❌ `422 Unprocessable Entity` — Bad status

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "errors": [
    {
      "field": "status",
      "message": "Must be one of ONLINE, OFFLINE, UNALLOCATED, MAINTENANCE"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 11.2 · List unallocated devices

`GET` `/devices/unallocated`

**Purpose:** Spare devices available to allocate (status `UNALLOCATED`).

- **Access:** Super Admin
- **Used by:** Allocate flow
- **Auth:** `Authorization: Bearer <accessToken>`

**Response scenarios**

#### ✅ `200 OK` — Spare devices

```json
{
  "success": true,
  "data": [
    {
      "id": "device-011",
      "deviceId": "DEV-NEW-001",
      "name": "Spare Device 01",
      "modelNumber": "BioMax Pro 7000",
      "serialNumber": "BMP7K-20260901-099",
      "macAddress": "00:FF:EE:DD:CC:01",
      "firmwareVersion": "3.4.2",
      "ipAddress": "0.0.0.0",
      "status": "UNALLOCATED",
      "companyId": null,
      "companyName": null,
      "subCompanyId": null,
      "subCompanyName": null,
      "lastSeen": null,
      "lastPunch": null,
      "allocatedAt": null,
      "createdAt": "2026-09-01T09:00:00Z",
      "updatedAt": "2026-09-01T09:00:00Z"
    }
  ]
}
```

#### ✅ `200 OK` — None free

```json
{
  "success": true,
  "data": []
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 11.3 · Get device

`GET` `/devices/{deviceId}`

**Purpose:** Full device record for the Device detail page header and Overview tab.

- **Access:** Super Admin, Admin
- **Used by:** DeviceDetailPage
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `deviceId` | string | Device record id (not the `DEV-…` code). |

**Notes**

- An Admin gets 404 for a device that is not currently allocated to their company.

**Response scenarios**

#### ✅ `200 OK` — Device

```json
{
  "success": true,
  "data": {
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
}
```

#### ❌ `404 Not Found` — Not found / not visible to caller

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Device not found",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 11.4 · Register device

`POST` `/devices`

**Purpose:** Add a new physical device to the inventory. It starts `UNALLOCATED`.

- **Access:** Super Admin
- **Used by:** DeviceFormDialog
- **Auth:** `Authorization: Bearer <accessToken>`

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `deviceId` | string | **yes** | Human-readable code, unique (e.g. `DEV-NX-001`). |
| `name` | string | **yes** | Min 2 chars. |
| `modelNumber` | string | **yes** |  |
| `serialNumber` | string | **yes** | Unique. The device sends this to the gateway. |
| `macAddress` | string | **yes** | `AA:BB:CC:DD:EE:FF`, unique. |
| `firmwareVersion` | string | **yes** |  |
| `ipAddress` | string | **yes** | IPv4/IPv6. |

```json
{
  "deviceId": "DEV-NEW-003",
  "name": "Spare Device 03",
  "modelNumber": "ZKTeco F22",
  "serialNumber": "ZKF22-20260915-101",
  "macAddress": "00:FF:EE:DD:CC:03",
  "firmwareVersion": "2.1.8",
  "ipAddress": "192.168.1.130"
}
```

**Response scenarios**

#### ✅ `201 Created` — Device registered

```json
{
  "success": true,
  "message": "Device added",
  "data": {
    "id": "device-013",
    "deviceId": "DEV-NEW-003",
    "name": "Spare Device 03",
    "modelNumber": "ZKTeco F22",
    "serialNumber": "ZKF22-20260915-101",
    "macAddress": "00:FF:EE:DD:CC:03",
    "firmwareVersion": "2.1.8",
    "ipAddress": "192.168.1.130",
    "status": "UNALLOCATED",
    "companyId": null,
    "companyName": null,
    "subCompanyId": null,
    "subCompanyName": null,
    "lastSeen": null,
    "lastPunch": null,
    "allocatedAt": null,
    "createdAt": "2026-09-01T09:00:00Z",
    "updatedAt": "2026-09-01T09:00:00Z"
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
      "field": "macAddress",
      "message": "Invalid MAC address"
    },
    {
      "field": "serialNumber",
      "message": "Serial number required"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `409 Conflict` — Device id / serial / MAC already registered

```json
{
  "success": false,
  "code": "DUPLICATE_ENTRY",
  "message": "A device with serial number \"ZKF22-20260915-101\" already exists",
  "field": "serialNumber",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 11.5 · Edit device

`PUT` `/devices/{deviceId}`

**Purpose:** Update descriptive fields (name, model, firmware, IP…).

- **Access:** Super Admin
- **Used by:** DeviceFormDialog (edit), DeviceDetailPage → Edit
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `deviceId` | string | Device record id. |

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `deviceId` | string | **yes** | Human-readable code, unique (e.g. `DEV-NX-001`). |
| `name` | string | **yes** | Min 2 chars. |
| `modelNumber` | string | **yes** |  |
| `serialNumber` | string | **yes** | Unique. The device sends this to the gateway. |
| `macAddress` | string | **yes** | `AA:BB:CC:DD:EE:FF`, unique. |
| `firmwareVersion` | string | **yes** |  |
| `ipAddress` | string | **yes** | IPv4/IPv6. |

```json
{
  "deviceId": "DEV-NEW-003",
  "name": "Kochi Main Entrance",
  "modelNumber": "ZKTeco F22",
  "serialNumber": "ZKF22-20260915-101",
  "macAddress": "00:FF:EE:DD:CC:03",
  "firmwareVersion": "3.4.3",
  "ipAddress": "192.168.1.130"
}
```

**Response scenarios**

#### ✅ `200 OK` — Updated

```json
{
  "success": true,
  "message": "Device updated",
  "data": {
    "id": "device-001",
    "deviceId": "DEV-NX-001",
    "name": "Kochi Main Entrance",
    "modelNumber": "BioMax Pro 7000",
    "serialNumber": "BMP7K-20240301-001",
    "macAddress": "00:1A:2B:3C:4D:01",
    "firmwareVersion": "3.4.3",
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
}
```

#### ❌ `404 Not Found` — Not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Device not found",
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
      "field": "macAddress",
      "message": "Invalid MAC address"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `409 Conflict` — Serial / MAC / code clashes with another device

```json
{
  "success": false,
  "code": "DUPLICATE_ENTRY",
  "message": "Another device already uses this MAC address",
  "field": "macAddress",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 11.6 · Set maintenance mode

`PATCH` `/devices/{deviceId}/maintenance`

**Purpose:** Flag a device as `MAINTENANCE` (punches are still accepted but it is excluded from health alerts) or bring it back. ONLINE/OFFLINE are never set by hand — they follow the heartbeat.

- **Access:** Super Admin
- **Used by:** Not in UI yet (status exists in the model)
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `deviceId` | string | Device record id. |

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `enabled` | boolean | **yes** |  |
| `reason` | string | no |  |

```json
{
  "enabled": true,
  "reason": "Firmware upgrade"
}
```

**Response scenarios**

#### ✅ `200 OK` — Updated

```json
{
  "success": true,
  "message": "Device set to maintenance",
  "data": {
    "id": "device-001",
    "deviceId": "DEV-NX-001",
    "name": "Kochi Main Entrance",
    "modelNumber": "BioMax Pro 7000",
    "serialNumber": "BMP7K-20240301-001",
    "macAddress": "00:1A:2B:3C:4D:01",
    "firmwareVersion": "3.4.2",
    "ipAddress": "192.168.10.11",
    "status": "MAINTENANCE",
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
}
```

#### ❌ `404 Not Found` — Not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Device not found",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `409 Conflict` — Unallocated device cannot be in maintenance

```json
{
  "success": false,
  "code": "DEVICE_NOT_ALLOCATED",
  "message": "Only allocated devices can be put in maintenance",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 11.7 · Allocate / re-allocate device

`POST` `/devices/{deviceId}/allocate`

**Purpose:** Assign a device to a sub-company. If it is already allocated elsewhere this **re-allocates**: the previous allocation is closed (kept in history) and a new one opens. A re-allocated device keeps its health status; a spare comes ONLINE once it heartbeats.

- **Access:** Super Admin
- **Used by:** AllocateDeviceDialog (allocate and re-allocate modes)
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `deviceId` | string | Device record id. |

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `companyId` | string | **yes** |  |
| `subCompanyId` | string | **yes** | Must belong to `companyId` and be ACTIVE. |
| `notes` | string | no | Deployment notes. |

```json
{
  "companyId": "company-001",
  "subCompanyId": "sub-002",
  "notes": "Main entry for Bangalore office"
}
```

**Response scenarios**

#### ✅ `201 Created` — Allocated

```json
{
  "success": true,
  "message": "Device allocated",
  "data": {
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
}
```

#### ❌ `409 Conflict` — Already allocated to that sub-company

```json
{
  "success": false,
  "code": "ALREADY_ALLOCATED",
  "message": "Device is already allocated to this sub company",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `404 Not Found` — Device / company / sub-company not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Sub company not found",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `422 Unprocessable Entity` — Sub-company not in company, or inactive

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

### 11.8 · Deallocate device

`POST` `/devices/{deviceId}/deallocate`

**Purpose:** Return the device to the unallocated pool. Closes the active allocation (kept in history) and stops accepting its punches for the old sub-company.

- **Access:** Super Admin
- **Used by:** DeallocateDeviceDialog
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `deviceId` | string | Device record id. |

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `reason` | string | no | Recorded on the allocation history entry. |

```json
{
  "reason": "Bangalore office closing for renovation"
}
```

**Response scenarios**

#### ✅ `200 OK` — Deallocated

```json
{
  "success": true,
  "message": "Device deallocated",
  "data": {
    "id": "device-004",
    "deviceId": "DEV-NX-004",
    "name": "Bangalore Entry",
    "modelNumber": "BioMax Pro 7000",
    "serialNumber": "BMP7K-20260901-099",
    "macAddress": "00:FF:EE:DD:CC:01",
    "firmwareVersion": "3.4.2",
    "ipAddress": "0.0.0.0",
    "status": "UNALLOCATED",
    "companyId": null,
    "companyName": null,
    "subCompanyId": null,
    "subCompanyName": null,
    "lastSeen": null,
    "lastPunch": null,
    "allocatedAt": null,
    "createdAt": "2026-09-01T09:00:00Z",
    "updatedAt": "2026-09-01T09:00:00Z"
  }
}
```

#### ❌ `404 Not Found` — Not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Device not found",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `409 Conflict` — Device is not allocated

```json
{
  "success": false,
  "code": "DEVICE_NOT_ALLOCATED",
  "message": "Device is not allocated",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 11.9 · Allocation history of a device

`GET` `/devices/{deviceId}/allocations`

**Purpose:** Every allocation the device has had, newest first (Device detail → Allocation History).

- **Access:** Super Admin, Admin
- **Used by:** DeviceDetailPage → Allocation History
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `deviceId` | string | Device record id. |

**Response scenarios**

#### ✅ `200 OK` — History

```json
{
  "success": true,
  "data": [
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
    },
    {
      "id": "alloc-001",
      "deviceId": "device-004",
      "deviceName": "Bangalore Entry",
      "companyId": "company-001",
      "companyName": "Nexus Technologies Pvt Ltd",
      "subCompanyId": "sub-001",
      "subCompanyName": "Nexus Kochi HQ",
      "allocatedBy": "Arjun Krishnaswamy",
      "allocatedAt": "2021-01-10T09:00:00Z",
      "deallocatedAt": "2022-05-14T09:00:00Z",
      "deallocatedBy": "Arjun Krishnaswamy",
      "deallocationReason": "Re-allocated to another sub company",
      "isActive": false,
      "notes": "Main entry for Bangalore office"
    }
  ]
}
```

#### ✅ `200 OK` — Never allocated

```json
{
  "success": true,
  "data": []
}
```

#### ❌ `404 Not Found` — Device not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Device not found",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 11.10 · All allocations

`GET` `/devices/allocations`

**Purpose:** Platform-wide allocation ledger with filters (audit / reporting).

- **Access:** Super Admin
- **Used by:** deviceService.getAllocations (no UI yet)
- **Auth:** `Authorization: Bearer <accessToken>`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `page` | integer | no | Page number, starting at 1. Default `1`. |
| `pageSize` | integer | no | Rows per page. Default `10`, max `200`. |
| `deviceId` | string | no |  |
| `companyId` | string | no |  |
| `subCompanyId` | string | no |  |
| `isActive` | boolean | no | Only current allocations when `true`. |

**Response scenarios**

#### ✅ `200 OK` — Allocations

```json
{
  "success": true,
  "data": [
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
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 11.11 · Device statistics

`GET` `/devices/{deviceId}/stats`

**Purpose:** Punch counters for the Device overview cards.

- **Access:** Super Admin, Admin
- **Used by:** DeviceDetailPage → Overview
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `deviceId` | string | Device record id. |

**Response scenarios**

#### ✅ `200 OK` — Stats (counted in the allocated sub-company's timezone)

```json
{
  "success": true,
  "data": {
    "punchesToday": 35,
    "punchesLast7Days": 175,
    "uniqueEmployeesToday": 13,
    "lastPunch": "2026-09-20T18:20:00"
  }
}
```

#### ❌ `404 Not Found` — Device not found / not visible

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Device not found",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 11.12 · Device punch log

`GET` `/devices/{deviceId}/punches`

**Purpose:** Raw punches received from this device, newest first (manual entries are not included).

- **Access:** Super Admin, Admin
- **Used by:** DeviceDetailPage → Punch Log
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `deviceId` | string | Device record id. |

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `startDate` | date (`YYYY-MM-DD`) | no | Default: 7 days ago. |
| `endDate` | date (`YYYY-MM-DD`) | no | Default: today. |
| `search` | string | no | Case-insensitive text search. |
| `page` | integer | no | Page number, starting at 1. Default `1`. |
| `pageSize` | integer | no | Rows per page. Default `10`, max `200`. |

**Response scenarios**

#### ✅ `200 OK` — Punches

```json
{
  "success": true,
  "data": [
    {
      "id": "p-004",
      "employeeId": "emp-001",
      "employeeCode": "EMP-1001",
      "employeeName": "Rahul Menon",
      "punchTime": "2026-09-20T18:05:00",
      "punchType": "OUT",
      "subCompanyId": "sub-001"
    },
    {
      "id": "p-003",
      "employeeId": "emp-001",
      "employeeCode": "EMP-1001",
      "employeeName": "Rahul Menon",
      "punchTime": "2026-09-20T13:55:00",
      "punchType": "IN",
      "subCompanyId": "sub-001"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 15,
    "total": 1235,
    "totalPages": 83
  }
}
```

#### ✅ `200 OK` — No punches in range

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

#### ❌ `404 Not Found` — Device not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Device not found",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `422 Unprocessable Entity` — Range reversed

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

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---
