import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Info } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { WeekdayPicker } from '@/components/ui/WeekdayPicker';
import { DEFAULT_WORKING_DAYS } from '@/lib/weekdays';
import { useToast } from '@/components/feedback/ToastContext';
import { useSubCompanyScope } from '@/hooks/useSubCompanyScope';
import { useSubCompany, useUpdateSubCompany } from '@/features/companies/hooks/useCompanies';
import { emailField, phoneField, requiredText, timezoneField } from '@/lib/validation';

const schema = z.object({
  email: emailField,
  phone: phoneField,
  address: requiredText('Address', { min: 5, max: 200 }),
  timezone: timezoneField,
  workingDays: z.array(z.string()).min(1, 'Select at least one working day'),
});
type FormData = z.infer<typeof schema>;

const TIMEZONES = (() => {
  const supported = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
  return supported?.('timeZone') ?? ['Asia/Kolkata', 'UTC', 'America/New_York', 'Europe/London'];
})();

/** Contact details, timezone and working days of the branch (sub company) the user is working in. */
export function BranchProfileCard() {
  const toast = useToast();
  const scope = useSubCompanyScope();
  const { data: sub, isLoading } = useSubCompany(scope.subCompanyId ?? '');
  const update = useUpdateSubCompany();

  const {
    register, handleSubmit, reset, watch, setValue,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { email: '', phone: '', address: '', timezone: 'Asia/Kolkata', workingDays: DEFAULT_WORKING_DAYS },
  });
  const workingDays = watch('workingDays') ?? [];

  useEffect(() => {
    if (sub) {
      reset({
        email: sub.email,
        phone: sub.phone,
        address: sub.address,
        timezone: sub.timezone,
        workingDays: sub.workingDays?.length ? sub.workingDays : DEFAULT_WORKING_DAYS,
      });
    }
  }, [sub, reset]);

  async function onSubmit(data: FormData) {
    if (!sub) return;
    try {
      await update.mutateAsync({ id: sub.id, payload: data });
      reset(data);
      toast.success('Branch settings saved', sub.name);
    } catch (err) {
      toast.error('Could not save settings', err instanceof Error ? err.message : undefined);
    }
  }

  // An Admin working across all sub companies has to pick one first.
  if (!scope.subCompanyId) {
    return (
      <Card>
        <CardHeader title="Company Information" />
        <CardBody>
          <div className="flex gap-2.5 rounded-xl border border-info-100 bg-info-50 p-3.5">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-info-500" />
            <p className="text-sm text-info-700">
              Select a sub company from the selector in the top bar to view and edit its contact details, timezone and working days.
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Company Information" subtitle="Contact details, timezone and working days for this branch" />
      <CardBody>
        {isLoading || !sub ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : (
          <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Company Name" value={sub.companyName} readOnly hint="Managed by your platform administrator" />
            <Input label="Sub Company Name" value={sub.name} readOnly hint="Managed by your platform administrator" />
            <Input label="Email" type="email" required maxLength={120} error={errors.email?.message} {...register('email')} />
            <Input label="Phone" type="tel" required maxLength={25} error={errors.phone?.message} {...register('phone')} />
            <Input label="Address" required maxLength={200} error={errors.address?.message} {...register('address')} />
            <div>
              <Input
                label="Timezone"
                required
                list="branch-timezones"
                maxLength={60}
                placeholder="e.g. Asia/Kolkata"
                error={errors.timezone?.message}
                {...register('timezone')}
              />
              <datalist id="branch-timezones">
                {TIMEZONES.map((tz) => <option key={tz} value={tz} />)}
              </datalist>
            </div>
            <WeekdayPicker
              required
              value={workingDays}
              onChange={(days) => setValue('workingDays', days, { shouldValidate: true, shouldDirty: true })}
              error={errors.workingDays?.message}
            />
            <div className="flex items-center gap-3 pt-1">
              <Button type="submit" loading={update.isPending} disabled={!isDirty}>Save Changes</Button>
              {isDirty && <Button type="button" variant="ghost" onClick={() => reset()}>Discard</Button>}
            </div>
          </form>
        )}
      </CardBody>
    </Card>
  );
}
