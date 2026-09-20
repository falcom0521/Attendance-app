import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { SUPER_ADMIN_ROLES } from '@/config/permissions';
import { NotFoundPage, UnauthorizedPage } from '@/components/common/ErrorPages';

// Layouts
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { HRLayout } from '@/components/layout/HRLayout';

// Auth
import { LoginPage } from '@/features/auth/pages/LoginPage';

// Super Admin pages
import { SuperAdminDashboard } from '@/features/dashboard/pages/SuperAdminDashboard';
import { CompaniesPage } from '@/features/companies/pages/CompaniesPage';
import { CompanyDetailPage } from '@/features/companies/pages/CompanyDetailPage';
import { SubCompanyDetailPage } from '@/features/sub-companies/pages/SubCompanyDetailPage';
import { SubCompaniesPage } from '@/features/sub-companies/pages/SubCompaniesPage';
import { DevicesPage } from '@/features/devices/pages/DevicesPage';
import { DeviceDetailPage } from '@/features/devices/pages/DeviceDetailPage';
import { ProfilePage } from '@/features/profile/pages/ProfilePage';
// DISABLED (Requests & Leaves): commented out for now, re-enable later.
// import { RequestsPage } from '@/features/requests/pages/RequestsPage';
// import { LeavePage } from '@/features/leaves/pages/LeavePage';
import { ActivityLogsPage } from '@/features/activity-logs/pages/ActivityLogsPage';

// Admin pages
import { AdminDashboard } from '@/features/dashboard/pages/AdminDashboard';

// HR pages
import { HRDashboard } from '@/features/dashboard/pages/HRDashboard';

// Shared pages
import { UsersPage } from '@/features/users/pages/UsersPage';
import { EmployeesPage } from '@/features/employees/pages/EmployeesPage';
import { EmployeeDetailPage } from '@/features/employees/pages/EmployeeDetailPage';
import { AttendancePage } from '@/features/attendance/pages/AttendancePage';
import { AttendanceDetailPage } from '@/features/attendance/pages/AttendanceDetailPage';
import { ReportsPage } from '@/features/reports/pages/ReportsPage';
import { MonthlyAttendancePage } from '@/features/attendance/pages/MonthlyAttendancePage';
import { ConfigurationPage } from '@/features/configuration/pages/ConfigurationPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/unauthorized', element: <UnauthorizedPage /> },
  { path: '/404', element: <NotFoundPage /> },

  // Protected routes
  {
    element: <ProtectedRoute />,
    children: [
      // Root redirect
      { index: true, element: <Navigate to="/login" replace /> },

      // SUPER ADMIN
      {
        element: <RoleRoute allowedRoles={SUPER_ADMIN_ROLES} />,
        children: [
          {
            path: '/super-admin',
            element: <SuperAdminLayout />,
            children: [
              { index: true, element: <Navigate to="/super-admin/dashboard" replace /> },
              { path: 'dashboard', element: <SuperAdminDashboard /> },
              { path: 'companies', element: <CompaniesPage /> },
              { path: 'companies/:companyId', element: <CompanyDetailPage /> },
              { path: 'sub-companies', element: <SubCompaniesPage /> },
              { path: 'sub-companies/:subCompanyId', element: <SubCompanyDetailPage /> },
              { path: 'devices', element: <DevicesPage /> },
              { path: 'devices/:deviceId', element: <DeviceDetailPage /> },
              { path: 'users', element: <UsersPage /> },
              { path: 'activity-logs', element: <ActivityLogsPage /> },
            ],
          },
        ],
      },

      // ADMIN
      {
        element: <RoleRoute allowedRoles={['ADMIN']} />,
        children: [
          {
            path: '/admin',
            element: <AdminLayout />,
            children: [
              { index: true, element: <Navigate to="/admin/dashboard" replace /> },
              { path: 'dashboard', element: <AdminDashboard /> },
              { path: 'profile', element: <ProfilePage /> },
              { path: 'attendance', element: <AttendancePage /> },
              { path: 'attendance/monthly', element: <MonthlyAttendancePage /> },
              { path: 'attendance/:employeeId', element: <AttendanceDetailPage /> },
              // DISABLED (Requests & Leaves): commented out for now, re-enable later.
              // { path: 'requests', element: <RequestsPage /> },
              // { path: 'leaves', element: <LeavePage /> },
              { path: 'employees', element: <EmployeesPage /> },
              { path: 'employees/:employeeId', element: <EmployeeDetailPage /> },
              { path: 'devices', element: <DevicesPage /> },
              { path: 'devices/:deviceId', element: <DeviceDetailPage /> },
              { path: 'reports', element: <ReportsPage /> },
              { path: 'users', element: <UsersPage /> },
              { path: 'configuration', element: <ConfigurationPage /> },
              { path: 'configuration/:section', element: <ConfigurationPage /> },
            ],
          },
        ],
      },

      // HR
      {
        element: <RoleRoute allowedRoles={['HR']} />,
        children: [
          {
            path: '/hr',
            element: <HRLayout />,
            children: [
              { index: true, element: <Navigate to="/hr/dashboard" replace /> },
              { path: 'dashboard', element: <HRDashboard /> },
              { path: 'profile', element: <ProfilePage /> },
              { path: 'attendance', element: <AttendancePage /> },
              { path: 'attendance/monthly', element: <MonthlyAttendancePage /> },
              { path: 'attendance/:employeeId', element: <AttendanceDetailPage /> },
              // DISABLED (Requests & Leaves): commented out for now, re-enable later.
              // { path: 'requests', element: <RequestsPage /> },
              // { path: 'leaves', element: <LeavePage /> },
              { path: 'employees', element: <EmployeesPage /> },
              { path: 'employees/:employeeId', element: <EmployeeDetailPage /> },
              { path: 'reports', element: <ReportsPage /> },
              { path: 'users', element: <UsersPage /> },
              { path: 'configuration', element: <ConfigurationPage /> },
              { path: 'configuration/:section', element: <ConfigurationPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
