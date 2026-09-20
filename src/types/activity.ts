export type ActivityAction =
  | 'CREATED'
  | 'UPDATED'
  | 'DELETED'
  | 'ACTIVATED'
  | 'DEACTIVATED'
  | 'ALLOCATED'
  | 'DEALLOCATED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export interface ActivityLog {
  id: string;
  date: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  target: string;
  targetId?: string;
  details: string;
  ipAddress: string;
  /** Company the action belongs to, so a company's page can show only its own activity. */
  companyId?: string;
}

export interface ActivityLogFilters {
  module?: string;
  action?: string;
  role?: string;
  userId?: string;
  companyId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}
