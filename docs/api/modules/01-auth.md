# 1. Authentication & Profile

Sign-in, token refresh, password flows and the signed-in user's own profile. Tokens are JWT bearer tokens: a short-lived **access token** (1 h) sent as `Authorization: Bearer <token>`, and a long-lived **refresh token** (7 d, rotated on every use).

[← Back to overview](../README.md)

## Endpoints in this module

| # | Method | Path | Purpose | Access |
|---|---|---|---|---|
| 1.1 | `POST` | `/auth/login` | Sign in | Public (no auth) |
| 1.2 | `POST` | `/auth/refresh` | Refresh access token | Public (no auth) |
| 1.3 | `POST` | `/auth/logout` | Sign out | Super Admin, Admin, HR |
| 1.4 | `GET` | `/auth/me` | Current user | Super Admin, Admin, HR |
| 1.5 | `POST` | `/auth/forgot-password` | Request password reset | Public (no auth) |
| 1.6 | `POST` | `/auth/reset-password` | Reset password with token | Public (no auth) |
| 1.7 | `POST` | `/auth/change-password` | Change own password | Super Admin, Admin, HR |
| 1.8 | `GET` | `/profile` | Get my profile | Super Admin, Admin, HR |
| 1.9 | `PATCH` | `/profile` | Edit my profile | Super Admin, Admin, HR |

---

### 1.1 · Sign in

`POST` `/auth/login`

**Purpose:** Exchange email + password for tokens and the user profile. Replaces `authService.login`.

- **Access:** Public (no auth)
- **Used by:** LoginPage
- **Auth:** none

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `email` | email | **yes** | Account email. |
| `password` | string | **yes** | Account password. |

```json
{
  "email": "hr@example.com",
  "password": "password123"
}
```

**Notes**

- After **5 failed attempts in 15 minutes** the account/IP is locked for 15 minutes (`429 TOO_MANY_ATTEMPTS`).
- The frontend stores `token` as `auth_token` and `user` as `auth_user` in localStorage.

**Response scenarios**

#### ✅ `200 OK` — Signed in

```json
{
  "success": true,
  "message": "Signed in successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTAwNCIs...",
    "refreshToken": "rt_9d1f0c7e2b4a4f7c8a1e",
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "user": {
      "id": "user-004",
      "email": "hr@example.com",
      "firstName": "Divya",
      "lastName": "Menon",
      "role": "HR",
      "companyId": "company-001",
      "companyName": "Nexus Technologies Pvt Ltd",
      "subCompanyId": "sub-001",
      "subCompanyName": "Nexus Kochi HQ",
      "avatarUrl": null,
      "isActive": true
    }
  }
}
```

#### ❌ `401 Unauthorized` — Wrong email or password

