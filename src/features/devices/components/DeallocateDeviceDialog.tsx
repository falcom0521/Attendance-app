import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/feedback/ToastContext';
import { useDeallocateDevice } from '../hooks/useDevices';
import type { Device } from '@/types/device';

export function DeallocateDeviceDialog({ open, device, onClose }: { open: boolean; device: Device; onClose: () => void }) {
  const toast = useToast();
  const deallocate = useDeallocateDevice();
  const [reason, setReason] = useState('');

  async function handleConfirm() {
    try {
      await deallocate.mutateAsync({ deviceId: device.id, reason: reason.trim() || undefined });
      toast.success('Device deallocated', `${device.deviceId} is now unallocated`);
      setReason('');
      onClose();
    } catch (err) {
      toast.error('Deallocation failed', err instanceof Error ? err.message : undefined);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="md"
      title="Deallocate Device"
      description={`Return ${device.deviceId} from ${device.subCompanyName ?? 'its sub company'} to the unallocated pool.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={deallocate.isPending}>Cancel</Button>
          <Button variant="danger" onClick={handleConfirm} loading={deallocate.isPending}>Deallocate</Button>
        </>
      }
    >
      <p className="text-sm text-surface-600 mb-4">
        The sub company will stop receiving punches from this device. Past punches and this allocation stay in the history.
      </p>
      <label className="form-label" htmlFor="dealloc-reason">Reason <span className="text-surface-400 font-normal">(optional)</span></label>
      <textarea
        id="dealloc-reason"
        rows={3}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="e.g. Office closed, device being redeployed…"
        className="form-input resize-none text-sm"
      />
    </Dialog>
  );
}
