import { create } from 'zustand';

export type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'vibeDev:theme';

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch { /* storage blocked */ }
  return 'system';
}

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

function applyTheme(resolved: ResolvedTheme) {
  const el = document.documentElement;
  if (resolved === 'dark') {
    el.classList.add('dark');
  } else {
    el.classList.remove('dark');
  }
}

interface ThemeState {
  theme: Theme;
  resolved: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initial = getStoredTheme();
  const resolved = resolveTheme(initial);
  applyTheme(resolved);

  return {
    theme: initial,
    resolved,
    setTheme: (theme: Theme) => {
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch { /* storage blocked */ }
      const next = resolveTheme(theme);
      applyTheme(next);
      set({ theme, resolved: next });
    },
  };
});

// Listen for system preference changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const { theme, setTheme } = useThemeStore.getState();
    if (theme === 'system') {
      setTheme('system');
    }
  });
}

// E2E helper
if (typeof window !== 'undefined') {
  (window as any).__themeStore = useThemeStore;
}
