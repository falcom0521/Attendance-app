import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/feedback/ToastContext';
import { useCreateShift, useUpdateShift } from '../hooks/useShifts';
import { useAuthStore } from '@/store/authStore';
import { useSubCompanyScope } from '@/hooks/useSubCompanyScope';
import { useAttendanceSettings } from '@/features/configuration/hooks/useAttendanceSettings';
import type { Shift } from '@/types/shift';
import { requiredText, timeField, optionalTimeField, intInRange, optionalIntInRange } from '@/lib/validation';

const schema = z
  .object({
    name: requiredText('Shift name', { min: 2, max: 60 }),
    startTime: timeField('Start time'),
    endTime: timeField('End time'),
    breakStartTime: optionalTimeField('Break start'),
    breakEndTime: optionalTimeField('Break end'),
    gracePeriodMinutes: intInRange('Grace period', 0, 60),
    minimumWorkingHours: optionalIntInRange('Minimum working hours', 1, 24),
    status: z.enum(['ACTIVE', 'INACTIVE']),
    subCompanyId: z.string().min(1, 'Select a sub company'),
  })
  .superRefine((v, ctx) => {
    if (v.startTime && v.endTime && v.startTime === v.endTime) {
      ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'End time must be different from start time' });
    }
    const hasStart = !!v.breakStartTime;
    const hasEnd = !!v.breakEndTime;
    if (hasStart !== hasEnd) {
      ctx.addIssue({
        code: 'custom',
        path: [hasStart ? 'breakEndTime' : 'breakStartTime'],
        message: 'Enter both break start and break end, or leave both empty',
      });
    } else if (hasStart && v.breakEndTime! <= v.breakStartTime!) {
      ctx.addIssue({ code: 'custom', path: ['breakEndTime'], message: 'Break end must be after break start' });
    }
  });

type FormData = z.infer<typeof schema>;

export function ShiftFormDialog({ open, onClose, shift }: { open: boolean; onClose: () => void; shift?: Shift | null }) {
  const toast = useToast();
  const { user } = useAuthStore();
  const create = useCreateShift();
  const update = useUpdateShift();
  const scope = useSubCompanyScope();
  const { data: settings } = useAttendanceSettings(user?.companyId);
  const isEdit = !!shift;
  const defaultGrace = settings?.lateGracePeriodMinutes ?? 15;

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { status: 'ACTIVE', gracePeriodMinutes: defaultGrace, subCompanyId: scope.subCompanyId ?? '' },
  });

  useEffect(() => {
    if (!open) return;
    if (shift) reset({ ...shift, breakStartTime: shift.breakStartTime ?? '', breakEndTime: shift.breakEndTime ?? '' });
    else reset({ status: 'ACTIVE', gracePeriodMinutes: defaultGrace, subCompanyId: scope.subCompanyId ?? '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shift, open, reset]);

  const subOptions = [{ label: 'Select sub company', value: '' }, ...scope.subCompanies.map((sc) => ({ label: sc.name, value: sc.id }))];

  async function onSubmit(data: FormData) {
    try {
      const payload = { ...data };
      if (isEdit && shift) {
        await update.mutateAsync({ id: shift.id, payload });
        toast.success('Shift updated', data.name);
      } else {
        await create.mutateAsync(payload);
        toast.success('Shift created', data.name);
      }
      onClose();
    } catch { toast.error('Failed'); }
  }

  return (
    <Dialog open={open} onClose={onClose} title={isEdit ? 'Edit Shift' : 'Add Shift'} size="md"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button form="shift-form" type="submit" loading={isSubmitting}>{isEdit ? 'Save' : 'Create'}</Button></>}
    >
      <form noValidate id="shift-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {scope.isAdmin && (isEdit ? (
          <Input label="Sub Company" value={scope.subCompanies.find((sc) => sc.id === shift?.subCompanyId)?.name ?? ''} readOnly />
        ) : (
          <Select label="Sub Company" required options={subOptions} error={errors.subCompanyId?.message} {...register('subCompanyId')} />
        ))}
        <Input label="Shift Name" required error={errors.name?.message} {...register('name')} placeholder="General Shift" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Start Time" type="time" required error={errors.startTime?.message} {...register('startTime')} />
          <Input label="End Time" type="time" required error={errors.endTime?.message} {...register('endTime')} />
          <Input label="Break Start" type="time" error={errors.breakStartTime?.message} {...register('breakStartTime')} />
          <Input label="Break End" type="time" error={errors.breakEndTime?.message} {...register('breakEndTime')} />
        </div>
        <Input label="Grace Period (minutes)" type="number" error={errors.gracePeriodMinutes?.message} {...register('gracePeriodMinutes', { valueAsNumber: true })} />
        <Input
          label="Minimum Working Hours"
          type="number"
          inputMode="numeric"
          min={1}
          max={24}
          step={1}
          placeholder="e.g. 8"
          error={errors.minimumWorkingHours?.message}
          hint={
            settings?.minimumWorkingHoursEnabled
              ? 'Optional. Employee is Present once they complete these hours that day, regardless of arrival/departure time.'
              : 'Optional. Takes effect only once Flexible Timing is enabled in Attendance Settings.'
          }
          {...register('minimumWorkingHours', { valueAsNumber: true })}
        />
        <Select label="Status" required options={[{ label: 'Active', value: 'ACTIVE' }, { label: 'Inactive', value: 'INACTIVE' }]} error={errors.status?.message} {...register('status')} />
      </form>
    </Dialog>
  );
}
