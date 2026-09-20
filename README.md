# AttendanceIQ

A production-quality **Punch-In / Punch-Out Attendance Management** web application built as a frontend SaaS product using **React + Vite + TypeScript**.

---

## Overview

AttendanceIQ manages employee attendance from physical biometric punch devices. The frontend provides a complete multi-tenant dashboard for Super Admins, Company Admins, and HR users to monitor and manage workforce attendance in real-time.

**This is Phase 1 — Frontend only with a full mock service layer. Phase 2 will connect to a real REST API backend.**

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| React 18 | UI framework |
| Vite 5 | Build tool |
| TypeScript 5 (strict) | Type safety |
| React Router 6 | Client-side routing |
| TanStack Query 5 | Server-state management |
| Axios | HTTP client (prepared for Phase 2) |
| React Hook Form | Form state |
| Zod | Schema validation |
| Tailwind CSS 3 | Styling |
| Lucide React | Icons |
| Recharts | Charts |
| date-fns | Date utilities |
| Zustand | Global auth + UI state |
| ESLint + Prettier | Code quality |

---

## Dark Mode

A sun / moon button in the top bar (and on the login page) switches between light and dark mode.

- The first visit follows your operating-system setting; once you choose a theme it is remembered (`localStorage`, key `attendanceiq-theme`)
- The theme is applied before the app renders, so there is no flash of the wrong theme
- Colours are CSS variables (`src/styles/globals.css`) consumed by the Tailwind palette, so components need no `dark:` classes. Use the existing tokens (`bg-card`, `bg-surface-*`, `text-surface-*`, `brand-*`, `success-*`…) and both themes work automatically
- Use `bg-card` (not `bg-white`) for panels and dropdowns. For a surface that must stay dark in both themes use an untokenised colour such as `bg-slate-900` or `bg-[#020617]`
- Charts read their neutral colours from `useChartTheme()` (`src/components/charts/useChartTheme.ts`)

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
git clone <repo-url>
cd attendance-app
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@example.com | password123 |
| Super Admin (Read-only) | viewer@example.com | password123 |
| Admin | admin@example.com | password123 |
| HR | hr@example.com | password123 |

**Demo accounts are pre-filled on the login page.** Just click an account card and sign in.

---

## Environment Variables

Copy `.env` and configure:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_APP_NAME=AttendanceIQ
VITE_APP_VERSION=1.0.0
VITE_USE_MOCK=true
```

Set `VITE_USE_MOCK=false` in Phase 2 to switch to real APIs.

---

## Folder Structure

```
src/
├── app/
│   ├── App.tsx                   # Root component
│   ├── providers/                # React Query, Toast providers
│   └── router/                   # Routes, ProtectedRoute, RoleRoute
│
├── components/
│   ├── ui/                       # Reusable primitives (Button, Input, etc.)
│   ├── common/                   # PageHeader, ErrorPages
│   ├── layout/                   # Sidebar, Topbar, AppLayout, role layouts
│   ├── charts/                   # Recharts wrappers
│   ├── tables/                   # DataTable with sort/pagination
│   └── feedback/                 # EmptyState, ErrorState, Toast
│
├── config/
│   ├── permissions.ts            # Role-based permissions map
│   └── navigation.ts             # Per-role nav items
│
├── features/                     # Feature modules (self-contained)
│   ├── auth/                     # Login, auth service, hooks
│   ├── dashboard/                # Super Admin / Admin / HR dashboards
│   ├── companies/                # Company CRUD
│   ├── sub-companies/            # Sub company CRUD
│   ├── devices/                  # Device management + allocation
│   ├── users/                    # Admin/HR user management
│   ├── employees/                # Employee CRUD + detail page
│   ├── shifts/                   # Shift configuration
│   ├── holidays/                 # Holiday calendar
│   ├── attendance/               # Daily + monthly attendance + detail
│   ├── reports/                  # Daily/monthly/employee/multi reports
│   ├── configuration/            # Company settings + sub-modules
│   └── activity-logs/            # Audit trail (Super Admin)
│
├── mocks/
│   └── data/                     # Realistic mock datasets
│
├── services/
│   └── mock/                     # Mock service implementations
│
├── store/
│   ├── authStore.ts              # Auth state (Zustand)
│   └── uiStore.ts                # Sidebar + UI state (Zustand)
│
├── types/                        # Shared TypeScript interfaces
├── utils/                        # Date, formatters, attendance calc
├── lib/                          # axios instance, queryClient, utils
└── styles/
    └── globals.css               # Tailwind base + design tokens
```

---

## Architecture

### Data Flow

```
Page Component
    ↓
TanStack Query Hook (useEmployees, useAttendance, etc.)
    ↓
Service Layer (employeeService, attendanceService, etc.)
    ↓
Mock API (returns typed data after simulated delay)
    ↓ ← Phase 2: swap this layer for Axios API calls
