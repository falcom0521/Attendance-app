import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useSubCompaniesByCompany } from '@/features/companies/hooks/useCompanies';
import type { SubCompany } from '@/types/company';

export interface SubCompanyScope {
  isAdmin: boolean;
  companyId?: string;
  /** HR: their sub-company. Admin: the topbar selection, or undefined when viewing all. */
  subCompanyId?: string;
  /** Sub-companies the user can pick between (Admin only; empty for HR). */
  subCompanies: SubCompany[];
  /** True when an Admin is looking across sub-companies, so rows should say which one they belong to. */
  showSubCompany: boolean;
  basePath: string;
}

/**
 * Companies own no employees — sub-companies do. HR is pinned to one sub-company; Admin sees every
 * sub-company of their company and can narrow to one with the topbar selector.
 */
export function useSubCompanyScope(): SubCompanyScope {
  const { user } = useAuthStore();
  const { selectedSubCompanyId } = useUIStore();
  const isAdmin = user?.role === 'ADMIN';
  const { data: subCompanies = [] } = useSubCompaniesByCompany(isAdmin ? (user?.companyId ?? '') : '');

  const subCompanyId = isAdmin ? selectedSubCompanyId || undefined : user?.subCompanyId;

  return {
    isAdmin,
    companyId: user?.companyId,
    subCompanyId,
    subCompanies,
    showSubCompany: isAdmin && !subCompanyId,
    basePath: isAdmin ? '/admin' : '/hr',
  };
}
