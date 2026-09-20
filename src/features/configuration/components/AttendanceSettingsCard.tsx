import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { useToast } from '@/components/feedback/ToastContext';
import { useAuthStore } from '@/store/authStore';
import { useAttendanceSettings, useUpdateAttendanceSettings } from '../hooks/useAttendanceSettings';
import { DEFAULT_ATTENDANCE_SETTINGS } from '@/services/mock/settings.service';
import { intInRange, timeField } from '@/lib/validation';

const schema = z.object({
  lateGracePeriodMinutes: intInRange('Late grace period', 0, 120),
  earlyOutThresholdMinutes: intInRange('Early-out threshold', 0, 120),
  minimumWorkingHours: timeField('Minimum working hours'),
  overtimeThresholdMinutes: intInRange('Overtime threshold', 0, 240),
  overtimeEnabled: z.boolean(),
  autoAbsent: z.boolean(),
});
type FormData = z.infer<typeof schema>;

export function AttendanceSettingsCard() {
  const toast = useToast();
  const { user } = useAuthStore();
  const { data, isLoading } = useAttendanceSettings(user?.companyId);
  const update = useUpdateAttendanceSettings(user?.companyId);

  const {
    register, handleSubmit, reset, watch, setValue,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: DEFAULT_ATTENDANCE_SETTINGS,
  });
  const overtimeEnabled = watch('overtimeEnabled');
  const autoAbsent = watch('autoAbsent');

  useEffect(() => {
    if (data) reset(data);
  }, [data, reset]);

  async function onSubmit(values: FormData) {
    try {
      await update.mutateAsync(values);
      reset(values);
      toast.success('Attendance settings saved', 'Late, early-out and overtime are recalculated');
    } catch {
      toast.error('Failed to save settings');
    }
  }

  return (
    <Card>
      <CardHeader title="Attendance Policy Settings" subtitle="Applies to every sub company under this company" />
      <CardBody>
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Late Grace Period (minutes)"
              type="number"
              inputMode="numeric"
              min={0}
              max={120}
              step={1}
              required
              readOnly={isLoading}
              hint="Default grace for new shifts; each shift keeps its own"
              error={errors.lateGracePeriodMinutes?.message}
              {...register('lateGracePeriodMinutes', { valueAsNumber: true })}
            />
            <Input
              label="Early Out Threshold (minutes)"
              type="number"
              inputMode="numeric"
              min={0}
              max={120}
              step={1}
              required
              readOnly={isLoading}
              hint="Buffer before shift end"
              error={errors.earlyOutThresholdMinutes?.message}
              {...register('earlyOutThresholdMinutes', { valueAsNumber: true })}
            />
            <Input
              label="Minimum Working Hours (HH:MM)"
              type="time"
              required
              readOnly={isLoading}
              hint="Minimum hours for PRESENT status"
              error={errors.minimumWorkingHours?.message}
              {...register('minimumWorkingHours')}
            />
            <Input
              label="Overtime Threshold (minutes)"
              type="number"
              inputMode="numeric"
              min={0}
              max={240}
              step={1}
              required
              // readOnly (not disabled): a disabled field is dropped from the form values and would fail validation.
              readOnly={isLoading || !overtimeEnabled}
              className={!overtimeEnabled ? 'bg-surface-50 text-surface-400' : undefined}
              hint="Minutes after shift end before overtime counts"
              error={errors.overtimeThresholdMinutes?.message}
              {...register('overtimeThresholdMinutes', { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-4 pt-2 border-t border-surface-100">
            <Switch checked={overtimeEnabled} onChange={(v) => setValue('overtimeEnabled', v, { shouldDirty: true })} label="Enable Overtime Tracking" />
            <Switch checked={autoAbsent} onChange={(v) => setValue('autoAbsent', v, { shouldDirty: true })} label="Auto-mark absent after midnight" />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" loading={update.isPending} disabled={isLoading || !isDirty}>Save Attendance Settings</Button>
            {isDirty && <Button type="button" variant="ghost" onClick={() => reset()}>Discard</Button>}
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
