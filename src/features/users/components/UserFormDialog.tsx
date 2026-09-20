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
import { personName, emailField, phoneField, usernameField, optionalPasswordField } from '@/lib/validation';

const schema = z.object({
  firstName: personName('First name'),
  lastName: personName('Last name'),
  email: emailField,
  phone: phoneField,
  username: usernameField,
  password: optionalPasswordField,
  role: z.enum(['ADMIN', 'HR', 'SUPER_ADMIN_VIEWER']),
  companyId: z.string().optional(),
  subCompanyId: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
}).superRefine((v, ctx) => {
  // The read-only Super Admin is platform-level; Admin and HR belong to a company (HR also to a sub company).
  if (v.role !== 'SUPER_ADMIN_VIEWER' && !v.companyId) {
    ctx.addIssue({ code: 'custom', path: ['companyId'], message: 'Select a company' });
  }
  if (v.role === 'HR' && !v.subCompanyId) {
    ctx.addIssue({ code: 'custom', path: ['subCompanyId'], message: 'Select a sub company for HR users' });
  }
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
    mode: 'onTouched',
    defaultValues: { role: 'HR', status: 'ACTIVE', companyId: currentUser?.companyId ?? '' },
  });

  const selectedCompanyId = watch('companyId') ?? currentUser?.companyId ?? '';
  const { data: subCompanies } = useSubCompaniesByCompany(selectedCompanyId);

  // Only a full Super Admin (not the read-only one) can see the company picker and create the read-only role.
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const selectedRole = watch('role');
  const isViewerRole = selectedRole === 'SUPER_ADMIN_VIEWER';

  const companyOptions = [{ label: 'Select Company', value: '' }, ...(companiesData?.data ?? []).map((c) => ({ label: c.name, value: c.id }))];
  const subOptions = [{ label: 'Select Sub Company', value: '' }, ...(subCompanies ?? []).map((sc) => ({ label: sc.name, value: sc.id }))];
  const roleOptions = isSuperAdmin
    ? [
        { label: 'Admin', value: 'ADMIN' },
        { label: 'HR', value: 'HR' },
        { label: 'Super Admin (Read-only)', value: 'SUPER_ADMIN_VIEWER' },
      ]
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
      const payload = {
        ...data,
        password: data.password || 'password123',
        // Platform-level role: never tied to a company or sub company.
        ...(data.role === 'SUPER_ADMIN_VIEWER' ? { companyId: undefined, subCompanyId: undefined } : {}),
        ...(data.role === 'ADMIN' ? { subCompanyId: undefined } : {}),
      };
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
      <form noValidate id="user-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="First Name" required error={errors.firstName?.message} {...register('firstName')} />
        <Input label="Last Name" required error={errors.lastName?.message} {...register('lastName')} />
        <Input label="Email" type="email" required error={errors.email?.message} {...register('email')} />
        <Input label="Phone" required error={errors.phone?.message} {...register('phone')} />
        <Input label="Username" required error={errors.username?.message} {...register('username')} />
        {!isEdit && <Input label="Password" type="password" error={errors.password?.message} {...register('password')} placeholder="Temporary password" />}
        <Select label="Role" required options={roleOptions} error={errors.role?.message} {...register('role')} />
        <Select label="Status" required options={[{ label: 'Active', value: 'ACTIVE' }, { label: 'Inactive', value: 'INACTIVE' }]} error={errors.status?.message} {...register('status')} />
        {isViewerRole && (
          <p className="sm:col-span-2 rounded-lg bg-warning-50 px-3 py-2.5 text-xs text-warning-700 ring-1 ring-inset ring-warning-600/20">
            A read-only Super Admin can view every company, sub company, device, user and audit log, but cannot create, edit, deactivate or allocate anything.
          </p>
        )}
        {isSuperAdmin && !isViewerRole && (
          <Select label="Company" required options={companyOptions} error={errors.companyId?.message} {...register('companyId')} />
        )}
        {selectedRole === 'HR' && (
          <Select label="Sub Company" required options={subOptions} error={errors.subCompanyId?.message} {...register('subCompanyId')} />
        )}
      </form>
    </Dialog>
  );
}
