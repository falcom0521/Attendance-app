import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/feedback/ToastContext';
import { useCreateEmployee, useUpdateEmployee } from '../hooks/useEmployees';
import { useShifts } from '@/features/shifts/hooks/useShifts';
import { useDepartments } from '@/features/configuration/hooks/useDepartments';
import { useSubCompanyScope } from '@/hooks/useSubCompanyScope';
import { useAuthStore } from '@/store/authStore';
import type { Employee } from '@/types/employee';
import { requiredText, personName, codeField, emailField, phoneField, birthDateField, dateWithinFuture, joiningDateProblem, MIN_EMPLOYEE_AGE } from '@/lib/validation';

const schema = z.object({
  employeeCode: codeField('Employee code', 2, 20),
  firstName: personName('First name'),
  lastName: personName('Last name'),
  email: emailField,
  phone: phoneField,
  dateOfBirth: birthDateField(MIN_EMPLOYEE_AGE),
  address: requiredText('Address', { min: 5, max: 200 }),
  department: z.string().min(1, 'Select a department'),
  designation: requiredText('Designation', { min: 2, max: 60 }),
  employeeType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']),
  joiningDate: dateWithinFuture('Joining date', 90),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  subCompanyId: z.string().min(1, 'Select a sub company'),
  shiftId: z.string().optional(),
})
  .superRefine((v, ctx) => {
    // Cross-field: joining after birth, and old enough on the joining date.
    const problem = joiningDateProblem(v.dateOfBirth, v.joiningDate);
    if (problem) ctx.addIssue({ code: 'custom', path: ['joiningDate'], message: problem });
  });

type FormData = z.infer<typeof schema>;

const TYPE_OPTIONS = [
  { label: 'Full Time', value: 'FULL_TIME' }, { label: 'Part Time', value: 'PART_TIME' },
  { label: 'Contract', value: 'CONTRACT' }, { label: 'Intern', value: 'INTERN' },
];

export function EmployeeFormDialog({ open, onClose, employee }: { open: boolean; onClose: () => void; employee?: Employee | null }) {
  const toast = useToast();
  const { user } = useAuthStore();
  const create = useCreateEmployee();
  const update = useUpdateEmployee();
  const scope = useSubCompanyScope();
  const { data: departments = [] } = useDepartments(user?.companyId);
  const isEdit = !!employee;

  const deptOptions = [
    { label: 'Select Department', value: '' },
    ...departments
      .filter((d) => d.status === 'ACTIVE')
      .map((d) => ({ label: d.name, value: d.name })),
  ];


  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { status: 'ACTIVE', employeeType: 'FULL_TIME', subCompanyId: scope.subCompanyId ?? '' },
  });

  // Shifts belong to a sub company, so the shift list follows the selected sub company.
  const selectedSub = watch('subCompanyId');
  const { data: shifts } = useShifts(selectedSub || undefined, scope.companyId);
  const shiftOptions = [{ label: 'No Shift', value: '' }, ...(shifts ?? []).map((s) => ({ label: s.name, value: s.id }))];
  const subOptions = [{ label: 'Select sub company', value: '' }, ...scope.subCompanies.map((sc) => ({ label: sc.name, value: sc.id }))];

  useEffect(() => {
    if (!open) return;
    if (employee) {
      reset({ ...employee, subCompanyId: employee.subCompanyId, shiftId: employee.shiftId ?? '' });
    } else {
      reset({ status: 'ACTIVE', employeeType: 'FULL_TIME', subCompanyId: scope.subCompanyId ?? '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee, open, reset]);

  async function onSubmit(data: FormData) {
    try {
      const payload = { ...data, weeklyOff: ['SATURDAY', 'SUNDAY'] };
      if (isEdit && employee) {
        await update.mutateAsync({ id: employee.id, payload });
        toast.success('Employee updated', `${data.firstName} ${data.lastName}`);
      } else {
        await create.mutateAsync(payload);
        toast.success('Employee created', `${data.firstName} ${data.lastName}`);
      }
      onClose();
    } catch (err) { toast.error('Failed', err instanceof Error ? err.message : ''); }
  }

  return (
    <Dialog open={open} onClose={onClose} title={isEdit ? 'Edit Employee' : 'Add Employee'} size="2xl"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button form="emp-form" type="submit" loading={isSubmitting}>{isEdit ? 'Save' : 'Create'}</Button></>}
    >
      <form noValidate id="emp-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-surface-700 mb-3">Basic Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {scope.isAdmin && (
              isEdit ? (
                <Input label="Sub Company" value={employee?.subCompanyName ?? ''} readOnly className="sm:col-span-2" />
              ) : (
                <Select
                  label="Sub Company"
                  required
                  options={subOptions}
                  error={errors.subCompanyId?.message}
                  {...register('subCompanyId', { onChange: () => setValue('shiftId', '') })}
                />
              )
            )}
            <Input label="Employee Code" required error={errors.employeeCode?.message} {...register('employeeCode')} placeholder="EMP-1001" />
            <Input label="First Name" required error={errors.firstName?.message} {...register('firstName')} />
            <Input label="Last Name" required error={errors.lastName?.message} {...register('lastName')} />
            <Input label="Email" type="email" required error={errors.email?.message} {...register('email')} />
            <Input label="Phone" required error={errors.phone?.message} {...register('phone')} />
            <Input label="Date of Birth" type="date" required error={errors.dateOfBirth?.message} {...register('dateOfBirth', { deps: ['joiningDate'] })} />
            <Input label="Address" required error={errors.address?.message} {...register('address')} className="sm:col-span-2" />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-surface-700 mb-3">Employment Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Department" required options={deptOptions} error={errors.department?.message} {...register('department')} />
            <Input label="Designation" required error={errors.designation?.message} {...register('designation')} />
            <Select label="Employee Type" required options={TYPE_OPTIONS} error={errors.employeeType?.message} {...register('employeeType')} />
            <Input label="Joining Date" type="date" required error={errors.joiningDate?.message} {...register('joiningDate', { deps: ['dateOfBirth'] })} />
            <Select label="Status" required options={[{ label: 'Active', value: 'ACTIVE' }, { label: 'Inactive', value: 'INACTIVE' }]} error={errors.status?.message} {...register('status')} />
            <Select label="Assigned Shift" options={shiftOptions} error={errors.shiftId?.message} {...register('shiftId')} />
          </div>
        </div>
      </form>
    </Dialog>
  );
}
