import { useNavigate, useParams } from 'react-router-dom';
import {
  Building2,
  Layers,
  Timer,
  CalendarDays,
  SlidersHorizontal,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { useAuthStore } from '@/store/authStore';
import { ShiftsPage } from '@/features/shifts/pages/ShiftsPage';
import { HolidaysPage } from '@/features/holidays/pages/HolidaysPage';
import { DepartmentsPage } from './DepartmentsPage';
import { BranchProfileCard } from '../components/BranchProfileCard';
import { BrandingCard } from '../components/BrandingCard';
import { AttendanceSettingsCard } from '../components/AttendanceSettingsCard';

export function ConfigurationPage() {
  const { section } = useParams<{ section?: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const role = user?.role ?? 'HR';
  const basePath = role === 'ADMIN' ? '/admin/configuration' : '/hr/configuration';
  const activeTab = section ?? 'company';

  const TABS = [
    { id: 'company',             label: 'Company',             icon: <Building2 className="h-4 w-4" /> },
    { id: 'departments',         label: 'Departments',         icon: <Layers className="h-4 w-4" /> },
    { id: 'shifts',              label: 'Shifts',              icon: <Timer className="h-4 w-4" /> },
    { id: 'holidays',            label: 'Holidays',            icon: <CalendarDays className="h-4 w-4" /> },
    { id: 'attendance-settings', label: 'Attendance Settings', icon: <SlidersHorizontal className="h-4 w-4" /> },
  ];

  function handleTabChange(tab: string) {
    navigate(`${basePath}/${tab}`, { replace: true });
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Configuration"
        subtitle="Manage company settings, departments, shifts and attendance policies"
        breadcrumbs={[
          { label: role === 'ADMIN' ? 'Admin' : 'HR' },
          { label: 'Configuration' },
        ]}
      />

      <Tabs tabs={TABS} activeTab={activeTab} onChange={handleTabChange} className="mb-4" />

      {/* ── Company ─────────────────────────────────────────────── */}
      {activeTab === 'company' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BranchProfileCard />
          <BrandingCard />
        </div>
      )}

      {/* ── Departments ─────────────────────────────────────────── */}
      {activeTab === 'departments' && <DepartmentsPage />}

      {/* ── Shifts ──────────────────────────────────────────────── */}
      {activeTab === 'shifts' && <ShiftsPage />}

      {/* ── Holidays ────────────────────────────────────────────── */}
      {activeTab === 'holidays' && <HolidaysPage />}

      {/* ── Attendance Settings ──────────────────────────────────── */}
      {activeTab === 'attendance-settings' && <AttendanceSettingsCard />}
    </div>
  );
}
