import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, AlertCircle, Clock, LogIn, LogOut, Info } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/feedback/ToastContext';
import { useSaveManualAttendance, useManualEntry } from '../hooks/useAttendance';
import { useEmployees, useEmployee } from '@/features/employees/hooks/useEmployees';
import { EmployeeSelect } from '@/features/employees/components/EmployeeSelect';
import { useSubCompanyScope } from '@/hooks/useSubCompanyScope';
import { useActor } from '@/hooks/useActor';
import { todayISO, formatDate } from '@/utils/date';
import { cn } from '@/lib/utils';

// ── Validation schema ────────────────────────────────────────────────────────
const punchPairSchema = z.object({
  punchIn:  z.string().min(1, 'Punch-in time required'),
  punchOut: z.string().optional().or(z.literal('')),
}).refine((p) => {
  if (p.punchIn && p.punchOut) {
    return p.punchOut > p.punchIn;
  }
  return true;
}, { message: 'Punch-out must be after punch-in', path: ['punchOut'] });

const schema = z.object({
  employeeId: z.string().min(1, 'Select an employee'),
  date:       z.string().min(1, 'Date is required').refine(
    (d) => d <= todayISO(),
    { message: 'Date cannot be in the future' }
  ),
  punches: z.array(punchPairSchema).min(1, 'At least one punch entry is required'),
  reason: z.string().min(5, 'Please provide a reason (min 5 characters)'),
});

type FormData = z.infer<typeof schema>;

// ── Main dialog ──────────────────────────────────────────────────────────────
interface Props {
  open: boolean;
  onClose: () => void;
  /** Pre-select an employee / date (e.g. from the attendance detail page). */
  initial?: { employeeId: string; date: string };
  /** Edit the existing manual entry for `initial` instead of creating one. */
  editing?: boolean;
}

const EMPTY_FORM: FormData = {
  employeeId: '',
  date: todayISO(),
  punches: [{ punchIn: '', punchOut: '' }],
  reason: '',
};

