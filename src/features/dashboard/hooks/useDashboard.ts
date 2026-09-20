import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/mock';

export const dashboardKeys = {
  superAdmin: ['dashboard', 'superAdmin'] as const,
  admin: (companyId: string) => ['dashboard', 'admin', companyId] as const,
  hr: (subCompanyId: string) => ['dashboard', 'hr', subCompanyId] as const,
};

export function useSuperAdminDashboard() {
  return useQuery({
    queryKey: dashboardKeys.superAdmin,
    queryFn: () => dashboardService.getSuperAdminDashboard(),
    staleTime: 0, // derived from live data, so refetch whenever the dashboard is opened
  });
}

export function useAdminDashboard(companyId: string, subCompanyId?: string) {
  return useQuery({
    queryKey: dashboardKeys.admin(companyId + (subCompanyId ?? '')),
    queryFn: () => dashboardService.getAdminDashboard(companyId, subCompanyId),
    enabled: !!companyId,
    staleTime: 0, // derived from live data, so refetch whenever the dashboard is opened
  });
}

export function useHRDashboard(subCompanyId: string) {
  return useQuery({
    queryKey: dashboardKeys.hr(subCompanyId),
    queryFn: () => dashboardService.getHRDashboard(subCompanyId),
    enabled: !!subCompanyId,
    staleTime: 0, // derived from live data, so refetch whenever the dashboard is opened
  });
}
