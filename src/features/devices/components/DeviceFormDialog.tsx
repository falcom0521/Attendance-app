import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/feedback/ToastContext';
import { useCreateDevice, useUpdateDevice } from '../hooks/useDevices';
import type { Device } from '@/types/device';
import { requiredText, codeField, macField, ipv4Field } from '@/lib/validation';

const schema = z.object({
  deviceId: codeField('Device ID', 3, 30),
  name: requiredText('Device name', { min: 2, max: 60 }),
  modelNumber: requiredText('Model number', { max: 50 }),
  serialNumber: codeField('Serial number', 3, 50),
  macAddress: macField,
  firmwareVersion: requiredText('Firmware version', { max: 20 }).regex(/^\d+(\.\d+){1,3}([-+][\w.]+)?$/, 'Use a version like 3.4.2'),
  ipAddress: ipv4Field,
});

type FormData = z.infer<typeof schema>;

export function DeviceFormDialog({ open, onClose, device }: { open: boolean; onClose: () => void; device?: Device | null }) {
  const toast = useToast();
  const create = useCreateDevice();
  const update = useUpdateDevice();
  const isEdit = !!device;
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema), mode: 'onTouched' });

  useEffect(() => {
    if (!open) return;
    if (device) {
      reset({
        deviceId: device.deviceId,
        name: device.name,
        modelNumber: device.modelNumber,
        serialNumber: device.serialNumber,
        macAddress: device.macAddress,
        firmwareVersion: device.firmwareVersion,
        ipAddress: device.ipAddress,
      });
    } else {
      reset({ deviceId: '', name: '', modelNumber: '', serialNumber: '', macAddress: '', firmwareVersion: '', ipAddress: '' });
    }
  }, [device, open, reset]);

  async function onSubmit(data: FormData) {
    try {
      if (isEdit && device) {
        await update.mutateAsync({ id: device.id, payload: data });
        toast.success('Device updated', data.deviceId);
      } else {
        await create.mutateAsync(data);
        toast.success('Device added', data.deviceId);
      }
      onClose();
    } catch { toast.error(isEdit ? 'Failed to update device' : 'Failed to add device'); }
  }

  return (
    <Dialog open={open} onClose={onClose} title={isEdit ? 'Edit Device' : 'Add New Device'} size="lg"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button form="device-form" type="submit" loading={isSubmitting}>{isEdit ? 'Save' : 'Add Device'}</Button></>}
    >
      <form noValidate id="device-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Device ID" required error={errors.deviceId?.message} {...register('deviceId')} placeholder="DEV-XXX-001" />
        <Input label="Device Name" required error={errors.name?.message} {...register('name')} placeholder="Main Entrance" />
        <Input label="Model Number" required error={errors.modelNumber?.message} {...register('modelNumber')} />
        <Input label="Serial Number" required error={errors.serialNumber?.message} {...register('serialNumber')} />
        <Input label="MAC Address" required error={errors.macAddress?.message} {...register('macAddress')} placeholder="00:1A:2B:3C:4D:5E" />
        <Input label="Firmware Version" required error={errors.firmwareVersion?.message} {...register('firmwareVersion')} />
        <Input label="IP Address" required error={errors.ipAddress?.message} {...register('ipAddress')} placeholder="192.168.1.100" />
      </form>
    </Dialog>
  );
}