export function ManualAttendanceDialog({ open, onClose, initial, editing = false }: Props) {
  const toast = useToast();
  const actor = useActor();
  const scope = useSubCompanyScope();
  const save = useSaveManualAttendance();
  const [subFilter, setSubFilter] = useState('');

  const { data: empData } = useEmployees({
    page: 1,
    pageSize: 200,
    companyId: scope.companyId,
    subCompanyId: scope.isAdmin ? subFilter || undefined : scope.subCompanyId,
    status: 'ACTIVE',
  });
  const employees = empData?.data ?? [];

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: EMPTY_FORM });

  const { fields, append, remove } = useFieldArray({ control, name: 'punches' });
  const watchedDate = watch('date');
  const watchedEmpId = watch('employeeId');

  const { data: existing } = useManualEntry(initial?.employeeId ?? '', initial?.date ?? '', open && editing);
  const { data: lockedEmployee } = useEmployee(editing ? (initial?.employeeId ?? '') : '');

  useEffect(() => {
    if (!open) return;
    setSubFilter(scope.subCompanyId ?? '');
    reset({
      ...EMPTY_FORM,
      employeeId: initial?.employeeId ?? '',
      date: initial?.date ?? todayISO(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.employeeId, initial?.date, reset]);

  // Edit mode: load the stored manual punches once they arrive.
  useEffect(() => {
    if (open && editing && existing) {
      reset({
        employeeId: existing.employeeId,
        date: existing.date,
        punches: existing.entries.length ? existing.entries : [{ punchIn: '', punchOut: '' }],
        reason: existing.reason,
      });
    }
  }, [open, editing, existing, reset]);

  async function onSubmit(data: FormData) {
    try {
      const result = await save.mutateAsync({
        edit: editing,
        payload: {
          employeeId: data.employeeId,
          date: data.date,
          punches: data.punches.map((p) => ({ punchIn: p.punchIn, punchOut: p.punchOut ?? '' })),
          reason: data.reason,
          by: actor?.name,
        },
      });
      toast.success(
        editing ? 'Manual entry updated' : 'Attendance recorded',
        `${result.employeeName} — ${formatDate(data.date)} · ${result.status}`
      );
      onClose();
    } catch (err) {
      toast.error('Failed to save attendance', err instanceof Error ? err.message : undefined);
    }
  }

  const submitting = save.isPending;
  const subOptions = [
    { label: 'All sub companies', value: '' },
    ...scope.subCompanies.map((sc) => ({ label: sc.name, value: sc.id })),
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? 'Edit Manual Entry' : 'Manual Attendance Entry'}
      description={
        editing
          ? 'Update the manually entered punches for this day. Device punches are not affected.'
          : "Record attendance for an employee for a past date. Only previous or today's dates are allowed."
      }
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            form="manual-att-form"
            type="submit"
            loading={submitting}
            leftIcon={<Clock className="h-4 w-4" />}
          >
            {editing ? 'Update Entry' : 'Save Attendance'}
          </Button>
        </>
      }
    >
      <form id="manual-att-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Info banner */}
        <div className="flex gap-2.5 p-3 bg-info-50 border border-info-100 rounded-xl">
          <Info className="h-4 w-4 text-info-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-info-700">
            Manual punches are tagged as <strong>Manual Entry</strong> and added to any punches the device
            recorded that day. Late, early-out and overtime are calculated automatically from the shift.
          </p>
        </div>

        {editing ? (
          <div className="p-3 bg-surface-50 rounded-xl">
            <p className="text-xs text-surface-400">Employee</p>
            <p className="font-semibold text-surface-900">
              {lockedEmployee?.fullName ?? '…'}
              <span className="ml-2 text-xs font-normal text-surface-400">{lockedEmployee?.employeeCode}</span>
            </p>
            <p className="text-sm text-surface-500 mt-0.5">
              {watchedDate ? formatDate(watchedDate, 'EEEE, dd MMM yyyy') : ''}
            </p>
          </div>
        ) : (
          <>
            {scope.isAdmin && (
              <Select
                label="Sub Company"
                options={subOptions}
                value={subFilter}
                onChange={(e) => { setSubFilter(e.target.value); setValue('employeeId', ''); }}
                hint="Narrow the employee list to one sub company"
              />
            )}
            <EmployeeSelect
              employees={employees}
              value={watchedEmpId}
              onChange={(id) => setValue('employeeId', id, { shouldValidate: true })}
              error={errors.employeeId?.message}
              showSubCompany={scope.isAdmin && !subFilter}
            />
            <div>
              <Input
                label="Date"
                type="date"
                required
                max={todayISO()}
                error={errors.date?.message}
                hint={watchedDate ? `Recording attendance for ${formatDate(watchedDate, 'EEEE, dd MMM yyyy')}` : undefined}
                {...register('date')}
              />
            </div>
          </>
        )}

        {/* Punch pairs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="form-label mb-0">
              Punch Times <span className="text-danger-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => append({ punchIn: '', punchOut: '' })}
              className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add punch pair
            </button>
          </div>

          <div className="space-y-2.5">
            {fields.map((field, idx) => (
              <div
                key={field.id}
                className="grid grid-cols-[1fr_1fr_auto] gap-2.5 items-start p-3 bg-surface-50 rounded-xl border border-surface-100"
              >
                {/* Punch In */}
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium text-success-700 mb-1.5">
                    <LogIn className="h-3 w-3" />
                    Punch In {idx === 0 && <span className="text-danger-500">*</span>}
                  </label>
                  <input
                    type="time"
                    className={cn(
                      'form-input text-sm font-mono',
                      errors.punches?.[idx]?.punchIn && 'form-input-error'
                    )}
                    {...register(`punches.${idx}.punchIn`)}
                  />
                  {errors.punches?.[idx]?.punchIn && (
                    <p className="form-error">{errors.punches[idx].punchIn?.message}</p>
                  )}
                </div>

                {/* Punch Out */}
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium text-danger-600 mb-1.5">
                    <LogOut className="h-3 w-3" />
                    Punch Out
                    <span className="text-surface-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="time"
                    className={cn(
                      'form-input text-sm font-mono',
                      errors.punches?.[idx]?.punchOut && 'form-input-error'
                    )}
                    {...register(`punches.${idx}.punchOut`)}
                  />
                  {errors.punches?.[idx]?.punchOut && (
                    <p className="form-error">{errors.punches[idx].punchOut?.message}</p>
                  )}
                </div>

                {/* Remove row */}
                <button
                  type="button"
                  onClick={() => fields.length > 1 && remove(idx)}
                  disabled={fields.length === 1}
                  className="mt-6 p-1.5 rounded-lg text-surface-400 hover:text-danger-600 hover:bg-danger-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Remove punch pair"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {errors.punches?.root && (
            <div className="flex items-center gap-1.5 mt-2">
              <AlertCircle className="h-3.5 w-3.5 text-danger-500" />
              <p className="form-error">{errors.punches.root.message}</p>
            </div>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className="form-label">
            Reason for Manual Entry <span className="text-danger-500">*</span>
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Device was offline, employee forgot to punch out…"
            className={cn(
              'form-input resize-none text-sm',
              errors.reason && 'form-input-error'
            )}
            {...register('reason')}
          />
          {errors.reason && <p className="form-error">{errors.reason.message}</p>}
        </div>
      </form>
    </Dialog>
  );
}
