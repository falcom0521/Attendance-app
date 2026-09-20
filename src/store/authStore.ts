import { create } from 'zustand';
import type { AuthUser } from '@/types/auth';
import { setActivityActor } from '@/services/mock/activityLog.service';

// Mock layer only: lets services attribute audit-log entries to the signed-in user.
function syncActor(user: AuthUser | null) {
  setActivityActor(
    user
      ? { id: user.id, name: `${user.firstName} ${user.lastName}`, role: user.role, companyId: user.companyId }
      : null
  );
}

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  updateUser: (patch: Partial<AuthUser>) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  hydrateFromStorage: () => void;
}

const STORAGE_KEY_USER = 'auth_user';
const STORAGE_KEY_TOKEN = 'auth_token';

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, token) => {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
    syncActor(user);
    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  // Applies profile edits to the signed-in user and keeps the stored session in sync.
  updateUser: (patch) =>
    set((state) => {
      if (!state.user) return state;
      const user = { ...state.user, ...patch };
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      syncActor(user);
      return { user };
    }),

  clearAuth: () => {
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    syncActor(null);
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  hydrateFromStorage: () => {
    try {
      const userStr = localStorage.getItem(STORAGE_KEY_USER);
      const token = localStorage.getItem(STORAGE_KEY_TOKEN);
      if (userStr && token) {
        const user = JSON.parse(userStr) as AuthUser;
        syncActor(user);
        set({ user, token, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
