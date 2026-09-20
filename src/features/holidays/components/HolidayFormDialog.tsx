import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/feedback/ToastContext';
import { useCreateHoliday, useUpdateHoliday } from '../hooks/useHolidays';
import { useSubCompanyScope } from '@/hooks/useSubCompanyScope';
import type { Holiday } from '@/types/holiday';
import { requiredText, optionalText, dateField } from '@/lib/validation';

const schema = z.object({
  name: requiredText('Holiday name', { min: 2, max: 100 }),
  date: dateField('Date'),
  description: optionalText('Description', 200),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  subCompanyId: z.string().min(1, 'Select a sub company'),
});

type FormData = z.infer<typeof schema>;

export function HolidayFormDialog({ open, onClose, holiday }: { open: boolean; onClose: () => void; holiday?: Holiday | null }) {
  const toast = useToast();
  const scope = useSubCompanyScope();
  const create = useCreateHoliday();
  const update = useUpdateHoliday();
  const isEdit = !!holiday;

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { status: 'ACTIVE', subCompanyId: scope.subCompanyId ?? '' },
  });

  useEffect(() => {
    if (!open) return;
    if (holiday) reset({ name: holiday.name, date: holiday.date, description: holiday.description ?? '', status: holiday.status, subCompanyId: holiday.subCompanyId });
    else reset({ status: 'ACTIVE', subCompanyId: scope.subCompanyId ?? '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holiday, open, reset]);

  const subOptions = [{ label: 'Select sub company', value: '' }, ...scope.subCompanies.map((sc) => ({ label: sc.name, value: sc.id }))];

  async function onSubmit(data: FormData) {
    try {
      const payload = { ...data };
      if (isEdit && holiday) {
        await update.mutateAsync({ id: holiday.id, payload });
        toast.success('Holiday updated');
      } else {
        await create.mutateAsync(payload);
        toast.success('Holiday added', data.name);
      }
      onClose();
    } catch { toast.error('Failed'); }
  }

  return (
    <Dialog open={open} onClose={onClose} title={isEdit ? 'Edit Holiday' : 'Add Holiday'} size="sm"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button form="holiday-form" type="submit" loading={isSubmitting}>{isEdit ? 'Save' : 'Add'}</Button></>}
    >
      <form noValidate id="holiday-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {scope.isAdmin && (isEdit ? (
          <Input label="Sub Company" value={scope.subCompanies.find((sc) => sc.id === holiday?.subCompanyId)?.name ?? ''} readOnly />
        ) : (
          <Select label="Sub Company" required options={subOptions} error={errors.subCompanyId?.message} {...register('subCompanyId')} />
        ))}
        <Input label="Holiday Name" required error={errors.name?.message} {...register('name')} placeholder="Independence Day" />
        <Input label="Date" type="date" required error={errors.date?.message} {...register('date')} />
        <Input label="Description (Optional)" maxLength={220} error={errors.description?.message} {...register('description')} placeholder="Brief description..." />
        <Select label="Status" required options={[{ label: 'Active', value: 'ACTIVE' }, { label: 'Inactive', value: 'INACTIVE' }]} {...register('status')} />
      </form>
    </Dialog>
  );
}
