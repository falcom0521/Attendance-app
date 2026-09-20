import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { holidayService } from '@/services/mock';
import type { CreateHolidayPayload } from '@/types/holiday';

export const holidayKeys = {
  all: ['holidays'] as const,
  list: (subCompanyId?: string, year?: number, companyId?: string) => [...holidayKeys.all, 'list', subCompanyId, year, companyId] as const,
};

export function useHolidays(subCompanyId?: string, year?: number, companyId?: string) {
  return useQuery({
    queryKey: holidayKeys.list(subCompanyId, year, companyId),
    queryFn: () => holidayService.getHolidays(subCompanyId, year, companyId),
  });
}

export function useCreateHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateHolidayPayload) => holidayService.createHoliday(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: holidayKeys.all }); },
  });
}

export function useUpdateHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateHolidayPayload> }) =>
      holidayService.updateHoliday(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: holidayKeys.all }); },
  });
}

export function useDeleteHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => holidayService.deleteHoliday(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: holidayKeys.all }); },
  });
}
