import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentService } from '@/services/mock';
import type { CreateDepartmentPayload } from '@/types/department';

export const departmentKeys = {
  all: ['departments'] as const,
  list: (companyId?: string) => [...departmentKeys.all, 'list', companyId] as const,
  detail: (id: string) => [...departmentKeys.all, 'detail', id] as const,
};

export function useDepartments(companyId?: string) {
  return useQuery({
    queryKey: departmentKeys.list(companyId),
    queryFn: () => departmentService.getDepartments(companyId),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDepartmentPayload) =>
      departmentService.createDepartment(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: departmentKeys.all });
    },
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CreateDepartmentPayload>;
    }) => departmentService.updateDepartment(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: departmentKeys.all });
    },
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => departmentService.deleteDepartment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: departmentKeys.all });
    },
  });
}

export function useToggleDepartmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => departmentService.toggleDepartmentStatus(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: departmentKeys.all });
    },
  });
}
