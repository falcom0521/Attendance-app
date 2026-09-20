# 13. Configuration — Attendance Settings

Company-wide attendance policy (Configuration → Attendance Settings). Shifts, holidays and departments have their own modules; the branch profile is under [Sub-Companies](03-sub-companies.md).

[← Back to overview](../README.md)

## Endpoints in this module

| # | Method | Path | Purpose | Access |
|---|---|---|---|---|
| 13.1 | `GET` | `/settings/attendance` | Get attendance settings | Super Admin, Admin, HR |
| 13.2 | `PUT` | `/settings/attendance` | Update attendance settings | Admin, HR |

---

### 13.1 · Get attendance settings

`GET` `/settings/attendance`

**Purpose:** Current policy for the caller's company.

- **Access:** Super Admin, Admin, HR
- **Used by:** ConfigurationPage → Attendance Settings, ShiftFormDialog (default grace)
- **Auth:** `Authorization: Bearer <accessToken>`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `companyId` | string | no | Required for Super Admin; ignored for Admin/HR. |

**Response scenarios**

#### ✅ `200 OK` — Settings (defaults returned if never saved)

```json
{
  "success": true,
  "data": {
    "companyId": "company-001",
    "lateGracePeriodMinutes": 15,
    "earlyOutThresholdMinutes": 15,
    "minimumWorkingHours": "07:00",
    "overtimeThresholdMinutes": 30,
    "overtimeEnabled": true,
    "autoAbsent": false,
    "updatedAt": "2026-09-14T10:45:00Z",
    "updatedBy": "Meera Nambiar"
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

### 13.2 · Update attendance settings

`PUT` `/settings/attendance`

**Purpose:** Save the policy. **Triggers a background recalculation** of late / early-out / overtime for the company's attendance (current and previous month).

- **Access:** Admin, HR
- **Used by:** ConfigurationPage → Save Attendance Settings
- **Auth:** `Authorization: Bearer <accessToken>`

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `lateGracePeriodMinutes` | integer | **yes** | 0–120. Default for new shifts. |
| `earlyOutThresholdMinutes` | integer | **yes** | 0–120. |
| `minimumWorkingHours` | time (`HH:mm`) | **yes** | `HH:mm`. |
| `overtimeThresholdMinutes` | integer | **yes** | 0–240. |
| `overtimeEnabled` | boolean | **yes** |  |
| `autoAbsent` | boolean | **yes** |  |

```json
{
  "lateGracePeriodMinutes": 15,
  "earlyOutThresholdMinutes": 15,
  "minimumWorkingHours": "07:00",
  "overtimeThresholdMinutes": 60,
  "overtimeEnabled": true,
  "autoAbsent": false
}
```

**Response scenarios**

#### ✅ `200 OK` — Saved; recalculation queued

```json
{
  "success": true,
  "message": "Attendance settings saved",
  "data": {
    "companyId": "company-001",
    "lateGracePeriodMinutes": 15,
    "earlyOutThresholdMinutes": 15,
    "minimumWorkingHours": "07:00",
    "overtimeThresholdMinutes": 60,
    "overtimeEnabled": true,
    "autoAbsent": false,
    "updatedAt": "2026-09-14T10:45:00Z",
    "updatedBy": "Meera Nambiar",
    "recalculation": {
      "jobId": "job_a41e77",
      "status": "QUEUED"
    }
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
      "field": "overtimeThresholdMinutes",
      "message": "Must be between 0 and 240"
    },
    {
      "field": "minimumWorkingHours",
      "message": "Use HH:mm format"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---
