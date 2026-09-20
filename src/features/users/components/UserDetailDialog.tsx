import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { DetailRow } from '@/components/common/DetailRow';
import { useActivityLogs } from '@/features/activity-logs/hooks/useActivityLogs';
import { ACTION_VARIANT } from '@/features/activity-logs/constants';
import { formatDate, formatDateTime } from '@/utils/date';
import { ROLE_LABELS } from '@/config/permissions';
import type { AppUser } from '@/types/user';

const ROLE_VARIANT: Record<string, 'brand' | 'info' | 'success' | 'warning'> = { SUPER_ADMIN: 'brand', SUPER_ADMIN_VIEWER: 'warning', ADMIN: 'info', HR: 'success' };

interface Props {
  user: AppUser | null;
  onClose: () => void;
  /** Shown as an action in the footer (e.g. open the edit form). */
  onEdit?: (user: AppUser) => void;
}

export function UserDetailDialog({ user, onClose, onEdit }: Props) {
  const { data: activity } = useActivityLogs(user ? { userId: user.id, pageSize: 5 } : undefined);
  if (!user) return null;

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {onEdit && <Button onClick={() => onEdit(user)}>Edit User</Button>}
        </>
      }
    >
      <div className="flex items-center gap-4 mb-4">
        <Avatar name={user.fullName} size="lg" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-surface-900">{user.fullName}</h3>
            <Badge variant={ROLE_VARIANT[user.role] ?? 'surface'} size="sm">{ROLE_LABELS[user.role] ?? user.role}</Badge>
            <StatusBadge status={user.status} />
          </div>
          <p className="text-sm text-surface-500">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
        <div>
          <DetailRow label="Username" value={<span className="font-mono text-xs">{user.username}</span>} />
          <DetailRow label="Phone" value={user.phone} />
          <DetailRow label="Company" value={user.companyName} />
          <DetailRow label="Sub company" value={user.subCompanyName} />
        </div>
        <div>
          <DetailRow label="Last login" value={user.lastLogin ? formatDateTime(user.lastLogin) : undefined} />
          <DetailRow label="Created" value={formatDate(user.createdAt)} />
          <DetailRow label="Last updated" value={formatDate(user.updatedAt)} />
        </div>
      </div>

      <h4 className="text-sm font-semibold text-surface-700 mt-5 mb-2">Recent activity</h4>
      {(activity?.data ?? []).length === 0 ? (
        <p className="text-sm text-surface-400 py-3">No recorded activity for this user.</p>
      ) : (
        <ul className="divide-y divide-surface-50 border border-surface-100 rounded-xl overflow-hidden">
          {activity?.data.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm text-surface-800 truncate">{l.module} · {l.target}</p>
                <p className="text-xs text-surface-400">{formatDateTime(l.date)}</p>
              </div>
              <Badge variant={ACTION_VARIANT[l.action] ?? 'surface'} size="sm" label={l.action} />
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
