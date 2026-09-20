import { useEffect } from 'react';
import { WeekdayPicker } from '@/components/ui/WeekdayPicker';
import { DEFAULT_WORKING_DAYS as DEFAULT_DAYS } from '@/lib/weekdays';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/feedback/ToastContext';
import { useCreateSubCompany, useUpdateSubCompany } from '@/features/companies/hooks/useCompanies';
import { useCompanies } from '@/features/companies/hooks/useCompanies';
import type { SubCompany } from '@/types/company';
import { requiredText, codeField, emailField, phoneField, placeName, timezoneField } from '@/lib/validation';

const schema = z.object({
  companyId: z.string().min(1, 'Select a parent company'),
  name: requiredText('Sub company name', { min: 2, max: 100 }),
  code: codeField('Code', 2, 20).toUpperCase(),
  email: emailField,
  phone: phoneField,
  address: requiredText('Address', { min: 5, max: 200 }),
  city: placeName('City'),
  state: placeName('State'),
  country: placeName('Country'),
  timezone: timezoneField,
  workingDays: z.array(z.string()).min(1, 'Select at least one working day'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});
type FormData = z.infer<typeof schema>;


export function SubCompanyFormDialog({ open, onClose, subCompany, defaultCompanyId }: { open: boolean; onClose: () => void; subCompany?: SubCompany | null; defaultCompanyId?: string }) {
  const toast = useToast();
  const create = useCreateSubCompany();
  const update = useUpdateSubCompany();
  const { data: companiesData } = useCompanies({ page: 1, pageSize: 100 });
  const isEdit = !!subCompany;

  const companyOptions = [
    { label: 'Select Company', value: '' },
    ...(companiesData?.data ?? []).map((c) => ({ label: c.name, value: c.id })),
  ];

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { status: 'ACTIVE', country: 'India', timezone: 'Asia/Kolkata', workingDays: DEFAULT_DAYS, companyId: defaultCompanyId ?? '' },
  });
  const workingDays = watch('workingDays') ?? [];

  useEffect(() => {
    if (!open) return;
    if (subCompany) reset({ ...subCompany, workingDays: subCompany.workingDays?.length ? subCompany.workingDays : DEFAULT_DAYS });
    else reset({ status: 'ACTIVE', country: 'India', timezone: 'Asia/Kolkata', workingDays: DEFAULT_DAYS, companyId: defaultCompanyId ?? '' });
  }, [subCompany, open, defaultCompanyId, reset]);

  async function onSubmit(data: FormData) {
    try {
      if (isEdit && subCompany) {
        await update.mutateAsync({ id: subCompany.id, payload: data });
        toast.success('Sub company updated');
      } else {
        await create.mutateAsync(data);
        toast.success('Sub company created', data.name);
      }
      onClose();
    } catch (err) {
      toast.error('Failed', err instanceof Error ? err.message : 'Please try again');
    }
  }

  return (
    <Dialog open={open} onClose={onClose}
      title={isEdit ? 'Edit Sub Company' : 'Add Sub Company'}
      size="xl"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button form="sub-form" type="submit" loading={isSubmitting}>{isEdit ? 'Save Changes' : 'Create'}</Button></>}
    >
      <form noValidate id="sub-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Parent Company" required options={companyOptions} error={errors.companyId?.message} {...register('companyId')} className="sm:col-span-2" />
          <Input label="Sub Company Name" required error={errors.name?.message} {...register('name')} />
          <Input label="Code" required error={errors.code?.message} {...register('code')} />
          <Input label="Email" type="email" required error={errors.email?.message} {...register('email')} />
          <Input label="Phone" required error={errors.phone?.message} {...register('phone')} />
          <Input label="Address" required error={errors.address?.message} {...register('address')} className="sm:col-span-2" />
          <Input label="City" required error={errors.city?.message} {...register('city')} />
          <Input label="State" required error={errors.state?.message} {...register('state')} />
          <Input label="Country" required error={errors.country?.message} {...register('country')} />
          <Input label="Timezone" required error={errors.timezone?.message} {...register('timezone')} />
          <Select label="Status" required options={[{ label: 'Active', value: 'ACTIVE' }, { label: 'Inactive', value: 'INACTIVE' }]} error={errors.status?.message} {...register('status')} />
          <div className="sm:col-span-2">
            <WeekdayPicker required value={workingDays} onChange={(days) => setValue('workingDays', days, { shouldValidate: true })} error={errors.workingDays?.message} />
          </div>
        </div>
      </form>
    </Dialog>
  );
}
