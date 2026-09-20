# 12. Device Gateway

Machine-to-machine endpoints called **by the punch devices (or an on-site agent)**, not by the web app. Authenticated with the device's credentials instead of a user JWT. This is how raw punches enter the system; attendance is then calculated from them.

**Authentication:** send both headers on every call.

| Header | Value |
|---|---|
| `X-Device-Serial` | The device's `serialNumber` |
| `X-Device-Key` | Secret API key issued when the device is registered |

**Idempotency:** a punch is uniquely identified by `(device, employeeCode, punchTime)`. Re-sending a batch is safe — duplicates are counted, not stored twice.

[← Back to overview](../README.md)

## Endpoints in this module

| # | Method | Path | Purpose | Access |
|---|---|---|---|---|
| 12.1 | `POST` | `/gateway/punches` | Push punches | Device credentials |
| 12.2 | `POST` | `/gateway/heartbeat` | Device heartbeat | Device credentials |

---

### 12.1 · Push punches

`POST` `/gateway/punches`

**Purpose:** Deliver a batch of punches recorded by a device (offline devices send their backlog when they reconnect). Each accepted punch triggers recalculation of that employee-day.

- **Access:** Device credentials
- **Used by:** Device firmware / on-site agent
- **Auth:** headers `X-Device-Serial` + `X-Device-Key`

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `punches` | object[] | **yes** | 1–500 items. |
| `punches[].employeeCode` | string | **yes** | Employee code enrolled on the device. |
| `punches[].punchTime` | datetime (ISO-8601) | **yes** | ISO-8601. With an offset/`Z` it is converted; without one it is read as local time of the sub-company. |
| `punches[].punchType` | `IN` \| `OUT` | no | If omitted the server alternates IN/OUT per employee per day. |

```json
{
  "punches": [
    {
      "employeeCode": "EMP-1001",
      "punchTime": "2026-09-20T08:55:12+05:30",
      "punchType": "IN"
    },
    {
      "employeeCode": "EMP-1002",
      "punchTime": "2026-09-20T09:42:03+05:30"
    },
    {
      "employeeCode": "EMP-9999",
      "punchTime": "2026-09-20T09:50:00+05:30"
    }
  ]
}
```

**Response scenarios**

#### ✅ `200 OK` — Processed — partial acceptance is normal

```json
{
  "success": true,
  "message": "Punches processed",
  "data": {
    "received": 3,
    "accepted": 2,
    "duplicates": 0,
    "rejected": [
      {
        "index": 2,
        "employeeCode": "EMP-9999",
        "reason": "UNKNOWN_EMPLOYEE"
      }
    ]
  }
}
```

#### ✅ `200 OK` — Re-sent batch — everything already stored

```json
{
  "success": true,
  "message": "Punches processed",
  "data": {
    "received": 3,
    "accepted": 0,
    "duplicates": 3,
    "rejected": []
  }
}
```

#### ❌ `401 Unauthorized` — Missing / wrong device key

```json
{
  "success": false,
  "code": "INVALID_DEVICE_CREDENTIALS",
  "message": "Invalid device serial or key",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `403 Forbidden` — Device is not allocated (or its sub-company is inactive)

```json
{
  "success": false,
  "code": "DEVICE_NOT_ALLOCATED",
  "message": "Device is not allocated to a sub company",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `413 Payload Too Large` — More than 500 punches

```json
{
  "success": false,
  "code": "BATCH_TOO_LARGE",
  "message": "Send at most 500 punches per request",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `422 Unprocessable Entity` — Malformed body

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "errors": [
    {
      "field": "punches.0.punchTime",
      "message": "Invalid date-time"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

---

### 12.2 · Device heartbeat

`POST` `/gateway/heartbeat`

**Purpose:** Sent every 60 s. Updates `lastSeen`, `firmwareVersion` and `ipAddress` and drives ONLINE/OFFLINE (no heartbeat for 5 minutes ⇒ OFFLINE).

- **Access:** Device credentials
- **Used by:** Device firmware / on-site agent
- **Auth:** headers `X-Device-Serial` + `X-Device-Key`

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `firmwareVersion` | string | no |  |
| `ipAddress` | string | no |  |
| `pendingPunches` | integer | no | Punches still queued on the device. |

```json
{
  "firmwareVersion": "3.4.2",
  "ipAddress": "192.168.10.11",
  "pendingPunches": 0
}
```

**Response scenarios**

#### ✅ `200 OK` — Acknowledged

```json
{
  "success": true,
  "data": {
    "serverTime": "2026-09-20T09:45:00Z",
    "status": "ONLINE",
    "pushIntervalSeconds": 60
  }
}
```

#### ❌ `401 Unauthorized` — Bad credentials

```json
{
  "success": false,
  "code": "INVALID_DEVICE_CREDENTIALS",
  "message": "Invalid device serial or key",
  "requestId": "req_8f3c2a91"
}
```

---
