import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/feedback/ToastContext';
import { useAllocateDevice } from '../hooks/useDevices';
import { useCompanies, useSubCompaniesByCompany } from '@/features/companies/hooks/useCompanies';
import type { Device } from '@/types/device';
import { optionalText } from '@/lib/validation';

const schema = z.object({
  companyId: z.string().min(1, 'Select a company'),
  subCompanyId: z.string().min(1, 'Select a sub company'),
  notes: optionalText('Notes', 200),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  device: Device;
  onClose: () => void;
  /** Re-allocation moves an already-allocated device; the previous allocation is closed and kept in history. */
  mode?: 'allocate' | 'reallocate';
}

export function AllocateDeviceDialog({ open, device, onClose, mode = 'allocate' }: Props) {
  const isRealloc = mode === 'reallocate';
  const toast = useToast();
  const allocate = useAllocateDevice();
  const [selectedCompany, setSelectedCompany] = useState('');

  const { data: companiesData } = useCompanies({ page: 1, pageSize: 100 });
  const { data: subCompanies } = useSubCompaniesByCompany(selectedCompany);

  const companyOptions = [{ label: 'Select Company', value: '' }, ...(companiesData?.data ?? []).map((c) => ({ label: c.name, value: c.id }))];
  const subOptions = [{ label: 'Select Sub Company', value: '' }, ...(subCompanies ?? []).map((sc) => ({ label: sc.name, value: sc.id }))];

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema), mode: 'onTouched' });

  async function onSubmit(data: FormData) {
    try {
      await allocate.mutateAsync({ deviceId: device.id, ...data });
      const target = (subCompanies ?? []).find((sc) => sc.id === data.subCompanyId)?.name ?? data.subCompanyId;
      toast.success(isRealloc ? 'Device re-allocated' : 'Device allocated successfully', `${device.deviceId} → ${target}`);
      onClose();
    } catch (err) { toast.error(isRealloc ? 'Re-allocation failed' : 'Allocation failed', err instanceof Error ? err.message : undefined); }
  }

  return (
    <Dialog open={open} onClose={onClose} title={isRealloc ? 'Re-allocate Device' : 'Allocate Device'}
      description={isRealloc
        ? `Move device ${device.deviceId} from ${device.subCompanyName ?? 'its current sub company'} to another sub company`
        : `Assign device ${device.deviceId} to a company and sub company`}
      size="md"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button form="allocate-form" type="submit" loading={isSubmitting || allocate.isPending}>{isRealloc ? 'Re-allocate' : 'Allocate'}</Button></>}
    >
      <form noValidate id="allocate-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-3 bg-surface-50 rounded-lg">
          <p className="text-xs text-surface-500">Device</p>
          <p className="font-semibold text-surface-900">{device.deviceId}</p>
          <p className="text-sm text-surface-600">{device.name} • {device.modelNumber}</p>
        </div>
        <Select label="Company" required options={companyOptions} error={errors.companyId?.message}
          {...register('companyId')}
          onChange={(e) => { setValue('companyId', e.target.value); setSelectedCompany(e.target.value); setValue('subCompanyId', ''); }}
        />
        <Select label="Sub Company" required options={subOptions} error={errors.subCompanyId?.message}
          {...register('subCompanyId')} disabled={!selectedCompany}
        />
        <Input label="Notes (Optional)" maxLength={220} error={errors.notes?.message} {...register('notes')} placeholder="Deployment notes..." />
      </form>
    </Dialog>
  );
}
