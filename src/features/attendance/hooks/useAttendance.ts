import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService, manualAttendanceService } from '@/services/mock';
import type { AttendanceFilters } from '@/types/attendance';
import type { ManualAttendancePayload } from '@/services/mock';

export const attendanceKeys = {
  all: ['attendance'] as const,
  daily: (filters?: AttendanceFilters) => [...attendanceKeys.all, 'daily', filters] as const,
  monthly: (filters?: AttendanceFilters) => [...attendanceKeys.all, 'monthly', filters] as const,
  record: (employeeId: string, date: string) => [...attendanceKeys.all, 'record', employeeId, date] as const,
  manualEntry: (empId: string, date: string) => [...attendanceKeys.all, 'manualEntry', empId, date] as const,
  employeeMonthly: (empId: string, month: number, year: number) =>
    [...attendanceKeys.all, 'empMonthly', empId, month, year] as const,
};

export function useDailyAttendance(filters?: AttendanceFilters) {
  return useQuery({
    queryKey: attendanceKeys.daily(filters),
    queryFn: () => attendanceService.getDailyAttendance(filters),
    staleTime: 1000 * 60 * 2,
  });
}

export function useMonthlyAttendance(filters: AttendanceFilters) {
  return useQuery({
    queryKey: attendanceKeys.monthly(filters),
    queryFn: () => attendanceService.getMonthlyAttendance(filters),
    enabled: !!(filters.month && filters.year),
  });
}

export function useAttendanceRecord(employeeId: string, date: string) {
  return useQuery({
    queryKey: attendanceKeys.record(employeeId, date),
    queryFn: () => attendanceService.getAttendanceRecord(employeeId, date),
    enabled: !!(employeeId && date),
  });
}

export function useEmployeeMonthlyAttendance(employeeId: string, month: number, year: number) {
  return useQuery({
    queryKey: attendanceKeys.employeeMonthly(employeeId, month, year),
    queryFn: () => attendanceService.getEmployeeMonthlyAttendance(employeeId, month, year),
    enabled: !!(employeeId && month && year),
  });
}

export function useManualEntry(employeeId: string, date: string, enabled = true) {
  return useQuery({
    queryKey: attendanceKeys.manualEntry(employeeId, date),
    queryFn: () => manualAttendanceService.getManualEntry(employeeId, date),
    enabled: enabled && !!(employeeId && date),
  });
}

export function useSaveManualAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, edit }: { payload: ManualAttendancePayload; edit: boolean }) =>
      edit
        ? manualAttendanceService.updateManualAttendance(payload)
        : manualAttendanceService.addManualAttendance(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: attendanceKeys.all }); },
  });
}

export function useDeleteManualAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, date }: { employeeId: string; date: string }) =>
      manualAttendanceService.deleteManualAttendance(employeeId, date),
    onSuccess: () => { qc.invalidateQueries({ queryKey: attendanceKeys.all }); },
  });
}
