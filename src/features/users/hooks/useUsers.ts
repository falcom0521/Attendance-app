import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/mock';
import type { CreateUserPayload } from '@/types/user';
import type { PaginationParams, FilterParams } from '@/types/common';

export const userKeys = {
  all: ['users'] as const,
  list: (params?: unknown) => [...userKeys.all, 'list', params] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
};

interface UserFilters extends PaginationParams, FilterParams {
  companyId?: string;
  role?: string;
}

export function useUsers(params?: UserFilters) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => userService.getUsers(params),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userService.getUserById(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => userService.createUser(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: userKeys.all }); },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateUserPayload> }) =>
      userService.updateUser(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: userKeys.all }); },
  });
}

export function useToggleUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userService.toggleUserStatus(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: userKeys.all }); },
  });
}
