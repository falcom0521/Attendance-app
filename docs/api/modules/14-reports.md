# 14. Reports & Exports

Excel / PDF / CSV exports of attendance. Today the UI only simulates these with a timer; this defines the real thing. Small reports finish inside the request; large ones return `202` and are polled.

[← Back to overview](../README.md)

## Endpoints in this module

| # | Method | Path | Purpose | Access |
|---|---|---|---|---|
| 14.1 | `POST` | `/reports/generate` | Generate report | Admin, HR |
| 14.2 | `GET` | `/reports` | Report history | Admin, HR |
| 14.3 | `GET` | `/reports/{reportId}` | Report status | Admin, HR |
| 14.4 | `GET` | `/reports/{reportId}/download` | Download report file | Admin, HR |

---

### 14.1 · Generate report

`POST` `/reports/generate`

**Purpose:** Create an export. Replaces `reportService.generateReport / exportDailyReport / exportMonthlyReport`.

- **Access:** Admin, HR
- **Used by:** ReportsPage (4 tabs), MonthlyAttendancePage export buttons, EmployeeDetailPage → Reports
- **Auth:** `Authorization: Bearer <accessToken>`

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `type` | `DAILY` \| `MONTHLY` \| `EMPLOYEE` \| `MULTI_EMPLOYEE` | **yes** |  |
| `format` | `EXCEL` \| `PDF` \| `CSV` | **yes** |  |
| `date` | date (`YYYY-MM-DD`) | no | DAILY: required. |
| `month` | integer | no | MONTHLY / EMPLOYEE: with `year` (or use a date range for EMPLOYEE). |
| `year` | integer | no |  |
| `startDate` | date (`YYYY-MM-DD`) | no | EMPLOYEE / MULTI_EMPLOYEE alternative to month+year. |
| `endDate` | date (`YYYY-MM-DD`) | no | Range max 92 days. |
| `employeeIds` | string[] | no | EMPLOYEE: exactly 1. MULTI_EMPLOYEE: 2–100. |
| `departmentId` | string | no | Department name. |
| `shiftId` | string | no |  |
| `subCompanyId` | string | no | HR: forced to own. Admin: optional (default all). |

```json
{
  "type": "MONTHLY",
  "format": "EXCEL",
  "month": 9,
  "year": 2026,
  "subCompanyId": "sub-001"
}
```

**Notes**

- File name pattern: `attendance_<type>_report_<yyyyMMdd_HHmmss>.<xlsx|pdf|csv>`.
- Reports are built in the sub-company's timezone and kept for 7 days.

**Response scenarios**

#### ✅ `200 OK` — Completed synchronously

```json
{
  "success": true,
  "message": "Report generated successfully",
  "data": {
    "id": "rpt_01J8Z3K4M5",
    "type": "MONTHLY",
    "format": "EXCEL",
    "status": "COMPLETED",
    "fileName": "attendance_monthly_report_20260920_093000.xlsx",
    "fileSize": 48213,
    "rowCount": 550,
    "downloadUrl": "/api/v1/reports/rpt_01J8Z3K4M5/download",
    "expiresAt": "2026-09-27T09:30:00Z",
    "filters": {
      "type": "MONTHLY",
      "month": 9,
      "year": 2026,
      "subCompanyId": "sub-001",
      "format": "EXCEL"
    },
    "requestedBy": "Divya Menon",
    "requestedAt": "2026-09-20T09:30:00Z",
    "completedAt": "2026-09-20T09:30:02Z",
    "error": null
  }
}
```

#### ✅ `202 Accepted` — Large report — poll `GET /reports/{reportId}`

```json
{
  "success": true,
  "message": "Report is being generated",
  "data": {
    "id": "rpt_01J8Z3K4M5",
    "type": "MONTHLY",
    "format": "EXCEL",
    "status": "PROCESSING",
    "fileName": null,
    "fileSize": null,
    "rowCount": null,
    "downloadUrl": null,
    "expiresAt": null,
    "filters": {
      "type": "MONTHLY",
      "month": 9,
      "year": 2026,
      "subCompanyId": "sub-001",
      "format": "EXCEL"
    },
    "requestedBy": "Divya Menon",
    "requestedAt": "2026-09-20T09:30:00Z",
    "completedAt": null,
    "error": null
  }
}
```

