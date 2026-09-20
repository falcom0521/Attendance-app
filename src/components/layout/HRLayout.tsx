import { Building2, ChevronRight } from 'lucide-react';
import { AppLayout } from './AppLayout';
import { HR_NAV } from '@/config/navigation';
import { useAuthStore } from '@/store/authStore';

export function HRLayout() {
  const { user } = useAuthStore();

  const contextLabel = (
    <div className="hidden sm:flex items-center gap-1.5 text-sm text-surface-600 pl-2 border-l border-surface-200">
      <Building2 className="h-3.5 w-3.5 text-surface-400" />
      <span className="text-surface-500">{user?.companyName}</span>
      <ChevronRight className="h-3 w-3 text-surface-300" />
      <span className="font-medium text-surface-700">{user?.subCompanyName ?? 'Sub Company'}</span>
    </div>
  );

  return (
    <AppLayout
      navItems={HR_NAV}
      roleName="HR"
      contextLabel={contextLabel}
    />
  );
}
