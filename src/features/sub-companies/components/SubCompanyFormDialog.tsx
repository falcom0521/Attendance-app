import { useEffect } from 'react';
import { cn } from '@/lib/utils';
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

const schema = z.object({
  companyId: z.string().min(1, 'Company required'),
  name: z.string().min(2, 'Name required'),
  code: z.string().min(2, 'Code required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(7, 'Phone required'),
  address: z.string().min(5, 'Address required'),
  city: z.string().min(2, 'City required'),
  state: z.string().min(2, 'State required'),
  country: z.string().min(2, 'Country required'),
  timezone: z.string().min(1, 'Timezone required'),
  workingDays: z.array(z.string()).min(1, 'Select at least one working day'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});
type FormData = z.infer<typeof schema>;

const DAYS = [
  { value: 'MONDAY', label: 'Mon' }, { value: 'TUESDAY', label: 'Tue' }, { value: 'WEDNESDAY', label: 'Wed' },
  { value: 'THURSDAY', label: 'Thu' }, { value: 'FRIDAY', label: 'Fri' }, { value: 'SATURDAY', label: 'Sat' },
  { value: 'SUNDAY', label: 'Sun' },
];
const DEFAULT_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

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
    defaultValues: { status: 'ACTIVE', country: 'India', timezone: 'Asia/Kolkata', workingDays: DEFAULT_DAYS, companyId: defaultCompanyId ?? '' },
  });
  const workingDays = watch('workingDays') ?? [];

  useEffect(() => {
    if (!open) return;
    if (subCompany) reset({ ...subCompany, workingDays: subCompany.workingDays?.length ? subCompany.workingDays : DEFAULT_DAYS });
    else reset({ status: 'ACTIVE', country: 'India', timezone: 'Asia/Kolkata', workingDays: DEFAULT_DAYS, companyId: defaultCompanyId ?? '' });
  }, [subCompany, open, defaultCompanyId, reset]);

  function toggleDay(day: string) {
    const next = workingDays.includes(day) ? workingDays.filter((d) => d !== day) : [...workingDays, day];
    setValue('workingDays', next, { shouldValidate: true });
  }

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
      <form id="sub-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
            <label className="form-label">Working Days <span className="text-danger-500">*</span></label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => {
                const on = workingDays.includes(d.value);
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    aria-pressed={on}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                      on ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-surface-300 text-surface-600 hover:bg-surface-50'
                    )}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
            {errors.workingDays && <p className="form-error mt-1">{errors.workingDays.message}</p>}
          </div>
        </div>
      </form>
    </Dialog>
  );
}