Real REST API
```

Page components never import from `mocks/` or call `axios` directly. They only consume hooks.

### Replacing Mock with Real API (Phase 2)

For each feature, open `src/services/mock/<feature>.service.ts` and replace the mock logic with `apiClient` calls:

```typescript
// Before (mock)
async getEmployees(params) {
  await sleep(400);
  return mockEmployees.filter(...);
}

// After (real API)
async getEmployees(params) {
  const response = await apiClient.get('/employees', { params });
  return response.data;
}
```

**Page components and hooks require zero changes.** Only the service layer changes.

---

## Role System

Four roles with strictly enforced permissions:

### SUPER_ADMIN
- Platform-wide access
- Manage companies, sub companies, devices, allocations
- Create Admin and HR users
- View audit logs
- Device lifecycle: add, edit, allocate, **re-allocate, deallocate**, allocation history and per-device punch log

### SUPER_ADMIN_VIEWER ("Super Admin (Read-only)")
- Sees everything a Super Admin sees (dashboard, companies, sub companies, devices, users, activity logs) but **cannot change anything** — no create, edit, deactivate, allocate or delete
- Created only by a Super Admin from **Users → Add User → Role: Super Admin (Read-only)**; platform-level, so it has no company or sub company
- No My Profile page: Super Admin roles do not get edit profile or change password in the UI
- Demo account: `viewer@example.com` / `password123`

### ADMIN
- Scoped to one company. Companies own no employees — **sub-companies do** — so Admin works across *all* of the company's sub-companies and can narrow to one with the topbar sub-company selector
- Full HR functionality across every sub-company: employees, shifts, holidays, attendance (including manual entries), reports
- Forms that create data ask which sub-company it belongs to (pre-selected when one is chosen in the topbar)
- Approves or rejects HR's attendance-correction and leave requests; requests Admin raises are auto-approved
- Create and manage HR users
- Read-only view of the company's punch devices, with detail page and punch log

### HR
- Scoped to one sub-company
- Manage employees, shifts, holidays, attendance
- Raise regularization, missing-punch and leave requests (Admin approves)
- Generate and export reports
- Configure sub-company settings

Permissions are centralized in `src/config/permissions.ts`. Route guards use `RoleRoute`. Never use `if (role === 'ADMIN')` directly in components — use `hasPermission()`.

---

## Attendance Engine (mock layer)

Attendance is derived, not stored: `services/mock/attendanceEngine.ts` computes status, late, early-out and **overtime** from raw punches using the company's attendance settings (Configuration → Attendance Settings) and the shift.

- Device punches are generated deterministically for every employee for the last 60 days (`attendanceHistory.ts`)
- **Manual entries** are merged *with* the day's device punches (never replace them) and can be edited or deleted from the attendance detail page
- **Requests** (`request.service.ts`): Regularization, Missing punch, Leave. HR raises → Admin approves → the approved request is applied as a manual entry / `ON_LEAVE` days. Leave balances: 12 casual, 10 sick, 15 earned per year
- Changing attendance settings or shift timings recomputes history

## Mock Data

Realistic data is seeded in `src/mocks/data/`:

- 5 companies (Nexus Technologies, Vertex Solutions, Orbis Global, Pinnacle, Stratos)
- 12 sub companies across those companies
- 12+ devices with ONLINE / OFFLINE / UNALLOCATED / MAINTENANCE statuses
- 25+ employees across Kochi, Bangalore, Chennai branches
- 7 shifts including overnight shifts
- 20+ public holidays
- 7 users (1 Super Admin, 2 Admins, 4 HR users)
- Today's attendance covering all statuses: PRESENT, ABSENT, LATE, EARLY_OUT, INCOMPLETE
- 30 days of historical attendance for emp-001

All mock data is relational — employees reference their company, attendance references employees and shifts.

---

## Adding a New Feature

1. Create `src/features/<feature>/` with subfolders: `api/`, `components/`, `hooks/`, `pages/`, `services/`, `types/`
2. Define types in `types/<feature>.ts`
3. Write the service in `services/mock/<feature>.service.ts`
4. Create TanStack Query hooks in `features/<feature>/hooks/`
5. Build page components in `features/<feature>/pages/`
6. Add routes in `src/app/router/index.tsx`
7. Add nav item in `src/config/navigation.ts` if needed

---

## Commands

```bash
npm run dev        # Start dev server (http://localhost:5173)
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # Run ESLint
npm run format     # Run Prettier
```

---

## Notes

- Authentication is mock-only. JWTs are stored in localStorage with a fake token format.
- All CRUD operations mutate the in-memory mock store. Data resets on page refresh.
- Export buttons simulate file generation with a 1.2s delay and toast notification.
- The chunk size warning in the build output is expected — lucide-react and recharts are large. Add dynamic imports in Phase 2.
