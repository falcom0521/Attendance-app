import { useAuthStore } from '@/store/authStore';
import { authService } from '@/features/auth/services/auth.service';
import type { LoginCredentials } from '@/types/auth';

export function useAuth() {
  const { user, token, isAuthenticated, isLoading, setAuth, clearAuth } = useAuthStore();

  async function login(credentials: LoginCredentials) {
    const { user: authUser, token: authToken } = await authService.login(credentials);
    setAuth(authUser, authToken);
  }

  async function logout() {
    await authService.logout();
    clearAuth();
  }

  return { user, token, isAuthenticated, isLoading, login, logout };
}
