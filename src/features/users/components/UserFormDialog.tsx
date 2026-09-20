import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/feedback/ToastContext';
import { useCreateUser, useUpdateUser } from '../hooks/useUsers';
import { useCompanies, useSubCompaniesByCompany } from '@/features/companies/hooks/useCompanies';
import { useAuthStore } from '@/store/authStore';
import type { AppUser } from '@/types/user';

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(7, 'Required'),
  username: z.string().min(3, 'Min 3 chars'),
  password: z.string().min(6, 'Min 6 chars').optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'HR']),
  companyId: z.string().optional(),
  subCompanyId: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});
type FormData = z.infer<typeof schema>;

export function UserFormDialog({ open, onClose, editUser }: { open: boolean; onClose: () => void; editUser?: AppUser | null }) {
  const toast = useToast();
  const { user: currentUser } = useAuthStore();
  const create = useCreateUser();
  const update = useUpdateUser();
  const isEdit = !!editUser;

  const { data: companiesData } = useCompanies({ page: 1, pageSize: 100 });

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'HR', status: 'ACTIVE', companyId: currentUser?.companyId ?? '' },
  });

  const selectedCompanyId = watch('companyId') ?? currentUser?.companyId ?? '';
  const { data: subCompanies } = useSubCompaniesByCompany(selectedCompanyId);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const companyOptions = [{ label: 'Select Company', value: '' }, ...(companiesData?.data ?? []).map((c) => ({ label: c.name, value: c.id }))];
  const subOptions = [{ label: 'Select Sub Company', value: '' }, ...(subCompanies ?? []).map((sc) => ({ label: sc.name, value: sc.id }))];
  const roleOptions = isSuperAdmin
    ? [{ label: 'Admin', value: 'ADMIN' }, { label: 'HR', value: 'HR' }]
    : [{ label: 'HR', value: 'HR' }];

  useEffect(() => {
    if (editUser) {
      reset({
        firstName: editUser.firstName, lastName: editUser.lastName,
        email: editUser.email, phone: editUser.phone, username: editUser.username,
        role: editUser.role === 'SUPER_ADMIN' ? 'ADMIN' : editUser.role,
        companyId: editUser.companyId, subCompanyId: editUser.subCompanyId, status: editUser.status,
      });
    } else {
      reset({ role: 'HR', status: 'ACTIVE', companyId: currentUser?.companyId ?? '' });
    }
  }, [editUser, reset, currentUser]);

  async function onSubmit(data: FormData) {
    try {
      const payload = { ...data, password: data.password || 'password123' };
      if (isEdit && editUser) {
        await update.mutateAsync({ id: editUser.id, payload });
        toast.success('User updated', `${data.firstName} ${data.lastName}`);
      } else {
        await create.mutateAsync(payload as Parameters<typeof create.mutateAsync>[0]);
        toast.success('User created', `${data.firstName} ${data.lastName}`);
      }
      onClose();
    } catch (err) { toast.error('Failed', err instanceof Error ? err.message : ''); }
  }

  return (
    <Dialog open={open} onClose={onClose} title={isEdit ? 'Edit User' : 'Add User'} size="lg"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button form="user-form" type="submit" loading={isSubmitting}>{isEdit ? 'Save' : 'Create'}</Button></>}
    >
      <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="First Name" required error={errors.firstName?.message} {...register('firstName')} />
        <Input label="Last Name" required error={errors.lastName?.message} {...register('lastName')} />
        <Input label="Email" type="email" required error={errors.email?.message} {...register('email')} />
        <Input label="Phone" required error={errors.phone?.message} {...register('phone')} />
        <Input label="Username" required error={errors.username?.message} {...register('username')} />
        {!isEdit && <Input label="Password" type="password" error={errors.password?.message} {...register('password')} placeholder="Temporary password" />}
        <Select label="Role" required options={roleOptions} error={errors.role?.message} {...register('role')} />
        <Select label="Status" required options={[{ label: 'Active', value: 'ACTIVE' }, { label: 'Inactive', value: 'INACTIVE' }]} error={errors.status?.message} {...register('status')} />
        {isSuperAdmin && (
          <Select label="Company" options={companyOptions} error={errors.companyId?.message} {...register('companyId')} />
        )}
        <Select label="Sub Company" options={subOptions} error={errors.subCompanyId?.message} {...register('subCompanyId')} />
      </form>
    </Dialog>
  );
}
