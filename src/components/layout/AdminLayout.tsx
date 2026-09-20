import { useEffect } from 'react';
import { AppLayout } from './AppLayout';
import { ADMIN_NAV } from '@/config/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { SubCompanySelector } from './SubCompanySelector';

export function AdminLayout() {
  const { user } = useAuthStore();
  const { setSelectedSubCompany } = useUIStore();

  // Reset selection when Admin mounts (e.g. fresh login)
  useEffect(() => {
    setSelectedSubCompany('');
  }, [setSelectedSubCompany]);

  const contextLabel = user?.companyId ? (
    <SubCompanySelector
      companyId={user.companyId}
      companyName={user.companyName ?? 'Company'}
    />
  ) : null;

  return (
    <AppLayout
      navItems={ADMIN_NAV}
      roleName="Admin"
      contextLabel={contextLabel}
    />
  );
}
