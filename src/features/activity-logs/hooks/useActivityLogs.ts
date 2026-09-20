import { useQuery } from '@tanstack/react-query';
import { activityLogService } from '@/services/mock';
import type { ActivityLogFilters } from '@/types/activity';

export const activityKeys = {
  all: ['activityLogs'] as const,
  list: (filters?: ActivityLogFilters) => [...activityKeys.all, 'list', filters] as const,
};

export function useActivityLogs(filters?: ActivityLogFilters) {
  return useQuery({
    queryKey: activityKeys.list(filters),
    queryFn: () => activityLogService.getLogs(filters),
    // Logs are written by every mutation, so always refetch when the page is opened.
    staleTime: 0,
    placeholderData: (prev) => prev,
  });
}
