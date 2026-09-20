import { ClipboardCheck } from 'lucide-react';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { formatDateTime } from '@/utils/date';
import type { AttendanceRequest } from '@/types/request';
import { REQUEST_TYPE_LABEL, REQUEST_TYPE_VARIANT, requestDateLabel, requestSummary } from '../utils';

interface RequestsTableProps {
  requests: AttendanceRequest[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  onRowClick: (request: AttendanceRequest) => void;
  showSubCompany?: boolean;
  pageSize?: number;
  page: number;
  onPageChange: (page: number) => void;
  emptyTitle?: string;
}

export function RequestsTable({
  requests, loading, error, onRetry, onRowClick, showSubCompany, pageSize = 10, page, onPageChange, emptyTitle,
}: RequestsTableProps) {
  const columns: Column<AttendanceRequest>[] = [
    {
      key: 'employee', header: 'Employee',
      accessor: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={r.employeeName} size="xs" />
          <div>
            <p className="font-medium text-surface-900">{r.employeeName}</p>
            <p className="text-xs text-surface-400">{r.employeeCode}</p>
          </div>
        </div>
      ),
    },
    ...(showSubCompany
      ? [{ key: 'subCompany', header: 'Sub Company', accessor: (r: AttendanceRequest) => <span className="text-sm text-surface-600">{r.subCompanyName}</span> }]
      : []),
    { key: 'type', header: 'Type', width: '140px', accessor: (r) => <Badge variant={REQUEST_TYPE_VARIANT[r.type]} size="sm">{REQUEST_TYPE_LABEL[r.type]}</Badge> },
    { key: 'date', header: 'Date', accessor: (r) => <span className="text-sm whitespace-nowrap">{requestDateLabel(r)}</span> },
    { key: 'details', header: 'Details', accessor: (r) => <span className="text-sm text-surface-600">{requestSummary(r)}</span> },
    {
      key: 'requestedBy', header: 'Requested',
      accessor: (r) => (
        <div>
          <p className="text-sm text-surface-700">{r.requestedBy}</p>
          <p className="text-xs text-surface-400 whitespace-nowrap">{formatDateTime(r.requestedAt)}</p>
        </div>
      ),
    },
    { key: 'status', header: 'Status', width: '120px', accessor: (r) => <StatusBadge status={r.status} /> },
  ];

  const paged = requests.slice((page - 1) * pageSize, page * pageSize);

  return (
    <DataTable
      data={paged}
      columns={columns}
      keyExtractor={(r) => r.id}
      loading={loading}
      error={error ? 'Failed to load requests' : null}
      onRetry={onRetry}
      onRowClick={onRowClick}
      pagination={{
        page,
        totalPages: Math.max(1, Math.ceil(requests.length / pageSize)),
        total: requests.length,
        pageSize,
        onPageChange,
      }}
      emptyState={{ title: emptyTitle ?? 'No requests found', icon: <ClipboardCheck className="h-8 w-8" /> }}
    />
  );
}
