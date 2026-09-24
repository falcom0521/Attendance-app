import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarCheck, Info } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/feedback/ToastContext';
import { useMarkPreApprovedLeave } from '../hooks/useAttendance';
import { LEAVE_TYPE_OPTIONS } from '@/features/requests/utils';
import { reasonField } from '@/lib/validation';
import { formatDate } from '@/utils/date';
import { cn } from '@/lib/utils';

const schema = z.object({
  leaveType: z.enum(['CASUAL', 'SICK', 'EARNED', 'UNPAID']),
  reason: reasonField(5, 300),
});
type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  date: string;
}

/**
 * Flags a day that is currently ABSENT as pre-approved leave, in one step — no separate approval
 * (that fuller workflow lives in the Requests module, which is switched off for now).
 */
export function MarkLeaveDialog({ open, onClose, employeeId, employeeName, date }: Props) {
  const toast = useToast();
  const mark = useMarkPreApprovedLeave();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { leaveType: 'CASUAL', reason: '' },
  });

  useEffect(() => {
    if (open) reset({ leaveType: 'CASUAL', reason: '' });
  }, [open, reset]);

  async function onSubmit(data: FormData) {
    try {
      await mark.mutateAsync({ employeeId, date, leaveType: data.leaveType, reason: data.reason });
      toast.success('Marked as leave', `${employeeName} — ${formatDate(date)}`);
      onClose();
    } catch (err) {
      toast.error('Could not mark as leave', err instanceof Error ? err.message : undefined);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="md"
      title="Mark as Pre-Approved Leave"
      description={`${employeeName} — ${formatDate(date)}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={mark.isPending}>Cancel</Button>
          <Button form="mark-leave-form" type="submit" loading={mark.isPending} leftIcon={<CalendarCheck className="h-4 w-4" />}>
            Mark as Leave
          </Button>
        </>
      }
    >
      <form id="mark-leave-form" noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex gap-2.5 rounded-xl border border-info-100 bg-info-50 p-3.5">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-info-500" />
          <p className="text-xs text-info-700">
            This day is currently marked Absent. Marking it as leave here applies immediately — no
            separate approval step — and does not draw down a leave balance.
          </p>
        </div>

        <Select label="Leave Type" required options={LEAVE_TYPE_OPTIONS} error={errors.leaveType?.message} {...register('leaveType')} />

        <div>
          <label className="form-label" htmlFor="mark-leave-reason">
            Reason <span className="text-danger-500">*</span>
          </label>
          <textarea
            id="mark-leave-reason"
            rows={3}
            maxLength={300}
            placeholder="e.g. Approved by the reporting manager over email, employee was on sick leave…"
            className={cn('form-input resize-none text-sm', errors.reason && 'form-input-error')}
            aria-invalid={!!errors.reason}
            {...register('reason')}
          />
          {errors.reason && <p className="form-error" role="alert">{errors.reason.message}</p>}
        </div>
      </form>
    </Dialog>
  );
}
