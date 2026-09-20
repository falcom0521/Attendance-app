import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '@/services/mock';
import type { CreateCompanyPayload, CreateSubCompanyPayload } from '@/types/company';
import type { PaginationParams, FilterParams } from '@/types/common';

export const companyKeys = {
  all: ['companies'] as const,
  list: (params?: PaginationParams & FilterParams) => [...companyKeys.all, 'list', params] as const,
  detail: (id: string) => [...companyKeys.all, 'detail', id] as const,
  subCompanies: ['subCompanies'] as const,
  subList: (params?: unknown) => [...companyKeys.subCompanies, 'list', params] as const,
  subDetail: (id: string) => [...companyKeys.subCompanies, 'detail', id] as const,
  subByCompany: (companyId: string) => [...companyKeys.subCompanies, 'byCompany', companyId] as const,
};

export function useCompanies(params?: PaginationParams & FilterParams) {
  return useQuery({
    queryKey: companyKeys.list(params),
    queryFn: () => companyService.getCompanies(params),
  });
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: companyKeys.detail(id),
    queryFn: () => companyService.getCompanyById(id),
    enabled: !!id,
  });
}

export function useSubCompanies(params?: PaginationParams & FilterParams & { companyId?: string }) {
  return useQuery({
    queryKey: companyKeys.subList(params),
    queryFn: () => companyService.getSubCompanies(params),
  });
}

export function useSubCompany(id: string) {
  return useQuery({
    queryKey: companyKeys.subDetail(id),
    queryFn: () => companyService.getSubCompanyById(id),
    enabled: !!id,
  });
}

export function useSubCompaniesByCompany(companyId: string) {
  return useQuery({
    queryKey: companyKeys.subByCompany(companyId),
    queryFn: () => companyService.getSubCompaniesByCompany(companyId),
    enabled: !!companyId,
  });
}

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCompanyPayload) => companyService.createCompany(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: companyKeys.all }); },
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateCompanyPayload> }) =>
      companyService.updateCompany(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: companyKeys.all }); },
  });
}

export function useToggleCompanyStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => companyService.toggleCompanyStatus(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: companyKeys.all }); },
  });
}

export function useCreateSubCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSubCompanyPayload) => companyService.createSubCompany(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: companyKeys.subCompanies }); },
  });
}

export function useUpdateSubCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateSubCompanyPayload> }) =>
      companyService.updateSubCompany(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: companyKeys.subCompanies }); },
  });
}

export function useToggleSubCompanyStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => companyService.toggleSubCompanyStatus(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: companyKeys.subCompanies }); },
  });
}
