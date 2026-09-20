import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/feedback/ToastContext';
import { useCreateDepartment, useUpdateDepartment } from '../hooks/useDepartments';
import { useAuthStore } from '@/store/authStore';
import type { Department } from '@/types/department';

const schema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name must be 60 characters or fewer'),
  description: z.string().max(200, 'Description must be 200 characters or fewer').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  department?: Department | null;
}

export function DepartmentFormDialog({ open, onClose, department }: Props) {
  const toast = useToast();
  const { user } = useAuthStore();
  const create = useCreateDepartment();
  const update = useUpdateDepartment();
  const isEdit = !!department;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'ACTIVE', description: '' },
  });

  useEffect(() => {
    if (open) {
      reset(
        department
          ? { name: department.name, description: department.description ?? '', status: department.status }
          : { status: 'ACTIVE', description: '' }
      );
    }
  }, [open, department, reset]);

  async function onSubmit(data: FormData) {
    try {
      if (isEdit && department) {
        await update.mutateAsync({ id: department.id, payload: data });
        toast.success('Department updated', data.name);
      } else {
        await create.mutateAsync({
          ...data,
          companyId: user?.companyId ?? '',
        });
        toast.success('Department created', data.name);
      }
      onClose();
    } catch (err) {
      toast.error('Failed to save department', err instanceof Error ? err.message : 'Please try again');
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Department' : 'Add Department'}
      description={
        isEdit
          ? 'Update department name and settings'
          : 'Create a new department for your company. It will be available across all sub-companies.'
      }
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button form="dept-form" type="submit" loading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Department'}
          </Button>
        </>
      }
    >
      <form id="dept-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Department Name"
          required
          placeholder="e.g. Engineering"
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Description"
          placeholder="Brief description (optional)"
          error={errors.description?.message}
          hint="Visible to admins and HR only"
          {...register('description')}
        />
        <Select
          label="Status"
          required
          options={[
            { label: 'Active', value: 'ACTIVE' },
            { label: 'Inactive', value: 'INACTIVE' },
          ]}
          error={errors.status?.message}
          {...register('status')}
        />
      </form>
    </Dialog>
  );
}
