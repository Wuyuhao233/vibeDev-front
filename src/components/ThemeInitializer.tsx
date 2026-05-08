import { useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';

export default function ThemeInitializer() {
  const setTheme = useThemeStore((s) => s.setTheme);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const { theme } = useThemeStore.getState();
      if (theme === 'system') {
        setTheme('system');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [setTheme]);

  return null;
}
