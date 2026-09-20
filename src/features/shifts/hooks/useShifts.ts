import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftService } from '@/services/mock';
import type { CreateShiftPayload } from '@/types/shift';

export const shiftKeys = {
  all: ['shifts'] as const,
  list: (subCompanyId?: string, companyId?: string) => [...shiftKeys.all, 'list', subCompanyId, companyId] as const,
  detail: (id: string) => [...shiftKeys.all, 'detail', id] as const,
};

export function useShifts(subCompanyId?: string, companyId?: string) {
  return useQuery({
    queryKey: shiftKeys.list(subCompanyId, companyId),
    queryFn: () => shiftService.getShifts(subCompanyId, companyId),
  });
}

export function useShift(id: string) {
  return useQuery({
    queryKey: shiftKeys.detail(id),
    queryFn: () => shiftService.getShiftById(id),
    enabled: !!id,
  });
}

export function useCreateShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateShiftPayload) => shiftService.createShift(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: shiftKeys.all }); },
  });
}

export function useUpdateShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateShiftPayload> }) =>
      shiftService.updateShift(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: shiftKeys.all }); },
  });
}

export function useDeleteShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => shiftService.deleteShift(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: shiftKeys.all }); },
  });
}

export function useToggleShiftStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => shiftService.toggleShiftStatus(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: shiftKeys.all }); },
  });
}
