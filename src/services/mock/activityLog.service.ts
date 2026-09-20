import type { ActivityLog, ActivityLogFilters } from '@/types/activity';
import type { PaginatedResponse } from '@/types/common';
import { mockActivityLogs } from '@/mocks/data/activityLogs';
import { mockUsers } from '@/mocks/data/users';
import { mockSubCompanies } from '@/mocks/data/subCompanies';
import { sleep } from '@/lib/utils';

/**
 * Mock-layer audit trail. In Phase 2 the backend records these server-side from the
 * authenticated request, so nothing here needs to move — only `logActivity` calls disappear.
 */

export interface ActivityActor {
  id: string;
  name: string;
  role: string;
  companyId?: string;
}

let currentActor: ActivityActor | null = null;

export function getActivityActorName(): string {
  return currentActor?.name ?? 'System';
}

export function setActivityActor(actor: ActivityActor | null): void {
  currentActor = actor;
}

/** Seeded logs carry no company, so infer it from the target or the acting user. */
function inferCompanyId(log: ActivityLog): string | undefined {
  if (log.module === 'Companies') return log.targetId;
  if (log.module === 'Sub Companies') return mockSubCompanies.find((s) => s.id === log.targetId)?.companyId;
  return mockUsers.find((u) => u.id === log.userId)?.companyId;
}

const logs: ActivityLog[] = mockActivityLogs.map((l) => ({ ...l, companyId: inferCompanyId(l) }));
let counter = logs.length;

export interface LogEntry {
  action: string;
  module: string;
  target: string;
  targetId?: string;
  details?: string;
  companyId?: string;
}

/** Records an action by the signed-in user. A no-op when nobody is signed in (e.g. seeding). */
export function logActivity(entry: LogEntry): void {
  if (!currentActor) return;
  counter += 1;
  logs.unshift({
    id: `log-${String(counter).padStart(4, '0')}`,
    date: new Date().toISOString(),
    userId: currentActor.id,
    userName: currentActor.name,
    userRole: currentActor.role,
    action: entry.action,
    module: entry.module,
    target: entry.target,
    targetId: entry.targetId,
    details: entry.details ?? '',
    ipAddress: '127.0.0.1',
    companyId: entry.companyId ?? currentActor.companyId,
  });
}

function query(filters?: ActivityLogFilters): ActivityLog[] {
  const q = filters?.search?.toLowerCase();
  return logs
    .filter((l) => {
      if (filters?.module && l.module !== filters.module) return false;
      if (filters?.action && l.action !== filters.action) return false;
      if (filters?.role && l.userRole !== filters.role) return false;
      if (filters?.userId && l.userId !== filters.userId) return false;
      if (filters?.companyId && l.companyId !== filters.companyId) return false;
      if (filters?.startDate && l.date.slice(0, 10) < filters.startDate) return false;
      if (filters?.endDate && l.date.slice(0, 10) > filters.endDate) return false;
      if (q && !`${l.action} ${l.target} ${l.userName} ${l.details}`.toLowerCase().includes(q)) return false;
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export const activityLogService = {
  async getLogs(filters?: ActivityLogFilters): Promise<PaginatedResponse<ActivityLog>> {
    await sleep(300);
    const all = query(filters);
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 15;
    return {
      data: all.slice((page - 1) * pageSize, page * pageSize),
      total: all.length,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(all.length / pageSize)),
    };
  },
};

export function getRecentActivitySync(limit = 6): ActivityLog[] {
  return query().slice(0, limit);
}