#### ❌ `422 Unprocessable Entity` — Missing required filters for the type

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "errors": [
    {
      "field": "date",
      "message": "Date is required for a daily report"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `422 Unprocessable Entity` — MULTI_EMPLOYEE with fewer than 2 employees

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "errors": [
    {
      "field": "employeeIds",
      "message": "Select at least 2 employees"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `422 Unprocessable Entity` — No data

```json
{
  "success": false,
  "code": "NO_DATA",
  "message": "No attendance data for the selected filters",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `403 Forbidden` — Sub-company / employee out of scope

```json
{
  "success": false,
  "code": "FORBIDDEN",
  "message": "You cannot generate reports for this sub company",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 14.2 · Report history

`GET` `/reports`

**Purpose:** The caller's recent exports (last 7 days) so a download can be repeated.

- **Access:** Admin, HR
- **Used by:** Not in UI yet
- **Auth:** `Authorization: Bearer <accessToken>`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `page` | integer | no | Page number, starting at 1. Default `1`. |
| `pageSize` | integer | no | Rows per page. Default `10`, max `200`. |

**Response scenarios**

#### ✅ `200 OK` — History

```json
{
  "success": true,
  "data": [
    {
      "id": "rpt_01J8Z3K4M5",
      "type": "MONTHLY",
      "format": "EXCEL",
      "status": "COMPLETED",
      "fileName": "attendance_monthly_report_20260920_093000.xlsx",
      "fileSize": 48213,
      "rowCount": 550,
      "downloadUrl": "/api/v1/reports/rpt_01J8Z3K4M5/download",
      "expiresAt": "2026-09-27T09:30:00Z",
      "filters": {
        "type": "MONTHLY",
        "month": 9,
        "year": 2026,
        "subCompanyId": "sub-001",
        "format": "EXCEL"
      },
      "requestedBy": "Divya Menon",
      "requestedAt": "2026-09-20T09:30:00Z",
      "completedAt": "2026-09-20T09:30:02Z",
      "error": null
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

### 14.3 · Report status

`GET` `/reports/{reportId}`

**Purpose:** Poll a `PROCESSING` report until it is `COMPLETED` or `FAILED`.

- **Access:** Admin, HR
- **Used by:** ReportsPage (polling)
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `reportId` | string | Report id. |

**Response scenarios**

#### ✅ `200 OK` — Completed

```json
{
  "success": true,
  "data": {
    "id": "rpt_01J8Z3K4M5",
    "type": "MONTHLY",
    "format": "EXCEL",
    "status": "COMPLETED",
    "fileName": "attendance_monthly_report_20260920_093000.xlsx",
    "fileSize": 48213,
    "rowCount": 550,
    "downloadUrl": "/api/v1/reports/rpt_01J8Z3K4M5/download",
    "expiresAt": "2026-09-27T09:30:00Z",
    "filters": {
      "type": "MONTHLY",
      "month": 9,
      "year": 2026,
      "subCompanyId": "sub-001",
      "format": "EXCEL"
    },
    "requestedBy": "Divya Menon",
    "requestedAt": "2026-09-20T09:30:00Z",
    "completedAt": "2026-09-20T09:30:02Z",
    "error": null
  }
}
```

#### ✅ `200 OK` — Failed

```json
{
  "success": true,
  "data": {
    "id": "rpt_01J8Z3K4M5",
    "type": "MONTHLY",
    "format": "EXCEL",
    "status": "FAILED",
    "fileName": "attendance_monthly_report_20260920_093000.xlsx",
    "fileSize": 48213,
    "rowCount": 550,
    "downloadUrl": null,
    "expiresAt": "2026-09-27T09:30:00Z",
    "filters": {
      "type": "MONTHLY",
      "month": 9,
      "year": 2026,
      "subCompanyId": "sub-001",
      "format": "EXCEL"
    },
    "requestedBy": "Divya Menon",
    "requestedAt": "2026-09-20T09:30:00Z",
    "completedAt": "2026-09-20T09:30:02Z",
    "error": "Report exceeded the 100,000 row limit"
  }
}
```

#### ❌ `404 Not Found` — Not found / belongs to another user

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Report not found",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 14.4 · Download report file

`GET` `/reports/{reportId}/download`

**Purpose:** Stream the generated file. Response is the binary file, not JSON: `Content-Disposition: attachment; filename="…"` and `Content-Type` = `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (EXCEL), `application/pdf` (PDF) or `text/csv` (CSV).

- **Access:** Admin, HR
- **Used by:** ReportsPage (after generation)
- **Auth:** `Authorization: Bearer <accessToken>`

**Path parameters**

| Name | Type | Description |
|---|---|---|
| `reportId` | string | Report id. |

**Response scenarios**

#### ✅ `200 OK` — File stream (binary)

(binary file)

#### ❌ `404 Not Found` — Not found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Report not found",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `409 Conflict` — Still processing

```json
{
  "success": false,
  "code": "REPORT_NOT_READY",
  "message": "Report is still being generated",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `410 Gone` — File expired (older than 7 days)

```json
{
  "success": false,
  "code": "REPORT_EXPIRED",
  "message": "This report has expired. Generate it again.",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---
