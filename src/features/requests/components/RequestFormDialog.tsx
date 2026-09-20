import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, LogIn, LogOut, Info } from 'lucide-react';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/feedback/ToastContext';
import { EmployeeSelect } from '@/features/employees/components/EmployeeSelect';
import { useEmployees, useEmployee } from '@/features/employees/hooks/useEmployees';
import { useAttendanceRecord } from '@/features/attendance/hooks/useAttendance';
import { useSubCompanyScope } from '@/hooks/useSubCompanyScope';
import { useActor } from '@/hooks/useActor';
import { todayISO, formatDate, formatTime } from '@/utils/date';
import { cn } from '@/lib/utils';
import type { RequestType, LeaveType } from '@/types/request';
import { useCreateRequest, useLeaveBalances } from '../hooks/useRequests';
import { LEAVE_TYPE_OPTIONS, REQUEST_TYPE_LABEL } from '../utils';
import { reasonField } from '@/lib/validation';

const punchPair = z.object({ punchIn: z.string(), punchOut: z.string() });

const schema = z
  .object({
    type: z.enum(['REGULARIZATION', 'MISSING_PUNCH', 'LEAVE']),
    employeeId: z.string().min(1, 'Select an employee'),
    date: z.string().min(1, 'Date is required'),
    endDate: z.string().optional(),
    leaveType: z.enum(['CASUAL', 'SICK', 'EARNED', 'UNPAID']).optional(),
    missing: z.enum(['IN', 'OUT']),
    missingTime: z.string().optional(),
    punches: z.array(punchPair),
    reason: reasonField(5, 300),
  })
  .superRefine((v, ctx) => {
    const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: 'custom', path, message });

    if (v.type === 'LEAVE') {
      if (!v.leaveType) issue(['leaveType'], 'Select a leave type');
      if (v.endDate && v.endDate < v.date) issue(['endDate'], 'End date cannot be before start date');
      return;
    }

    if (v.date > todayISO()) issue(['date'], 'Date cannot be in the future');
    if (v.type === 'MISSING_PUNCH') {
      if (!v.missingTime) issue(['missingTime'], 'Enter the missing punch time');
      return;
    }
    v.punches.forEach((p, i) => {
      if (!p.punchIn) issue(['punches', i, 'punchIn'], 'Punch-in time required');
      else if (p.punchOut && p.punchOut <= p.punchIn) issue(['punches', i, 'punchOut'], 'Punch-out must be after punch-in');
    });
  });

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: { type?: RequestType; employeeId?: string; date?: string };
  /** Fix the request type (hides the type switcher). */
  lockType?: boolean;
}

const TYPE_OPTIONS = (Object.keys(REQUEST_TYPE_LABEL) as RequestType[]).map((value) => ({
  value,
  label: REQUEST_TYPE_LABEL[value],
}));

function emptyForm(initial?: Props['initial']): FormData {
  return {
    type: initial?.type ?? 'REGULARIZATION',
    employeeId: initial?.employeeId ?? '',
    date: initial?.date ?? todayISO(),
    endDate: initial?.date ?? todayISO(),
    leaveType: 'CASUAL',
    missing: 'OUT',
    missingTime: '',
    punches: [{ punchIn: '', punchOut: '' }],
    reason: '',
  };
}

