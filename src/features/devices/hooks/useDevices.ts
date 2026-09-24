import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deviceService } from '@/services/mock';
import type {
  CreateDevicePayload, AllocateDevicePayload, DeallocateDevicePayload, DevicePunchLogFilters,
} from '@/types/device';

export const deviceKeys = {
  all: ['devices'] as const,
  list: (params?: unknown) => [...deviceKeys.all, 'list', params] as const,
  detail: (id: string) => [...deviceKeys.all, 'detail', id] as const,
  allocations: (deviceId?: string) => [...deviceKeys.all, 'allocations', deviceId] as const,
  unallocated: () => [...deviceKeys.all, 'unallocated'] as const,
  stats: (id: string) => [...deviceKeys.all, 'stats', id] as const,
  punchLogs: (id: string, filters?: unknown) => [...deviceKeys.all, 'punchLogs', id, filters] as const,
};

export function useDevices(params?: { companyId?: string; subCompanyId?: string; status?: string; search?: string; page?: number; pageSize?: number; sortBy?: string; sortDir?: 'asc' | 'desc' }) {
  return useQuery({
    queryKey: deviceKeys.list(params),
    queryFn: () => deviceService.getDevices(params as Parameters<typeof deviceService.getDevices>[0]),
  });
}

export function useDevice(id: string) {
  return useQuery({
    queryKey: deviceKeys.detail(id),
    queryFn: () => deviceService.getDeviceById(id),
    enabled: !!id,
  });
}

export function useUnallocatedDevices() {
  return useQuery({
    queryKey: deviceKeys.unallocated(),
    queryFn: () => deviceService.getUnallocatedDevices(),
  });
}

export function useDeviceAllocations(deviceId?: string) {
  return useQuery({
    queryKey: deviceKeys.allocations(deviceId),
    queryFn: () => deviceService.getAllocations(deviceId),
  });
}

export function useCreateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDevicePayload) => deviceService.createDevice(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: deviceKeys.all }); },
  });
}

export function useAllocateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AllocateDevicePayload) => deviceService.allocateDevice(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: deviceKeys.all }); },
  });
}

export function useUpdateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateDevicePayload> }) =>
      deviceService.updateDevice(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: deviceKeys.all }); },
  });
}

export function useDeallocateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DeallocateDevicePayload) => deviceService.deallocateDevice(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: deviceKeys.all }); },
  });
}

export function useDeviceStats(deviceId: string) {
  return useQuery({
    queryKey: deviceKeys.stats(deviceId),
    queryFn: () => deviceService.getDeviceStats(deviceId),
    enabled: !!deviceId,
  });
}

export function useDevicePunchLogs(deviceId: string, filters?: DevicePunchLogFilters) {
  return useQuery({
    queryKey: deviceKeys.punchLogs(deviceId, filters),
    queryFn: () => deviceService.getDevicePunchLogs(deviceId, filters),
    enabled: !!deviceId,
    placeholderData: (prev) => prev,
  });
}
