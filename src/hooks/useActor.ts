import { useAuthStore } from '@/store/authStore';
import type { RequestActor } from '@/types/request';

/** The signed-in user as the audit identity recorded on requests and manual entries. */
export function useActor(): RequestActor | null {
  const { user } = useAuthStore();
  if (!user) return null;
  return { id: user.id, name: `${user.firstName} ${user.lastName}`, role: user.role };
}
