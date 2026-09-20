import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/feedback/ToastContext';
import { useCreateCompany, useUpdateCompany } from '../hooks/useCompanies';
import type { Company } from '@/types/company';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  code: z.string().min(2, 'Code is required').max(10, 'Max 10 chars'),
  registrationNumber: z.string().min(1, 'Registration number required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(7, 'Phone required'),
  address: z.string().min(5, 'Address required'),
  city: z.string().min(2, 'City required'),
  state: z.string().min(2, 'State required'),
  country: z.string().min(2, 'Country required'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  company?: Company | null;
}

export function CompanyFormDialog({ open, onClose, company }: Props) {
  const toast = useToast();
  const create = useCreateCompany();
  const update = useUpdateCompany();
  const isEdit = !!company;

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'ACTIVE', country: 'India' },
  });

  useEffect(() => {
    if (company) reset({ ...company });
    else reset({ status: 'ACTIVE', country: 'India' });
  }, [company, reset]);

  async function onSubmit(data: FormData) {
    try {
      if (isEdit && company) {
        await update.mutateAsync({ id: company.id, payload: data });
        toast.success('Company updated', company.name);
      } else {
        await create.mutateAsync(data);
        toast.success('Company created', data.name);
      }
      onClose();
    } catch (err) {
      toast.error('Operation failed', err instanceof Error ? err.message : 'Please try again');
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Company' : 'Add New Company'}
      description={isEdit ? 'Update company information' : 'Register a new company on the platform'}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button form="company-form" type="submit" loading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Company'}
          </Button>
        </>
      }
    >
      <form id="company-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <h4 className="text-sm font-semibold text-surface-700 mb-3">Company Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Company Name" required error={errors.name?.message} {...register('name')} placeholder="Nexus Technologies Pvt Ltd" />
            <Input label="Company Code" required error={errors.code?.message} {...register('code')} placeholder="NXTECH" />
            <Input label="Registration Number" required error={errors.registrationNumber?.message} {...register('registrationNumber')} placeholder="CIN-XXXXXXXXX" />
            <Select label="Status" required options={[{ label: 'Active', value: 'ACTIVE' }, { label: 'Inactive', value: 'INACTIVE' }]} error={errors.status?.message} {...register('status')} />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-surface-700 mb-3">Contact Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Email" type="email" required error={errors.email?.message} {...register('email')} placeholder="admin@company.com" />
            <Input label="Phone" required error={errors.phone?.message} {...register('phone')} placeholder="+91-XXX-XXXXXXX" />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-surface-700 mb-3">Address</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Address" required error={errors.address?.message} {...register('address')} placeholder="Street, Building" className="sm:col-span-2" />
            <Input label="City" required error={errors.city?.message} {...register('city')} />
            <Input label="State" required error={errors.state?.message} {...register('state')} />
            <Input label="Country" required error={errors.country?.message} {...register('country')} />
          </div>
        </div>
      </form>
    </Dialog>
  );
}
