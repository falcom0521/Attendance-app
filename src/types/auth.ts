/**
 * SUPER_ADMIN_VIEWER is a read-only Super Admin: it can see everything a Super Admin can,
 * but cannot create, edit, deactivate, allocate or delete anything. Only a SUPER_ADMIN creates one.
 */
export type UserRole = 'SUPER_ADMIN' | 'SUPER_ADMIN_VIEWER' | 'ADMIN' | 'HR';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyId?: string;
  subCompanyId?: string;
  companyName?: string;
  subCompanyName?: string;
  avatarUrl?: string;
  isActive: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}
