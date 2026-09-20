import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requestService } from '@/services/mock';
import { attendanceKeys } from '@/features/attendance/hooks/useAttendance';
import type { CreateRequestPayload, RequestActor, RequestFilters } from '@/types/request';

export const requestKeys = {
  all: ['requests'] as const,
  list: (filters?: RequestFilters) => [...requestKeys.all, 'list', filters] as const,
  balances: (params?: unknown) => [...requestKeys.all, 'balances', params] as const,
};

export function useRequests(filters?: RequestFilters) {
  return useQuery({
    queryKey: requestKeys.list(filters),
    queryFn: () => requestService.getRequests(filters),
  });
}

export function useLeaveBalances(params: { companyId?: string; subCompanyId?: string; year?: number; search?: string }) {
  return useQuery({
    queryKey: requestKeys.balances(params),
    queryFn: () => requestService.getLeaveBalances(params),
  });
}

// Approving / raising a request can change attendance records, so both caches are refreshed.
function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: requestKeys.all });
    qc.invalidateQueries({ queryKey: attendanceKeys.all });
  };
}

export function useCreateRequest() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ payload, actor }: { payload: CreateRequestPayload; actor: RequestActor }) =>
      requestService.createRequest(payload, actor),
    onSuccess: invalidate,
  });
}

export function useReviewRequest() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (args: { id: string; decision: 'APPROVED' | 'REJECTED'; comment: string; reviewer: RequestActor }) =>
      requestService.reviewRequest(args.id, args.decision, args.comment, args.reviewer),
    onSuccess: invalidate,
  });
}

export function useCancelRequest() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, actor }: { id: string; actor: RequestActor }) => requestService.cancelRequest(id, actor),
    onSuccess: invalidate,
  });
}