export function RequestFormDialog({ open, onClose, initial, lockType = false }: Props) {
  const toast = useToast();
  const actor = useActor();
  const scope = useSubCompanyScope();
  const create = useCreateRequest();
  const [subFilter, setSubFilter] = useState('');
  const lockedEmployee = !!initial?.employeeId;

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: emptyForm(initial),
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'punches' });

  const type = watch('type');
  const employeeId = watch('employeeId');
  const date = watch('date');
  const endDate = watch('endDate');
  const leaveType = watch('leaveType') as LeaveType | undefined;
  const missing = watch('missing');

  const { data: empData } = useEmployees({
    page: 1,
    pageSize: 200,
    companyId: scope.companyId,
    subCompanyId: scope.isAdmin ? subFilter || undefined : scope.subCompanyId,
    status: 'ACTIVE',
  });
  const employees = empData?.data ?? [];
  const { data: employee } = useEmployee(employeeId);

  // For a missing punch, show what the device did record so the right side is corrected.
  const { data: record } = useAttendanceRecord(type === 'MISSING_PUNCH' ? employeeId : '', date);
  const { data: balances = [] } = useLeaveBalances({
    companyId: scope.companyId,
    subCompanyId: employee?.subCompanyId,
    year: date ? parseISO(date).getFullYear() : undefined,
  });

  useEffect(() => {
    if (!open) return;
    setSubFilter(scope.subCompanyId ?? '');
    reset(emptyForm(initial));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.type, initial?.employeeId, initial?.date, reset]);

  useEffect(() => {
    if (type === 'MISSING_PUNCH' && record) {
      const hasIn = record.punchRecords.some((p) => p.punchType === 'IN');
      const hasOut = record.punchRecords.some((p) => p.punchType === 'OUT');
      if (hasIn && !hasOut) setValue('missing', 'OUT');
      else if (hasOut && !hasIn) setValue('missing', 'IN');
    }
  }, [type, record, setValue]);

  async function onSubmit(data: FormData) {
    if (!actor) return;
    try {
      const request = await create.mutateAsync({
        actor,
        payload: {
          type: data.type,
          employeeId: data.employeeId,
          date: data.date,
          reason: data.reason,
          ...(data.type === 'LEAVE'
            ? { endDate: data.endDate || data.date, leaveType: data.leaveType }
            : {
                punches:
                  data.type === 'MISSING_PUNCH'
                    ? [data.missing === 'OUT'
                        ? { punchIn: '', punchOut: data.missingTime ?? '' }
                        : { punchIn: data.missingTime ?? '', punchOut: '' }]
                    : data.punches,
              }),
        },
      });
      toast.success(
        request.status === 'APPROVED' ? 'Request approved and applied' : 'Request submitted for approval',
        `${request.employeeName} — ${REQUEST_TYPE_LABEL[request.type]}`
      );
      onClose();
    } catch (err) {
      toast.error('Could not submit request', err instanceof Error ? err.message : undefined);
    }
  }

  const subOptions = [
    { label: 'All sub companies', value: '' },
    ...scope.subCompanies.map((sc) => ({ label: sc.name, value: sc.id })),
  ];
  const bucket = leaveType && leaveType !== 'UNPAID'
    ? balances.find((b) => b.employeeId === employeeId)?.balances[leaveType]
    : undefined;
  const calendarDays = date && endDate && endDate >= date ? differenceInCalendarDays(parseISO(endDate), parseISO(date)) + 1 : 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={type === 'LEAVE' ? 'Apply Leave' : 'Attendance Correction Request'}
      description={
        actor?.role === 'ADMIN'
          ? 'Requests raised by an Admin are approved and applied immediately.'
          : 'An Admin reviews the request; attendance is updated once it is approved.'
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={create.isPending}>Cancel</Button>
          <Button form="request-form" type="submit" loading={create.isPending}>
            {actor?.role === 'ADMIN' ? 'Submit & Apply' : 'Submit for Approval'}
          </Button>
        </>
      }
    >
      <form noValidate id="request-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {!lockType && (
          <Select
            label="Request Type"
            options={TYPE_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
            {...register('type')}
          />
        )}

        {lockedEmployee ? (
          <div className="p-3 bg-surface-50 rounded-xl">
            <p className="text-xs text-surface-400">Employee</p>
            <p className="font-semibold text-surface-900">
              {employee?.fullName ?? '…'}
              <span className="ml-2 text-xs font-normal text-surface-400">{employee?.employeeCode}</span>
            </p>
            {employee && <p className="text-xs text-surface-500">{employee.department} · {employee.subCompanyName}</p>}
          </div>
        ) : (
          <>
            {scope.isAdmin && (
              <Select
                label="Sub Company"
                options={subOptions}
                value={subFilter}
                onChange={(e) => { setSubFilter(e.target.value); setValue('employeeId', ''); }}
              />
            )}
            <EmployeeSelect
              employees={employees}
              value={employeeId}
              onChange={(id) => setValue('employeeId', id, { shouldValidate: true })}
              error={errors.employeeId?.message}
              showSubCompany={scope.isAdmin && !subFilter}
            />
          </>
        )}

        {type === 'LEAVE' ? (
          <>
            <Select
              label="Leave Type"
              required
              options={LEAVE_TYPE_OPTIONS}
              error={errors.leaveType?.message}
              {...register('leaveType')}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input label="From" type="date" required error={errors.date?.message} {...register('date')} />
              <Input label="To" type="date" required min={date} error={errors.endDate?.message} {...register('endDate')} />
            </div>
            <div className="flex gap-2.5 p-3 bg-info-50 border border-info-100 rounded-xl">
              <Info className="h-4 w-4 text-info-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-info-700">
                {calendarDays > 0 ? `${calendarDays} calendar day${calendarDays === 1 ? '' : 's'} selected. ` : ''}
                Weekly offs and holidays are not counted against the balance.
                {bucket && (
                  <> Balance: <strong>{bucket.total - bucket.used - bucket.pending}</strong> of {bucket.total} day(s) available
                    {bucket.pending > 0 && ` (${bucket.pending} pending approval)`}.</>
                )}
              </p>
            </div>
          </>
        ) : (
          <>
            <Input
              label="Date"
              type="date"
              required
              max={todayISO()}
              error={errors.date?.message}
              hint={date ? formatDate(date, 'EEEE, dd MMM yyyy') : undefined}
              {...register('date')}
            />

            {type === 'MISSING_PUNCH' ? (
              <div className="space-y-3">
                {record && (
                  <div className="p-3 bg-surface-50 rounded-xl">
                    <p className="text-xs text-surface-400 mb-1">Device punches on this day</p>
                    {record.punchRecords.length === 0 ? (
                      <p className="text-sm text-surface-500">None recorded</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {record.punchRecords.map((p) => (
                          <span key={p.id} className={cn('text-xs font-mono px-2 py-1 rounded-md', p.punchType === 'IN' ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700')}>
                            {p.punchType} {formatTime(p.punchTime)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Missing punch"
                    options={[{ label: 'Punch out', value: 'OUT' }, { label: 'Punch in', value: 'IN' }]}
                    {...register('missing')}
                  />
                  <Input
                    label={missing === 'OUT' ? 'Punch-out time' : 'Punch-in time'}
                    type="time"
                    required
                    error={errors.missingTime?.message}
                    {...register('missingTime')}
                  />
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="form-label mb-0">Correct punch times <span className="text-danger-500">*</span></label>
                  <button
                    type="button"
                    onClick={() => append({ punchIn: '', punchOut: '' })}
                    className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add punch pair
                  </button>
                </div>
                <div className="space-y-2.5">
                  {fields.map((field, idx) => (
                    <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-2.5 items-start p-3 bg-surface-50 rounded-xl border border-surface-100">
                      <div>
                        <label className="flex items-center gap-1 text-xs font-medium text-success-700 mb-1.5"><LogIn className="h-3 w-3" /> Punch In</label>
                        <input type="time" className={cn('form-input text-sm font-mono', errors.punches?.[idx]?.punchIn && 'form-input-error')} {...register(`punches.${idx}.punchIn`)} />
                        {errors.punches?.[idx]?.punchIn && <p className="form-error">{errors.punches[idx]?.punchIn?.message}</p>}
                      </div>
                      <div>
                        <label className="flex items-center gap-1 text-xs font-medium text-danger-600 mb-1.5"><LogOut className="h-3 w-3" /> Punch Out <span className="text-surface-400 font-normal">(optional)</span></label>
                        <input type="time" className={cn('form-input text-sm font-mono', errors.punches?.[idx]?.punchOut && 'form-input-error')} {...register(`punches.${idx}.punchOut`)} />
                        {errors.punches?.[idx]?.punchOut && <p className="form-error">{errors.punches[idx]?.punchOut?.message}</p>}
                      </div>
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
              </div>
            )}
          </>
        )}

        <div>
          <label className="form-label">Reason <span className="text-danger-500">*</span></label>
          <textarea
            rows={3}
            placeholder={type === 'LEAVE' ? 'e.g. Family function out of town' : 'e.g. Device was offline, employee forgot to punch out…'}
            className={cn('form-input resize-none text-sm', errors.reason && 'form-input-error')}
            {...register('reason')}
          />
          {errors.reason && <p className="form-error">{errors.reason.message}</p>}
        </div>
      </form>
    </Dialog>
  );
}
