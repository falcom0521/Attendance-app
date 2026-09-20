import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Building2,
  Layers,
  Timer,
  CalendarDays,
  SlidersHorizontal,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Tabs } from '@/components/ui/Tabs';
import { Switch } from '@/components/ui/Switch';
import { useToast } from '@/components/feedback/ToastContext';
import { useAuthStore } from '@/store/authStore';
import { ShiftsPage } from '@/features/shifts/pages/ShiftsPage';
import { HolidaysPage } from '@/features/holidays/pages/HolidaysPage';
import { DepartmentsPage } from './DepartmentsPage';
import { useAttendanceSettings, useUpdateAttendanceSettings } from '../hooks/useAttendanceSettings';
import { DEFAULT_ATTENDANCE_SETTINGS } from '@/services/mock/settings.service';
import type { AttendanceSettings } from '@/types/settings';

const TIMEZONE_OPTIONS = [
  { label: 'Asia/Kolkata (IST)', value: 'Asia/Kolkata' },
  { label: 'UTC', value: 'UTC' },
  { label: 'America/New_York (EST)', value: 'America/New_York' },
];

const WORKING_DAYS_OPTIONS = [
  { label: 'Mon – Fri (5 days)', value: '5' },
  { label: 'Mon – Sat (6 days)', value: '6' },
];

function AttendanceSettingsCard() {
  const toast = useToast();
  const { user } = useAuthStore();
  const { data, isLoading } = useAttendanceSettings(user?.companyId);
  const update = useUpdateAttendanceSettings(user?.companyId);
  const [form, setForm] = useState<AttendanceSettings>(DEFAULT_ATTENDANCE_SETTINGS);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const set = <K extends keyof AttendanceSettings>(key: K, value: AttendanceSettings[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const num = (v: string) => Math.max(0, Number(v) || 0);

  async function handleSave() {
    try {
      await update.mutateAsync(form);
      toast.success('Attendance settings saved', 'Late, early-out and overtime are recalculated');
    } catch {
      toast.error('Failed to save settings');
    }
  }

  return (
    <Card>
      <CardHeader
        title="Attendance Policy Settings"
        subtitle="Applies to every sub company under this company"
      />
      <CardBody className="space-y-6 max-w-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Late Grace Period (minutes)"
            type="number"
            min={0}
            value={form.lateGracePeriodMinutes}
            onChange={(e) => set('lateGracePeriodMinutes', num(e.target.value))}
            disabled={isLoading}
            hint="Default grace for new shifts; each shift keeps its own"
          />
          <Input
            label="Early Out Threshold (minutes)"
            type="number"
            min={0}
            value={form.earlyOutThresholdMinutes}
            onChange={(e) => set('earlyOutThresholdMinutes', num(e.target.value))}
            disabled={isLoading}
            hint="Buffer before shift end"
          />
          <Input
            label="Minimum Working Hours (HH:MM)"
            value={form.minimumWorkingHours}
            onChange={(e) => set('minimumWorkingHours', e.target.value)}
            disabled={isLoading}
            hint="Minimum hours for PRESENT status"
          />
          <Input
            label="Overtime Threshold (minutes)"
            type="number"
            min={0}
            value={form.overtimeThresholdMinutes}
            onChange={(e) => set('overtimeThresholdMinutes', num(e.target.value))}
            disabled={isLoading || !form.overtimeEnabled}
            hint="Minutes after shift end before overtime counts"
          />
        </div>
        <div className="space-y-4 pt-2 border-t border-surface-100">
          <Switch
            checked={form.overtimeEnabled}
            onChange={(v) => set('overtimeEnabled', v)}
            label="Enable Overtime Tracking"
          />
          <Switch
            checked={form.autoAbsent}
            onChange={(v) => set('autoAbsent', v)}
            label="Auto-mark absent after midnight"
          />
        </div>
        <Button onClick={handleSave} loading={update.isPending} disabled={isLoading}>
          Save Attendance Settings
        </Button>
      </CardBody>
    </Card>
  );
}

export function ConfigurationPage() {
  const { section } = useParams<{ section?: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuthStore();
  const [saving, setSaving] = useState(false);

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

  async function handleSaveCompany() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    toast.success('Company settings saved');
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
          <Card>
            <CardHeader title="Company Information" />
            <CardBody className="space-y-4">
              <Input label="Company Name" defaultValue={user?.companyName ?? ''} readOnly />
              {role !== 'ADMIN' && <Input label="Sub Company Name" defaultValue={user?.subCompanyName ?? ''} />}
              <Input label="Email" type="email" defaultValue="kochi@nexustech.in" />
              <Input label="Phone" defaultValue="+91-484-2345679" />
              <Input label="Address" defaultValue="3rd Floor, Carnival Infopark" />
              <Select label="Timezone" options={TIMEZONE_OPTIONS} defaultValue="Asia/Kolkata" />
              <Select label="Working Days" options={WORKING_DAYS_OPTIONS} defaultValue="5" />
              <Button onClick={handleSaveCompany} loading={saving}>
                Save Changes
              </Button>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Branding" subtitle="Upload company logo" />
            <CardBody>
              <div className="border-2 border-dashed border-surface-200 rounded-xl p-8 text-center">
                <div className="h-16 w-16 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <p className="text-sm font-medium text-surface-700">Company Logo</p>
                <p className="text-xs text-surface-400 mt-1">PNG, JPG up to 2 MB</p>
                <Button variant="outline" size="sm" className="mt-3">
                  Upload Logo
                </Button>
              </div>
            </CardBody>
          </Card>
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
