# 9. Attendance

Daily / monthly attendance, manual punch entries and recalculation. **Attendance records are calculated, never posted** — the inputs are device punches, manual entries, the shift, holidays, weekly offs, approved leave and the company attendance settings.

### Status rules

| Status | When |
|---|---|
| `WEEKLY_OFF` | The weekday is in the employee's `weeklyOff` and there are no punches. |
| `HOLIDAY` | An ACTIVE holiday exists for the sub-company on that date and there are no punches. |
| `ON_LEAVE` | An approved leave request covers the day (overrides device punches, but not an explicit manual entry). |
| `ABSENT` | Working day, no punches. |
| `INCOMPLETE` | Punches exist but the last punch is an IN (or there is only an OUT). Also called "missing punch". |
| `LATE` | First IN is later than `shiftStart + gracePeriod` (takes priority over EARLY_OUT). |
| `EARLY_OUT` | Last OUT is earlier than `shiftEnd − earlyOutThreshold`. |
| `PRESENT` | Everything else. |

**Calculations:** `workingMinutes` = sum of IN→OUT pairs · `breakMinutes` = OUT→next IN gaps · `lateMinutes` = first IN − (start + grace) · `earlyOutMinutes` = (end − threshold) − last OUT · `overtimeMinutes` = last OUT − shift end, counted only when overtime is enabled and the value is ≥ the overtime threshold.
Overnight shifts (e.g. 18:00 → 03:00) belong to the **start date**; their OUT punch is on the next calendar day.

[← Back to overview](../README.md)

## Endpoints in this module

| # | Method | Path | Purpose | Access |
|---|---|---|---|---|
| 9.1 | `GET` | `/attendance/daily` | Daily attendance | Super Admin, Admin, HR |
| 9.2 | `GET` | `/attendance/monthly` | Monthly attendance | Super Admin, Admin, HR |
| 9.3 | `GET` | `/attendance/employees/{employeeId}/monthly` | One employee's month | Super Admin, Admin, HR |
| 9.4 | `GET` | `/attendance/employees/{employeeId}/dates/{date}` | One employee-day | Super Admin, Admin, HR |
| 9.5 | `GET` | `/attendance/manual-entries/{employeeId}/{date}` | Get manual entry | Admin, HR |
| 9.6 | `POST` | `/attendance/manual-entries` | Add manual entry | Admin, HR |
| 9.7 | `PUT` | `/attendance/manual-entries/{employeeId}/{date}` | Edit manual entry | Admin, HR |
| 9.8 | `DELETE` | `/attendance/manual-entries/{employeeId}/{date}` | Delete manual entry | Admin, HR |
| 9.9 | `POST` | `/attendance/recalculate` | Recalculate attendance | Admin, HR |

---

### 9.1 · Daily attendance

`GET` `/attendance/daily`

**Purpose:** All employees' attendance for one date, with aggregate stats for the stat cards. Ordered by employee code.

- **Access:** Super Admin, Admin, HR
- **Used by:** AttendancePage, Sub-company detail ("Present today")
- **Auth:** `Authorization: Bearer <accessToken>`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `date` | date (`YYYY-MM-DD`) | **yes** | `YYYY-MM-DD`. |
| `subCompanyId` | string | no | HR: forced to own sub-company. Admin: optional (topbar selector). Omit = all sub-companies of the company. |
| `companyId` | string | no | Super Admin only. Admin/HR: forced to own company. |
| `departmentId` | string | no | Department **name** (matches `AttendanceRecord.department`). |
| `status` | `PRESENT` \| `ABSENT` \| `LATE` \| `EARLY_OUT` \| `INCOMPLETE` \| `HOLIDAY` \| `WEEKLY_OFF` \| `ON_LEAVE` | no |  |
| `search` | string | no | Case-insensitive text search. |
| `page` | integer | no | Page number, starting at 1. Default `1`. |
| `pageSize` | integer | no | Rows per page. Default `10`, max `200`. |

**Notes**

- `stats` covers **all** records matching the filters (not just the current page).
- Default `pageSize` for this endpoint is 10; the UI table uses 10.

**Response scenarios**

#### ✅ `200 OK` — Records + stats

