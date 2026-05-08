import { create } from 'zustand';

export type DesignSystem = 'github' | 'claude' | 'apple';
export type ColorMode = 'light' | 'dark' | 'system';

const DS_KEY = 'vibeDev:design-system';
const MODE_KEY = 'vibeDev:mode';

function getStoredDesignSystem(): DesignSystem {
  try {
    const stored = localStorage.getItem(DS_KEY);
    if (stored === 'github' || stored === 'claude' || stored === 'apple') return stored;
  } catch { /* storage blocked */ }
  return 'github';
}

function getStoredMode(): ColorMode {
  try {
    const stored = localStorage.getItem(MODE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch { /* storage blocked */ }
  return 'system';
}

function resolveMode(mode: ColorMode): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

function applyDesignSystem(ds: DesignSystem) {
  document.documentElement.setAttribute('data-theme', ds);
}

function applyMode(resolved: 'light' | 'dark') {
  const el = document.documentElement;
  if (resolved === 'dark') {
    el.classList.add('dark');
  } else {
    el.classList.remove('dark');
  }
}

interface ThemeState {
  designSystem: DesignSystem;
  mode: ColorMode;
  resolvedMode: 'light' | 'dark';
  setDesignSystem: (ds: DesignSystem) => void;
  setMode: (mode: ColorMode) => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  const designSystem = getStoredDesignSystem();
  const mode = getStoredMode();
  const resolvedMode = resolveMode(mode);

  applyDesignSystem(designSystem);
  applyMode(resolvedMode);

  return {
    designSystem,
    mode,
    resolvedMode,
    setDesignSystem: (ds: DesignSystem) => {
      try {
        localStorage.setItem(DS_KEY, ds);
      } catch { /* storage blocked */ }
      applyDesignSystem(ds);
      set({ designSystem: ds });
    },
    setMode: (mode: ColorMode) => {
      try {
        localStorage.setItem(MODE_KEY, mode);
      } catch { /* storage blocked */ }
      const next = resolveMode(mode);
      applyMode(next);
      set({ mode, resolvedMode: next });
    },
  };
});

// Listen for system preference changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const { mode, setMode } = useThemeStore.getState();
    if (mode === 'system') {
      setMode('system');
    }
  });
}

// E2E helper
if (typeof window !== 'undefined') {
  (window as any).__themeStore = useThemeStore;
}
