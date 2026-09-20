import { ScrollText } from 'lucide-react';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime } from '@/utils/date';
import { ACTION_VARIANT } from '../constants';
import type { ActivityLog } from '@/types/activity';

interface Props {
  logs: ActivityLog[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  pagination?: { page: number; totalPages: number; total: number; pageSize: number; onPageChange: (p: number) => void };
  search?: { value: string; onChange: (v: string) => void };
  /** Hide the IP column in compact embeds (e.g. inside a company page). */
  compact?: boolean;
}

export function ActivityLogTable({ logs, loading, error, onRetry, pagination, search, compact }: Props) {
  const columns: Column<ActivityLog>[] = [
    { key: 'date', header: 'Date & Time', width: '170px', accessor: (r) => <span className="text-xs text-surface-600 whitespace-nowrap">{formatDateTime(r.date)}</span> },
    {
      key: 'user', header: 'User',
      accessor: (r) => (
        <div>
          <p className="font-medium text-sm text-surface-900 whitespace-nowrap">{r.userName}</p>
          <p className="text-xs text-surface-400">{r.userRole.replace('_', ' ')}</p>
        </div>
      ),
    },
    { key: 'action', header: 'Action', width: '120px', accessor: (r) => <Badge variant={ACTION_VARIANT[r.action] ?? 'surface'} label={r.action} size="sm" /> },
    { key: 'module', header: 'Module', width: '130px', accessor: (r) => <span className="text-sm font-medium">{r.module}</span> },
    { key: 'target', header: 'Target', accessor: (r) => <span className="text-sm">{r.target}</span> },
    { key: 'details', header: 'Details', accessor: (r) => <span className="text-xs text-surface-500">{r.details || '—'}</span> },
    ...(compact
      ? []
      : [{ key: 'ip', header: 'IP Address', width: '120px', accessor: (r: ActivityLog) => <span className="font-mono text-xs text-surface-400">{r.ipAddress}</span> }]),
  ];

  return (
    <DataTable
      data={logs}
      columns={columns}
      keyExtractor={(r) => r.id}
      loading={loading}
      error={error ? 'Failed to load activity logs' : null}
      onRetry={onRetry}
      searchable={!!search}
      searchValue={search?.value}
      onSearchChange={search?.onChange}
      searchPlaceholder="Search logs..."
      pagination={pagination}
      emptyState={{ title: 'No activity found', icon: <ScrollText className="h-8 w-8" /> }}
    />
  );
}