```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "att-emp-001-2026-09-19",
        "employeeId": "emp-001",
        "employeeCode": "EMP-1001",
        "employeeName": "Rahul Menon",
        "department": "Engineering",
        "designation": "Senior Software Engineer",
        "date": "2026-09-19",
        "shiftId": "shift-001",
        "shiftName": "General Shift",
        "shiftStartTime": "09:00",
        "shiftEndTime": "18:00",
        "firstPunchIn": "2026-09-19T08:55:00",
        "lastPunchOut": "2026-09-19T18:35:00",
        "punchRecords": [
          {
            "id": "p-001",
            "employeeId": "emp-001",
            "employeeCode": "EMP-1001",
            "employeeName": "Rahul Menon",
            "deviceId": "device-001",
            "deviceName": "Kochi Main Entrance",
            "punchTime": "2026-09-19T08:55:00",
            "punchType": "IN",
            "companyId": "company-001",
            "subCompanyId": "sub-001",
            "date": "2026-09-19"
          },
          {
            "id": "p-002",
            "employeeId": "emp-001",
            "employeeCode": "EMP-1001",
            "employeeName": "Rahul Menon",
            "deviceId": "device-001",
            "deviceName": "Kochi Main Entrance",
            "punchTime": "2026-09-19T13:01:00",
            "punchType": "OUT",
            "companyId": "company-001",
            "subCompanyId": "sub-001",
            "date": "2026-09-19"
          },
          {
            "id": "p-003",
            "employeeId": "emp-001",
            "employeeCode": "EMP-1001",
            "employeeName": "Rahul Menon",
            "deviceId": "device-001",
            "deviceName": "Kochi Main Entrance",
            "punchTime": "2026-09-19T13:55:00",
            "punchType": "IN",
            "companyId": "company-001",
            "subCompanyId": "sub-001",
            "date": "2026-09-19"
          },
          {
            "id": "p-004",
            "employeeId": "emp-001",
            "employeeCode": "EMP-1001",
            "employeeName": "Rahul Menon",
            "deviceId": "device-001",
            "deviceName": "Kochi Main Entrance",
            "punchTime": "2026-09-19T18:35:00",
            "punchType": "OUT",
            "companyId": "company-001",
            "subCompanyId": "sub-001",
            "date": "2026-09-19"
          }
        ],
        "workingMinutes": 526,
        "breakMinutes": 54,
        "lateMinutes": 0,
        "earlyOutMinutes": 0,
        "overtimeMinutes": 35,
        "status": "PRESENT",
        "companyId": "company-001",
        "subCompanyId": "sub-001",
        "subCompanyName": "Nexus Kochi HQ",
        "isManual": false,
        "manualReason": null,
        "manualSource": null,
        "manualBy": null,
        "manualAt": null,
        "leaveType": null,
        "leaveRequestId": null
      },
      {
        "id": "att-emp-002-2026-09-19",
        "employeeId": "emp-002",
        "employeeCode": "EMP-1002",
        "employeeName": "Aishwarya Nair",
        "department": "Engineering",
        "designation": "Software Engineer",
        "date": "2026-09-19",
        "shiftId": "shift-001",
        "shiftName": "General Shift",
        "shiftStartTime": "09:00",
        "shiftEndTime": "18:00",
        "firstPunchIn": "2026-09-19T09:42:00",
        "lastPunchOut": "2026-09-19T18:10:00",
        "punchRecords": [
          {
            "id": "p-005",
            "employeeId": "emp-002",
            "employeeCode": "EMP-1002",
            "employeeName": "Aishwarya Nair",
            "deviceId": "device-001",
            "deviceName": "Kochi Main Entrance",
            "punchTime": "2026-09-19T09:42:00",
            "punchType": "IN",
            "companyId": "company-001",
            "subCompanyId": "sub-001",
            "date": "2026-09-19"
          },
          {
            "id": "p-006",
            "employeeId": "emp-002",
            "employeeCode": "EMP-1002",
            "employeeName": "Aishwarya Nair",
            "deviceId": "device-001",
            "deviceName": "Kochi Main Entrance",
            "punchTime": "2026-09-19T18:10:00",
            "punchType": "OUT",
            "companyId": "company-001",
            "subCompanyId": "sub-001",
            "date": "2026-09-19"
          }
        ],
        "workingMinutes": 508,
        "breakMinutes": 0,
        "lateMinutes": 27,
        "earlyOutMinutes": 0,
        "overtimeMinutes": 10,
        "status": "LATE",
        "companyId": "company-001",
        "subCompanyId": "sub-001",
        "subCompanyName": "Nexus Kochi HQ",
        "isManual": false,
        "manualReason": null,
        "manualSource": null,
        "manualBy": null,
        "manualAt": null,
        "leaveType": null,
        "leaveRequestId": null
      }
    ],
    "stats": {
      "total": 25,
      "present": 9,
      "absent": 1,
      "late": 3,
      "earlyOut": 1,
      "missingPunch": 1,
      "onLeave": 0,
      "holiday": 0,
      "weeklyOff": 10,
      "overtimeMinutes": 57
    }
  },
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

#### ✅ `200 OK` — No records for the filters

```json
{
  "success": true,
  "data": {
    "records": [],
    "stats": {
      "total": 0,
      "present": 0,
      "absent": 0,
      "late": 0,
      "earlyOut": 0,
      "missingPunch": 0,
      "onLeave": 0,
      "holiday": 0,
      "weeklyOff": 0,
      "overtimeMinutes": 0
    }
  },
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 0,
    "totalPages": 1
  }
}
```

#### ❌ `422 Unprocessable Entity` — Missing / invalid date

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "errors": [
    {
      "field": "date",
      "message": "Date is required (YYYY-MM-DD)"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `403 Forbidden` — HR / Admin requested a sub-company outside their scope

```json
{
  "success": false,
  "code": "FORBIDDEN",
  "message": "You cannot view attendance for this sub company",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 9.2 · Monthly attendance

`GET` `/attendance/monthly`

**Purpose:** Every employee-day in a month (or one employee's month) with a summary. For a single employee the response is filled so every calendar day up to today has a row.

- **Access:** Super Admin, Admin, HR
- **Used by:** MonthlyAttendancePage
- **Auth:** `Authorization: Bearer <accessToken>`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `month` | integer | **yes** | 1–12. |
| `year` | integer | **yes** |  |
| `employeeId` | string | no | One employee. When supplied, missing days are filled (WEEKLY_OFF / HOLIDAY / ABSENT). |
| `subCompanyId` | string | no | HR: forced to own. Admin: optional. |
| `companyId` | string | no | Super Admin only. |
| `departmentId` | string | no | Department name. |
| `page` | integer | no | Page number, starting at 1. Default `1`. |
| `pageSize` | integer | no | Rows per page. Default `10`, max `200`. |

**Notes**

- `summary` counts PRESENT/LATE/EARLY_OUT as present days and totals working and overtime minutes across all matching records (not just the page).

**Response scenarios**

#### ✅ `200 OK` — Records + summary

```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "att-emp-001-2026-09-19",
        "employeeId": "emp-001",
        "employeeCode": "EMP-1001",
        "employeeName": "Rahul Menon",
        "department": "Engineering",
        "designation": "Senior Software Engineer",
        "date": "2026-09-19",
        "shiftId": "shift-001",
        "shiftName": "General Shift",
        "shiftStartTime": "09:00",
        "shiftEndTime": "18:00",
        "firstPunchIn": "2026-09-19T08:55:00",
        "lastPunchOut": "2026-09-19T18:35:00",
        "punchRecords": [
          {
            "id": "p-001",
            "employeeId": "emp-001",
            "employeeCode": "EMP-1001",
            "employeeName": "Rahul Menon",
            "deviceId": "device-001",
            "deviceName": "Kochi Main Entrance",
            "punchTime": "2026-09-19T08:55:00",
            "punchType": "IN",
            "companyId": "company-001",
            "subCompanyId": "sub-001",
            "date": "2026-09-19"
          },
          {
            "id": "p-002",
            "employeeId": "emp-001",
            "employeeCode": "EMP-1001",
            "employeeName": "Rahul Menon",
            "deviceId": "device-001",
            "deviceName": "Kochi Main Entrance",
            "punchTime": "2026-09-19T13:01:00",
            "punchType": "OUT",
            "companyId": "company-001",
            "subCompanyId": "sub-001",
            "date": "2026-09-19"
          },
          {
            "id": "p-003",
            "employeeId": "emp-001",
            "employeeCode": "EMP-1001",
            "employeeName": "Rahul Menon",
            "deviceId": "device-001",
            "deviceName": "Kochi Main Entrance",
            "punchTime": "2026-09-19T13:55:00",
            "punchType": "IN",
            "companyId": "company-001",
            "subCompanyId": "sub-001",
            "date": "2026-09-19"
          },
          {
            "id": "p-004",
            "employeeId": "emp-001",
            "employeeCode": "EMP-1001",
            "employeeName": "Rahul Menon",
            "deviceId": "device-001",
            "deviceName": "Kochi Main Entrance",
            "punchTime": "2026-09-19T18:35:00",
            "punchType": "OUT",
            "companyId": "company-001",
            "subCompanyId": "sub-001",
            "date": "2026-09-19"
          }
        ],
        "workingMinutes": 526,
        "breakMinutes": 54,
        "lateMinutes": 0,
        "earlyOutMinutes": 0,
        "overtimeMinutes": 35,
        "status": "PRESENT",
        "companyId": "company-001",
        "subCompanyId": "sub-001",
        "subCompanyName": "Nexus Kochi HQ",
        "isManual": false,
        "manualReason": null,
        "manualSource": null,
        "manualBy": null,
        "manualAt": null,
        "leaveType": null,
        "leaveRequestId": null
      },
      {
        "id": "att-emp-002-2026-09-19",
        "employeeId": "emp-002",
        "employeeCode": "EMP-1002",
        "employeeName": "Aishwarya Nair",
        "department": "Engineering",
        "designation": "Software Engineer",
        "date": "2026-09-19",
        "shiftId": "shift-001",
        "shiftName": "General Shift",
        "shiftStartTime": "09:00",
        "shiftEndTime": "18:00",
        "firstPunchIn": "2026-09-19T09:42:00",
        "lastPunchOut": "2026-09-19T18:10:00",
        "punchRecords": [
          {
            "id": "p-005",
            "employeeId": "emp-002",
            "employeeCode": "EMP-1002",
            "employeeName": "Aishwarya Nair",
            "deviceId": "device-001",
            "deviceName": "Kochi Main Entrance",
            "punchTime": "2026-09-19T09:42:00",
            "punchType": "IN",
            "companyId": "company-001",
            "subCompanyId": "sub-001",
            "date": "2026-09-19"
          },
          {
            "id": "p-006",
            "employeeId": "emp-002",
            "employeeCode": "EMP-1002",
            "employeeName": "Aishwarya Nair",
            "deviceId": "device-001",
            "deviceName": "Kochi Main Entrance",
            "punchTime": "2026-09-19T18:10:00",
            "punchType": "OUT",
            "companyId": "company-001",
            "subCompanyId": "sub-001",
            "date": "2026-09-19"
          }
        ],
        "workingMinutes": 508,
        "breakMinutes": 0,
        "lateMinutes": 27,
        "earlyOutMinutes": 0,
        "overtimeMinutes": 10,
        "status": "LATE",
        "companyId": "company-001",
        "subCompanyId": "sub-001",
        "subCompanyName": "Nexus Kochi HQ",
        "isManual": false,
        "manualReason": null,
        "manualSource": null,
        "manualBy": null,
        "manualAt": null,
        "leaveType": null,
        "leaveRequestId": null
      }
    ],
    "summary": {
      "present": 16,
      "absent": 1,
      "late": 3,
      "earlyOut": 2,
      "holiday": 0,
      "weeklyOff": 8,
      "leave": 0,
      "totalMinutes": 8120,
      "overtimeMinutes": 190
    }
  },
  "pagination": {
    "page": 1,
    "pageSize": 15,
    "total": 550,
    "totalPages": 37
  }
}
```

#### ✅ `200 OK` — Nothing for that month

```json
{
  "success": true,
  "data": {
    "records": [],
    "summary": {
      "present": 0,
      "absent": 0,
      "late": 0,
      "earlyOut": 0,
      "holiday": 0,
      "weeklyOff": 0,
      "leave": 0,
      "totalMinutes": 0,
      "overtimeMinutes": 0
    }
  },
  "pagination": {
    "page": 1,
    "pageSize": 15,
    "total": 0,
    "totalPages": 1
  }
}
```

#### ❌ `422 Unprocessable Entity` — Bad month / year

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "errors": [
    {
      "field": "month",
      "message": "Must be between 1 and 12"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `404 Not Found` — `employeeId` not found in scope

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

### 9.3 · One employee's month

`GET` `/attendance/employees/{employeeId}/monthly`

**Purpose:** An employee's attendance rows for a month (no fill, no summary). Used by the Employee detail → Attendance tab.

- **Access:** Super Admin, Admin, HR
- **Used by:** EmployeeDetailPage → Attendance tab
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `employeeId` | string | Employee id. |

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `month` | integer | **yes** | 1–12. |
| `year` | integer | **yes** |  |

**Response scenarios**

#### ✅ `200 OK` — Rows sorted by date

```json
{
  "success": true,
  "data": [
    {
      "id": "att-emp-001-2026-09-19",
      "employeeId": "emp-001",
      "employeeCode": "EMP-1001",
      "employeeName": "Rahul Menon",
      "department": "Engineering",
      "designation": "Senior Software Engineer",
      "date": "2026-09-19",
      "shiftId": "shift-001",
      "shiftName": "General Shift",
      "shiftStartTime": "09:00",
      "shiftEndTime": "18:00",
      "firstPunchIn": "2026-09-19T08:55:00",
      "lastPunchOut": "2026-09-19T18:35:00",
      "punchRecords": [
        {
          "id": "p-001",
          "employeeId": "emp-001",
          "employeeCode": "EMP-1001",
          "employeeName": "Rahul Menon",
          "deviceId": "device-001",
          "deviceName": "Kochi Main Entrance",
          "punchTime": "2026-09-19T08:55:00",
          "punchType": "IN",
          "companyId": "company-001",
          "subCompanyId": "sub-001",
          "date": "2026-09-19"
        },
        {
          "id": "p-002",
          "employeeId": "emp-001",
          "employeeCode": "EMP-1001",
          "employeeName": "Rahul Menon",
          "deviceId": "device-001",
          "deviceName": "Kochi Main Entrance",
          "punchTime": "2026-09-19T13:01:00",
          "punchType": "OUT",
          "companyId": "company-001",
          "subCompanyId": "sub-001",
          "date": "2026-09-19"
        },
        {
          "id": "p-003",
          "employeeId": "emp-001",
          "employeeCode": "EMP-1001",
          "employeeName": "Rahul Menon",
          "deviceId": "device-001",
          "deviceName": "Kochi Main Entrance",
          "punchTime": "2026-09-19T13:55:00",
          "punchType": "IN",
          "companyId": "company-001",
          "subCompanyId": "sub-001",
          "date": "2026-09-19"
        },
        {
          "id": "p-004",
          "employeeId": "emp-001",
          "employeeCode": "EMP-1001",
          "employeeName": "Rahul Menon",
          "deviceId": "device-001",
          "deviceName": "Kochi Main Entrance",
          "punchTime": "2026-09-19T18:35:00",
          "punchType": "OUT",
          "companyId": "company-001",
          "subCompanyId": "sub-001",
          "date": "2026-09-19"
        }
      ],
      "workingMinutes": 526,
      "breakMinutes": 54,
      "lateMinutes": 0,
      "earlyOutMinutes": 0,
      "overtimeMinutes": 35,
      "status": "PRESENT",
      "companyId": "company-001",
      "subCompanyId": "sub-001",
      "subCompanyName": "Nexus Kochi HQ",
      "isManual": false,
      "manualReason": null,
      "manualSource": null,
      "manualBy": null,
      "manualAt": null,
      "leaveType": null,
      "leaveRequestId": null
    }
  ]
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

#### ❌ `422 Unprocessable Entity` — Bad month / year

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "errors": [
    {
      "field": "year",
      "message": "Year is required"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 9.4 · One employee-day

`GET` `/attendance/employees/{employeeId}/dates/{date}`

**Purpose:** A single day with the full punch timeline, calculated figures and manual-entry info. Powers the Attendance detail page.

- **Access:** Super Admin, Admin, HR
- **Used by:** AttendanceDetailPage
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `employeeId` | string | Employee id. |
| `date` | date (`YYYY-MM-DD`) | `YYYY-MM-DD`. |

**Response scenarios**

#### ✅ `200 OK` — Record found (with device punches)

```json
{
  "success": true,
  "data": {
    "id": "att-emp-001-2026-09-19",
    "employeeId": "emp-001",
    "employeeCode": "EMP-1001",
    "employeeName": "Rahul Menon",
    "department": "Engineering",
    "designation": "Senior Software Engineer",
    "date": "2026-09-19",
    "shiftId": "shift-001",
    "shiftName": "General Shift",
    "shiftStartTime": "09:00",
    "shiftEndTime": "18:00",
    "firstPunchIn": "2026-09-19T08:55:00",
    "lastPunchOut": "2026-09-19T18:35:00",
    "punchRecords": [
      {
        "id": "p-001",
        "employeeId": "emp-001",
        "employeeCode": "EMP-1001",
        "employeeName": "Rahul Menon",
        "deviceId": "device-001",
        "deviceName": "Kochi Main Entrance",
        "punchTime": "2026-09-19T08:55:00",
        "punchType": "IN",
        "companyId": "company-001",
        "subCompanyId": "sub-001",
        "date": "2026-09-19"
      },
      {
        "id": "p-002",
        "employeeId": "emp-001",
        "employeeCode": "EMP-1001",
        "employeeName": "Rahul Menon",
        "deviceId": "device-001",
        "deviceName": "Kochi Main Entrance",
        "punchTime": "2026-09-19T13:01:00",
        "punchType": "OUT",
        "companyId": "company-001",
        "subCompanyId": "sub-001",
        "date": "2026-09-19"
      },
      {
        "id": "p-003",
        "employeeId": "emp-001",
        "employeeCode": "EMP-1001",
        "employeeName": "Rahul Menon",
        "deviceId": "device-001",
        "deviceName": "Kochi Main Entrance",
        "punchTime": "2026-09-19T13:55:00",
        "punchType": "IN",
        "companyId": "company-001",
        "subCompanyId": "sub-001",
        "date": "2026-09-19"
      },
      {
        "id": "p-004",
        "employeeId": "emp-001",
        "employeeCode": "EMP-1001",
        "employeeName": "Rahul Menon",
        "deviceId": "device-001",
        "deviceName": "Kochi Main Entrance",
        "punchTime": "2026-09-19T18:35:00",
        "punchType": "OUT",
        "companyId": "company-001",
        "subCompanyId": "sub-001",
        "date": "2026-09-19"
      }
    ],
    "workingMinutes": 526,
    "breakMinutes": 54,
    "lateMinutes": 0,
    "earlyOutMinutes": 0,
    "overtimeMinutes": 35,
    "status": "PRESENT",
    "companyId": "company-001",
    "subCompanyId": "sub-001",
    "subCompanyName": "Nexus Kochi HQ",
    "isManual": false,
    "manualReason": null,
    "manualSource": null,
    "manualBy": null,
    "manualAt": null,
    "leaveType": null,
    "leaveRequestId": null
  }
}
```

#### ✅ `200 OK` — Day that also has a manual entry

```json
{
  "success": true,
  "data": {
    "id": "att-emp-001-2026-09-19",
    "employeeId": "emp-001",
    "employeeCode": "EMP-1001",
    "employeeName": "Rahul Menon",
    "department": "Engineering",
    "designation": "Senior Software Engineer",
    "date": "2026-09-19",
    "shiftId": "shift-001",
    "shiftName": "General Shift",
    "shiftStartTime": "09:00",
    "shiftEndTime": "18:00",
    "firstPunchIn": "2026-09-19T08:55:00",
    "lastPunchOut": "2026-09-19T18:35:00",
    "punchRecords": [
      {
        "id": "p-001",
        "employeeId": "emp-001",
        "employeeCode": "EMP-1001",
        "employeeName": "Rahul Menon",
        "deviceId": "device-001",
        "deviceName": "Kochi Main Entrance",
        "punchTime": "2026-09-19T09:10:00",
        "punchType": "IN",
        "companyId": "company-001",
        "subCompanyId": "sub-001",
        "date": "2026-09-19"
      },
      {
        "id": "manual-emp-001-2026-09-19-out-0",
        "employeeId": "emp-001",
        "employeeCode": "EMP-1001",
        "employeeName": "Rahul Menon",
        "deviceId": "MANUAL",
        "deviceName": "Manual Entry",
        "punchTime": "2026-09-19T18:05:00",
        "punchType": "OUT",
        "companyId": "company-001",
        "subCompanyId": "sub-001",
        "date": "2026-09-19"
      }
    ],
    "workingMinutes": 535,
    "breakMinutes": 54,
    "lateMinutes": 0,
    "earlyOutMinutes": 0,
    "overtimeMinutes": 35,
    "status": "PRESENT",
    "companyId": "company-001",
    "subCompanyId": "sub-001",
    "subCompanyName": "Nexus Kochi HQ",
    "isManual": true,
    "manualReason": "Device was offline; employee forgot to punch out",
    "manualSource": "MANUAL",
    "manualBy": "Divya Menon",
    "manualAt": "2026-09-20T09:12:00Z",
    "leaveType": null,
    "leaveRequestId": null
  }
}
```

#### ✅ `200 OK` — No record for that day (e.g. before joining / future)

```json
{
  "success": true,
  "data": null
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

### 9.5 · Get manual entry

`GET` `/attendance/manual-entries/{employeeId}/{date}`

**Purpose:** The manual punches and reason stored for an employee-day (used to pre-fill the Edit Manual Entry dialog).

- **Access:** Admin, HR
- **Used by:** ManualAttendanceDialog (edit mode)
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `employeeId` | string |  |
| `date` | date (`YYYY-MM-DD`) |  |

**Response scenarios**

#### ✅ `200 OK` — Entry exists

```json
{
  "success": true,
  "data": {
    "employeeId": "emp-001",
    "date": "2026-09-19",
    "entries": [
      {
        "punchIn": "",
        "punchOut": "18:05"
      }
    ],
    "reason": "Device was offline; employee forgot to punch out",
    "source": "MANUAL",
    "by": "Divya Menon",
    "at": "2026-09-20T09:12:00Z"
  }
}
```

#### ✅ `200 OK` — No manual entry for that day

```json
{
  "success": true,
  "data": null
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

### 9.6 · Add manual entry

`POST` `/attendance/manual-entries`

**Purpose:** Add hand-entered punches for a day (device offline, forgot to punch, etc.). **The manual punches are added to the day's device punches — they never replace them.** Late / early-out / overtime are recalculated immediately.

- **Access:** Admin, HR
- **Used by:** ManualAttendanceDialog
- **Auth:** `Authorization: Bearer <accessToken>`

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `employeeId` | string | **yes** | Active employee in scope. |
| `date` | date (`YYYY-MM-DD`) | **yes** | Today or earlier; not before the joining date. |
| `punches` | object[] | **yes** | At least one `{ punchIn, punchOut }`. |
| `punches[].punchIn` | time (`HH:mm`) | no | `HH:mm`. Required on the first pair. Leave empty to add only an OUT punch. |
| `punches[].punchOut` | time (`HH:mm`) | no | `HH:mm`, must be after `punchIn`. Empty = missing OUT. |
| `reason` | string | **yes** | Min 5 characters. |

```json
{
  "employeeId": "emp-001",
  "date": "2026-09-19",
  "punches": [
    {
      "punchIn": "",
      "punchOut": "18:05"
    }
  ],
  "reason": "Device was offline; employee forgot to punch out"
}
```

**Notes**

- At most **one** manual entry per employee per day; a second `POST` returns 409 (use `PUT`).
- Writes an activity-log entry (module `Attendance`).

**Response scenarios**

#### ✅ `201 Created` — Entry saved; recalculated record returned

```json
{
  "success": true,
  "message": "Attendance recorded",
  "data": {
    "id": "att-emp-001-2026-09-19",
    "employeeId": "emp-001",
    "employeeCode": "EMP-1001",
    "employeeName": "Rahul Menon",
    "department": "Engineering",
    "designation": "Senior Software Engineer",
    "date": "2026-09-19",
    "shiftId": "shift-001",
    "shiftName": "General Shift",
    "shiftStartTime": "09:00",
    "shiftEndTime": "18:00",
    "firstPunchIn": "2026-09-19T08:55:00",
    "lastPunchOut": "2026-09-19T18:35:00",
    "punchRecords": [
      {
        "id": "p-001",
        "employeeId": "emp-001",
        "employeeCode": "EMP-1001",
        "employeeName": "Rahul Menon",
        "deviceId": "device-001",
        "deviceName": "Kochi Main Entrance",
        "punchTime": "2026-09-19T09:10:00",
        "punchType": "IN",
        "companyId": "company-001",
        "subCompanyId": "sub-001",
        "date": "2026-09-19"
      },
      {
        "id": "manual-emp-001-2026-09-19-out-0",
        "employeeId": "emp-001",
        "employeeCode": "EMP-1001",
        "employeeName": "Rahul Menon",
        "deviceId": "MANUAL",
        "deviceName": "Manual Entry",
        "punchTime": "2026-09-19T18:05:00",
        "punchType": "OUT",
        "companyId": "company-001",
        "subCompanyId": "sub-001",
        "date": "2026-09-19"
      }
    ],
    "workingMinutes": 535,
    "breakMinutes": 54,
    "lateMinutes": 0,
    "earlyOutMinutes": 0,
    "overtimeMinutes": 35,
    "status": "PRESENT",
    "companyId": "company-001",
    "subCompanyId": "sub-001",
    "subCompanyName": "Nexus Kochi HQ",
    "isManual": true,
    "manualReason": "Device was offline; employee forgot to punch out",
    "manualSource": "MANUAL",
    "manualBy": "Divya Menon",
    "manualAt": "2026-09-20T09:12:00Z",
    "leaveType": null,
    "leaveRequestId": null
  }
}
```

#### ❌ `409 Conflict` — A manual entry already exists for that day

```json
{
  "success": false,
  "code": "MANUAL_ENTRY_EXISTS",
  "message": "A manual entry already exists for this employee and date. Edit it instead.",
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
      "message": "Date cannot be in the future"
    },
    {
      "field": "punches.0.punchOut",
      "message": "Punch-out must be after punch-in"
    },
    {
      "field": "reason",
      "message": "Please provide a reason (min 5 characters)"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `422 Unprocessable Entity` — Date before joining date

```json
{
  "success": false,
  "code": "BUSINESS_RULE_VIOLATION",
  "message": "Date is before the employee joined",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `403 Forbidden` — Employee outside caller's scope

```json
{
  "success": false,
  "code": "FORBIDDEN",
  "message": "You cannot edit attendance for this employee",
  "requestId": "req_8f3c2a91"
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

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 9.7 · Edit manual entry

`PUT` `/attendance/manual-entries/{employeeId}/{date}`

**Purpose:** Replace the manual punches and reason of an existing entry. Device punches are untouched.

- **Access:** Admin, HR
- **Used by:** ManualAttendanceDialog (edit mode)
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `employeeId` | string |  |
| `date` | date (`YYYY-MM-DD`) |  |

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `punches` | object[] | **yes** | At least one `{ punchIn, punchOut }`. |
| `punches[].punchIn` | time (`HH:mm`) | no | `HH:mm`. Required on the first pair. Leave empty to add only an OUT punch. |
| `punches[].punchOut` | time (`HH:mm`) | no | `HH:mm`, must be after `punchIn`. Empty = missing OUT. |
| `reason` | string | **yes** | Min 5 characters. |

```json
{
  "punches": [
    {
      "punchIn": "",
      "punchOut": "19:30"
    }
  ],
  "reason": "Corrected time after checking CCTV"
}
```

**Response scenarios**

#### ✅ `200 OK` — Entry updated

```json
{
  "success": true,
  "message": "Manual entry updated",
  "data": {
    "id": "att-emp-001-2026-09-19",
    "employeeId": "emp-001",
    "employeeCode": "EMP-1001",
    "employeeName": "Rahul Menon",
    "department": "Engineering",
    "designation": "Senior Software Engineer",
    "date": "2026-09-19",
    "shiftId": "shift-001",
    "shiftName": "General Shift",
    "shiftStartTime": "09:00",
    "shiftEndTime": "18:00",
    "firstPunchIn": "2026-09-19T08:55:00",
    "lastPunchOut": "2026-09-19T18:35:00",
    "punchRecords": [
      {
        "id": "p-001",
        "employeeId": "emp-001",
        "employeeCode": "EMP-1001",
        "employeeName": "Rahul Menon",
        "deviceId": "device-001",
        "deviceName": "Kochi Main Entrance",
        "punchTime": "2026-09-19T09:10:00",
        "punchType": "IN",
        "companyId": "company-001",
        "subCompanyId": "sub-001",
        "date": "2026-09-19"
      },
      {
        "id": "manual-emp-001-2026-09-19-out-0",
        "employeeId": "emp-001",
        "employeeCode": "EMP-1001",
        "employeeName": "Rahul Menon",
        "deviceId": "MANUAL",
        "deviceName": "Manual Entry",
        "punchTime": "2026-09-19T18:05:00",
        "punchType": "OUT",
        "companyId": "company-001",
        "subCompanyId": "sub-001",
        "date": "2026-09-19"
      }
    ],
    "workingMinutes": 535,
    "breakMinutes": 54,
    "lateMinutes": 0,
    "earlyOutMinutes": 0,
    "overtimeMinutes": 90,
    "status": "PRESENT",
    "companyId": "company-001",
    "subCompanyId": "sub-001",
    "subCompanyName": "Nexus Kochi HQ",
    "isManual": true,
    "manualReason": "Device was offline; employee forgot to punch out",
    "manualSource": "MANUAL",
    "manualBy": "Divya Menon",
    "manualAt": "2026-09-20T09:12:00Z",
    "leaveType": null,
    "leaveRequestId": null
  }
}
```

#### ❌ `404 Not Found` — No manual entry exists for that day

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "No manual entry exists for this day",
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
      "field": "punches.0.punchIn",
      "message": "Punch-in time required"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 9.8 · Delete manual entry

`DELETE` `/attendance/manual-entries/{employeeId}/{date}`

**Purpose:** Remove the manual punches. The day reverts to whatever the device recorded.

- **Access:** Admin, HR
- **Used by:** AttendanceDetailPage → Delete Manual Entry
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `employeeId` | string |  |
| `date` | date (`YYYY-MM-DD`) |  |

**Response scenarios**

#### ✅ `200 OK` — Deleted; reverted record returned

```json
{
  "success": true,
  "message": "Manual entry deleted",
  "data": {
    "id": "att-emp-001-2026-09-19",
    "employeeId": "emp-001",
    "employeeCode": "EMP-1001",
    "employeeName": "Rahul Menon",
    "department": "Engineering",
    "designation": "Senior Software Engineer",
    "date": "2026-09-19",
    "shiftId": "shift-001",
    "shiftName": "General Shift",
    "shiftStartTime": "09:00",
    "shiftEndTime": "18:00",
    "firstPunchIn": "2026-09-19T08:55:00",
    "lastPunchOut": "2026-09-19T18:35:00",
    "punchRecords": [
      {
        "id": "p-001",
        "employeeId": "emp-001",
        "employeeCode": "EMP-1001",
        "employeeName": "Rahul Menon",
        "deviceId": "device-001",
        "deviceName": "Kochi Main Entrance",
        "punchTime": "2026-09-19T08:55:00",
        "punchType": "IN",
        "companyId": "company-001",
        "subCompanyId": "sub-001",
        "date": "2026-09-19"
      },
      {
        "id": "p-002",
        "employeeId": "emp-001",
        "employeeCode": "EMP-1001",
        "employeeName": "Rahul Menon",
        "deviceId": "device-001",
        "deviceName": "Kochi Main Entrance",
        "punchTime": "2026-09-19T13:01:00",
        "punchType": "OUT",
        "companyId": "company-001",
        "subCompanyId": "sub-001",
        "date": "2026-09-19"
      },
      {
        "id": "p-003",
        "employeeId": "emp-001",
        "employeeCode": "EMP-1001",
        "employeeName": "Rahul Menon",
        "deviceId": "device-001",
        "deviceName": "Kochi Main Entrance",
        "punchTime": "2026-09-19T13:55:00",
        "punchType": "IN",
        "companyId": "company-001",
        "subCompanyId": "sub-001",
        "date": "2026-09-19"
      },
      {
        "id": "p-004",
        "employeeId": "emp-001",
        "employeeCode": "EMP-1001",
        "employeeName": "Rahul Menon",
        "deviceId": "device-001",
        "deviceName": "Kochi Main Entrance",
        "punchTime": "2026-09-19T18:35:00",
        "punchType": "OUT",
        "companyId": "company-001",
        "subCompanyId": "sub-001",
        "date": "2026-09-19"
      }
    ],
    "workingMinutes": 526,
    "breakMinutes": 54,
    "lateMinutes": 0,
    "earlyOutMinutes": 0,
    "overtimeMinutes": 35,
    "status": "PRESENT",
    "companyId": "company-001",
    "subCompanyId": "sub-001",
    "subCompanyName": "Nexus Kochi HQ",
    "isManual": false,
    "manualReason": null,
    "manualSource": null,
    "manualBy": null,
    "manualAt": null,
    "leaveType": null,
    "leaveRequestId": null
  }
}
```

#### ❌ `404 Not Found` — No manual entry exists for that day

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "No manual entry exists for this day",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 9.9 · Recalculate attendance

`POST` `/attendance/recalculate`

**Purpose:** Re-run the attendance calculation for a date range. The server does this automatically when settings, shifts, holidays or employee shifts change; this endpoint exists for support/backfill.

- **Access:** Admin, HR
- **Used by:** Support / operations (no UI)
- **Auth:** `Authorization: Bearer <accessToken>`

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `subCompanyId` | string | no | HR: forced to own. Admin: optional (default all). |
| `employeeId` | string | no |  |
| `startDate` | date (`YYYY-MM-DD`) | **yes** |  |
| `endDate` | date (`YYYY-MM-DD`) | **yes** | Range limited to 92 days. |

```json
{
  "subCompanyId": "sub-001",
  "startDate": "2026-09-01",
  "endDate": "2026-09-20"
}
```

**Response scenarios**

#### ✅ `202 Accepted` — Job accepted (runs in the background)

```json
{
  "success": true,
  "message": "Recalculation started",
  "data": {
    "jobId": "job_7c1d9e",
    "status": "QUEUED",
    "recordsEstimated": 300
  }
}
```

#### ❌ `422 Unprocessable Entity` — Range too large / reversed

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "errors": [
    {
      "field": "endDate",
      "message": "Range cannot exceed 92 days"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---
