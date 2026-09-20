# 17. System

Operational endpoints.

[← Back to overview](../README.md)

## Endpoints in this module

| # | Method | Path | Purpose | Access |
|---|---|---|---|---|
| 17.1 | `GET` | `/health` | Health check | Public (no auth) |

---

### 17.1 · Health check

`GET` `/health`

**Purpose:** Liveness/readiness probe for load balancers and monitoring. No authentication, no envelope.

- **Access:** Public (no auth)
- **Used by:** Infrastructure
- **Auth:** none

**Response scenarios**

#### ✅ `200 OK` — Healthy

```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptimeSeconds": 86412,
  "checks": {
    "database": "ok",
    "cache": "ok",
    "queue": "ok"
  },
  "time": "2026-09-20T09:30:00Z"
}
```

#### ❌ `503 Service Unavailable` — A dependency is down

```json
{
  "status": "degraded",
  "version": "1.0.0",
  "uptimeSeconds": 86412,
  "checks": {
    "database": "ok",
    "cache": "down",
    "queue": "ok"
  },
  "time": "2026-09-20T09:30:00Z"
}
```

---