```json
{
  "success": false,
  "code": "INVALID_CREDENTIALS",
  "message": "Invalid email or password",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `403 Forbidden` — User account is deactivated

```json
{
  "success": false,
  "code": "ACCOUNT_INACTIVE",
  "message": "Account is inactive. Contact your administrator.",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `403 Forbidden` — User's company (or sub-company) is deactivated

```json
{
  "success": false,
  "code": "COMPANY_INACTIVE",
  "message": "Your company is inactive. Contact the platform administrator.",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `422 Unprocessable Entity` — Missing / malformed fields

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "errors": [
    {
      "field": "email",
      "message": "Enter a valid email address"
    },
    {
      "field": "password",
      "message": "Password is required"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `429 Too Many Requests` — Too many failed attempts

```json
{
  "success": false,
  "code": "TOO_MANY_ATTEMPTS",
  "message": "Too many failed sign-in attempts. Try again in 15 minutes.",
  "retryAfterSeconds": 900,
  "requestId": "req_8f3c2a91"
}
```

---

### 1.2 · Refresh access token

`POST` `/auth/refresh`

**Purpose:** Get a new access token (and a rotated refresh token) without asking the user to sign in again. Call this from the axios 401 interceptor **before** redirecting to `/login`.

- **Access:** Public (no auth)
- **Used by:** axios interceptor (`src/lib/axios.ts`)
- **Auth:** none

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `refreshToken` | string | **yes** | The refresh token issued at login / last refresh. |

```json
{
  "refreshToken": "rt_9d1f0c7e2b4a4f7c8a1e"
}
```

**Notes**

- Each refresh token is single-use. Re-using an already-rotated token revokes the whole token family (theft protection).

**Response scenarios**

#### ✅ `200 OK` — Tokens rotated

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...new",
    "refreshToken": "rt_b7c3a90d55e14a2f9c30",
    "tokenType": "Bearer",
    "expiresIn": 3600
  }
}
```

#### ❌ `401 Unauthorized` — Refresh token expired

```json
{
  "success": false,
  "code": "TOKEN_EXPIRED",
  "message": "Session expired. Please sign in again.",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `401 Unauthorized` — Refresh token invalid / already used / revoked

```json
{
  "success": false,
  "code": "INVALID_REFRESH_TOKEN",
  "message": "Invalid refresh token",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `422 Unprocessable Entity` — Missing token

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "errors": [
    {
      "field": "refreshToken",
      "message": "Refresh token is required"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

---

### 1.3 · Sign out

`POST` `/auth/logout`

**Purpose:** Revoke the refresh token so the session cannot be resumed. Replaces `authService.logout`.

- **Access:** Super Admin, Admin, HR
- **Used by:** Topbar → Sign Out
- **Auth:** `Authorization: Bearer <accessToken>`

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `refreshToken` | string | no | Refresh token to revoke. If omitted, all of the caller's sessions on this device are revoked. |

```json
{
  "refreshToken": "rt_9d1f0c7e2b4a4f7c8a1e"
}
```

**Notes**

- Always succeeds for an authenticated caller; logging out twice is not an error.

**Response scenarios**

#### ✅ `200 OK` — Signed out

```json
{
  "success": true,
  "message": "Signed out successfully",
  "data": null
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 1.4 · Current user

`GET` `/auth/me`

**Purpose:** Return the signed-in user. Used to validate a stored token on app start. Replaces `authService.getCurrentUser`.

- **Access:** Super Admin, Admin, HR
- **Used by:** App bootstrap (`hydrateFromStorage`)
- **Auth:** `Authorization: Bearer <accessToken>`

**Response scenarios**

#### ✅ `200 OK` — Token valid

```json
{
  "success": true,
  "data": {
    "id": "user-004",
    "email": "hr@example.com",
    "firstName": "Divya",
    "lastName": "Menon",
    "role": "HR",
    "companyId": "company-001",
    "companyName": "Nexus Technologies Pvt Ltd",
    "subCompanyId": "sub-001",
    "subCompanyName": "Nexus Kochi HQ",
    "avatarUrl": null,
    "isActive": true
  }
}
```

#### ❌ `401 Unauthorized` — Token missing / invalid / expired

```json
{
  "success": false,
  "code": "UNAUTHENTICATED",
  "message": "Authentication required",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `403 Forbidden` — Account deactivated since the token was issued

```json
{
  "success": false,
  "code": "ACCOUNT_INACTIVE",
  "message": "Account is inactive. Contact your administrator.",
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 1.5 · Request password reset

`POST` `/auth/forgot-password`

**Purpose:** Email a single-use reset link (valid 30 minutes). Responds identically whether or not the email exists, so accounts cannot be enumerated.

- **Access:** Public (no auth)
- **Used by:** Login page ("Forgot password") — not built yet
- **Auth:** none

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `email` | email | **yes** | Account email. |

```json
{
  "email": "hr@example.com"
}
```

**Response scenarios**

#### ✅ `200 OK` — Always returned (email sent if the account exists)

```json
{
  "success": true,
  "message": "If an account exists for that email, a reset link has been sent",
  "data": null
}
```

#### ❌ `422 Unprocessable Entity` — Malformed email

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "errors": [
    {
      "field": "email",
      "message": "Enter a valid email address"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `429 Too Many Requests` — Rate limited (3 requests / hour / email)

```json
{
  "success": false,
  "code": "RATE_LIMITED",
  "message": "Too many requests. Try again later.",
  "retryAfterSeconds": 3600,
  "requestId": "req_8f3c2a91"
}
```

---

### 1.6 · Reset password with token

`POST` `/auth/reset-password`

**Purpose:** Set a new password using the token from the reset email. Revokes all existing sessions.

- **Access:** Public (no auth)
- **Used by:** Reset-password page — not built yet
- **Auth:** none

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `token` | string | **yes** | Token from the email link. |
| `newPassword` | string | **yes** | Min 8 characters. |
| `confirmPassword` | string | **yes** | Must equal `newPassword`. |

```json
{
  "token": "rst_4b8c1e77a9f24d0f",
  "newPassword": "N3w-Passw0rd!",
  "confirmPassword": "N3w-Passw0rd!"
}
```

**Response scenarios**

#### ✅ `200 OK` — Password updated

```json
{
  "success": true,
  "message": "Password has been reset. Please sign in.",
  "data": null
}
```

#### ❌ `400 Bad Request` — Token invalid, expired or already used

```json
{
  "success": false,
  "code": "INVALID_RESET_TOKEN",
  "message": "This reset link is invalid or has expired",
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `422 Unprocessable Entity` — Weak / mismatched password

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "errors": [
    {
      "field": "newPassword",
      "message": "Use at least 8 characters"
    },
    {
      "field": "confirmPassword",
      "message": "Passwords do not match"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

---

### 1.7 · Change own password

`POST` `/auth/change-password`

**Purpose:** Signed-in user changes their password. Backs the "Change Password" card on My Profile.

- **Access:** Super Admin, Admin, HR
- **Used by:** ProfilePage → Change Password
- **Auth:** `Authorization: Bearer <accessToken>`

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `currentPassword` | string | **yes** | Existing password. |
| `newPassword` | string | **yes** | Min 8 characters, different from the current one. |
| `confirmPassword` | string | **yes** | Must equal `newPassword`. |

```json
{
  "currentPassword": "password123",
  "newPassword": "N3w-Passw0rd!",
  "confirmPassword": "N3w-Passw0rd!"
}
```

**Notes**

- A wrong current password is returned as **422**, not 401 — the frontend interceptor treats every 401 as "session expired" and would log the user out.
- Other sessions of the user are revoked; the current session keeps working.

**Response scenarios**

#### ✅ `200 OK` — Password changed

```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": null
}
```

#### ❌ `422 Unprocessable Entity` — Current password is wrong

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "errors": [
    {
      "field": "currentPassword",
      "message": "Current password is incorrect"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `422 Unprocessable Entity` — New password same as current / too short / mismatched

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "errors": [
    {
      "field": "newPassword",
      "message": "New password must be different from the current one"
    },
    {
      "field": "confirmPassword",
      "message": "Passwords do not match"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 1.8 · Get my profile

`GET` `/profile`

**Purpose:** Full account record of the signed-in user (phone, username, last login, created date) shown on My Profile.

- **Access:** Super Admin, Admin, HR
- **Used by:** ProfilePage
- **Auth:** `Authorization: Bearer <accessToken>`

**Response scenarios**

#### ✅ `200 OK` — Profile

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

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---

### 1.9 · Edit my profile

`PATCH` `/profile`

**Purpose:** Update the caller's own name and phone. Email, username, role and company are read-only here (managed by an administrator via `PUT /users/{userId}`).

- **Access:** Super Admin, Admin, HR
- **Used by:** ProfilePage → Edit Profile
- **Auth:** `Authorization: Bearer <accessToken>`

**Request body** (`application/json`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `firstName` | string | **yes** | 1–50 chars. |
| `lastName` | string | **yes** | 1–50 chars. |
| `phone` | string | **yes** | Min 7 characters. |

```json
{
  "firstName": "Divya",
  "lastName": "Menon",
  "phone": "+91-9000000001"
}
```

**Notes**

- Any other field in the body is rejected with 422 (`field is not editable`).

**Response scenarios**

#### ✅ `200 OK` — Profile updated

```json
{
  "success": true,
  "message": "Profile updated",
  "data": {
    "id": "user-004",
    "firstName": "Divya",
    "lastName": "Menon",
    "fullName": "Divya Menon",
    "email": "hr@example.com",
    "phone": "+91-9000000001",
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
      "field": "firstName",
      "message": "First name is required"
    },
    {
      "field": "phone",
      "message": "Enter a valid phone number"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

#### ❌ `422 Unprocessable Entity` — Tried to change a read-only field

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "errors": [
    {
      "field": "role",
      "message": "This field cannot be changed here"
    }
  ],
  "requestId": "req_8f3c2a91"
}
```

_Also possible on every authenticated call:_ `401 UNAUTHENTICATED` / `TOKEN_EXPIRED`, `403 FORBIDDEN`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` — see [Common errors](../README.md#common-errors).

---
