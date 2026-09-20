# 15. Dashboards

Pre-aggregated data for each role's landing page. All figures are computed from live data — nothing here is hand-maintained.

[← Back to overview](../README.md)

## Endpoints in this module

| # | Method | Path | Purpose | Access |
|---|---|---|---|---|
| 15.1 | `GET` | `/dashboard/super-admin` | Super Admin dashboard | Super Admin |
| 15.2 | `GET` | `/dashboard/admin` | Admin dashboard | Admin |
| 15.3 | `GET` | `/dashboard/hr` | HR dashboard | HR |

---

### 15.1 · Super Admin dashboard

`GET` `/dashboard/super-admin`

**Purpose:** Platform-wide KPIs, company growth, device health, largest companies and recent activity.

- **Access:** Super Admin
- **Used by:** SuperAdminDashboard
- **Auth:** `Authorization: Bearer <accessToken>`

**Response scenarios**

#### ✅ `200 OK` — Dashboard

```json
{
  "success": true,
  "data": {
    "totalCompanies": 5,
    "activeCompanies": 4,
    "totalSubCompanies": 12,
    "totalEmployees": 25,
    "totalUsers": 7,
    "totalDevices": 12,
    "onlineDevices": 8,
    "offlineDevices": 1,
    "companyTrend": [
      {
        "month": "Apr",
        "companies": 5
      },
      {
        "month": "May",
        "companies": 5
      },
      {
        "month": "Jun",
        "companies": 5
      },
      {
        "month": "Jul",
        "companies": 5
      },
      {
        "month": "Aug",
        "companies": 5
      },
      {
        "month": "Sep",
        "companies": 5
      }
    ],
    "deviceStatus": [
      {
        "name": "Online",
        "value": 8,
        "color": "#22c55e"
      },
      {
        "name": "Offline",
        "value": 1,
        "color": "#ef4444"
      },
      {
        "name": "Unallocated",
        "value": 2,
        "color": "#94a3b8"
      },
      {
        "name": "Maintenance",
        "value": 1,
        "color": "#f59e0b"
      }
    ],
    "topCompanies": [
      {
        "id": "company-001",
        "name": "Nexus Technologies Pvt Ltd",
        "employees": 25,
        "subCompanies": 3
      }
    ],
    "recentActivity": [
      {
        "id": "log-0016",
        "action": "ALLOCATED",
        "module": "Devices",
        "target": "DEV-NX-004 → Nexus Bangalore",
        "userName": "Arjun Krishnaswamy",
        "date": "2026-09-20T09:30:00Z"
      }
    ]
  }
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 15.2 · Admin dashboard

`GET` `/dashboard/admin`

**Purpose:** Company-level attendance KPIs, a 7-day trend and department distribution, optionally narrowed to one sub-company.

- **Access:** Admin
- **Used by:** AdminDashboard
- **Auth:** `Authorization: Bearer <accessToken>`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `subCompanyId` | string | no | Narrow to one sub-company (topbar selector). Omit = all. |

**Response scenarios**

#### ✅ `200 OK` — Dashboard

```json
{
  "success": true,
  "data": {
    "totalEmployees": 25,
    "presentToday": 9,
    "absentToday": 1,
    "lateToday": 3,
    "totalSubCompanies": 3,
    "totalDevices": 8,
    "attendanceTrend": [
      {
        "date": "Mon",
        "present": 22,
        "absent": 1,
        "late": 2
      },
      {
        "date": "Tue",
        "present": 21,
        "absent": 2,
        "late": 3
      },
      {
        "date": "Sat",
        "present": 0,
        "absent": 0,
        "late": 0
      }
    ],
    "departmentDistribution": [
      {
        "name": "Engineering",
        "value": 15,
        "color": "#3b82f6"
      },
      {
        "name": "Product",
        "value": 2,
        "color": "#22c55e"
      }
    ]
  }
}
```

#### ❌ `403 Forbidden` — Sub-company outside the company

```json
{
  "success": false,
  "code": "FORBIDDEN",
  "message": "You cannot view this sub company",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 15.3 · HR dashboard

`GET` `/dashboard/hr`

**Purpose:** Today's status counts for the HR user's sub-company, a 7-day trend, department attendance and the latest records.

- **Access:** HR
- **Used by:** HRDashboard
- **Auth:** `Authorization: Bearer <accessToken>`

**Response scenarios**

#### ✅ `200 OK` — Dashboard

```json
{
  "success": true,
  "data": {
    "totalEmployees": 14,
    "presentToday": 9,
    "absentToday": 1,
    "lateToday": 3,
    "earlyOut": 1,
    "missingPunch": 1,
    "onLeave": 0,
    "holiday": 0,
    "weeklyAttendance": [
      {
        "date": "Mon",
        "present": 12,
        "absent": 1,
        "late": 1
      }
    ],
    "departmentAttendance": [
      {
        "dept": "Engineering",
        "present": 6,
        "total": 7
      }
    ],
    "recentAttendance": [
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
    ]
  }
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---
