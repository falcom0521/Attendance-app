import { Building2, ChevronRight, Eye } from 'lucide-react';
import { AppLayout } from './AppLayout';
import { SUPER_ADMIN_NAV } from '@/config/navigation';
import { useAuthStore } from '@/store/authStore';

export function SuperAdminLayout() {
  const { user } = useAuthStore();
  const readOnly = user?.role === 'SUPER_ADMIN_VIEWER';

  const contextLabel = (
    <div className="hidden sm:flex items-center gap-1.5 text-sm text-surface-600 pl-2 border-l border-surface-200">
      <Building2 className="h-3.5 w-3.5 text-surface-400" />
      <span className="text-surface-400">Platform</span>
      <ChevronRight className="h-3 w-3 text-surface-300" />
      <span className="font-medium text-surface-700">All Companies</span>
      {readOnly && (
        <span
          className="ml-2 inline-flex items-center gap-1 rounded-full bg-warning-50 px-2.5 py-0.5 text-xs font-medium text-warning-700 ring-1 ring-inset ring-warning-600/20"
          title="You can view everything but cannot make changes"
        >
          <Eye className="h-3 w-3" />
          Read-only
        </span>
      )}
    </div>
  );

  return (
    <AppLayout
      navItems={SUPER_ADMIN_NAV}
      roleName={readOnly ? 'Super Admin · Read-only' : 'Super Admin'}
      contextLabel={contextLabel}
    />
  );
}
