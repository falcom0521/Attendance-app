import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '@/services/mock';
import type { CreateEmployeePayload } from '@/types/employee';
import type { PaginationParams, FilterParams } from '@/types/common';

export const employeeKeys = {
  all: ['employees'] as const,
  list: (params?: unknown) => [...employeeKeys.all, 'list', params] as const,
  detail: (id: string) => [...employeeKeys.all, 'detail', id] as const,
  bySubCompany: (subCompanyId: string) => [...employeeKeys.all, 'bySubCompany', subCompanyId] as const,
};

interface EmployeeFilters extends PaginationParams, FilterParams {
  companyId?: string;
  subCompanyId?: string;
  department?: string;
  shiftId?: string;
}

export function useEmployees(params?: EmployeeFilters) {
  return useQuery({
    queryKey: employeeKeys.list(params),
    queryFn: () => employeeService.getEmployees(params),
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: () => employeeService.getEmployeeById(id),
    enabled: !!id,
  });
}

export function useEmployeesBySubCompany(subCompanyId: string) {
  return useQuery({
    queryKey: employeeKeys.bySubCompany(subCompanyId),
    queryFn: () => employeeService.getEmployeesBySubCompany(subCompanyId),
    enabled: !!subCompanyId,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEmployeePayload) => employeeService.createEmployee(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: employeeKeys.all }); },
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateEmployeePayload> }) =>
      employeeService.updateEmployee(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: employeeKeys.all }); },
  });
}

export function useToggleEmployeeStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeeService.toggleEmployeeStatus(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: employeeKeys.all }); },
  });
}
