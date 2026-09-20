import { create } from 'zustand';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'attendanceiq-theme';

function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function savedTheme(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'dark' || v === 'light' ? v : null;
  } catch {
    return null; // storage can be blocked (private mode); fall back to the system preference
  }
}

/** Adds / removes the `dark` class on <html>; Tailwind's `dark:` variants and the CSS variables key off it. */
function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
}

interface ThemeStore {
  theme: Theme;
  /** True once the user has picked a theme themselves; until then the OS setting is followed. */
  explicit: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const initialSaved = savedTheme();
const initialTheme = initialSaved ?? systemTheme();
applyTheme(initialTheme);

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: initialTheme,
  explicit: initialSaved !== null,

  setTheme: (theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* not persisted, still applied for this session */
    }
    applyTheme(theme);
    set({ theme, explicit: true });
  },

  toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
}));

// Follow the OS light/dark switch until the user has chosen a theme explicitly.
window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (useThemeStore.getState().explicit) return;
  const theme: Theme = e.matches ? 'dark' : 'light';
  applyTheme(theme);
  useThemeStore.setState({ theme });
});
