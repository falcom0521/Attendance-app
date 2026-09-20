import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '@/services/mock';
import { attendanceKeys } from '@/features/attendance/hooks/useAttendance';
import type { AttendanceSettings } from '@/types/settings';

const key = (companyId?: string) => ['attendanceSettings', companyId] as const;

export function useAttendanceSettings(companyId?: string) {
  return useQuery({
    queryKey: key(companyId),
    queryFn: () => settingsService.getAttendanceSettings(companyId ?? ''),
    enabled: !!companyId,
  });
}

export function useUpdateAttendanceSettings(companyId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AttendanceSettings) =>
      settingsService.updateAttendanceSettings(companyId ?? '', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(companyId) });
      // Late / early-out / overtime are derived from these settings, so recompute attendance views.
      qc.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}
