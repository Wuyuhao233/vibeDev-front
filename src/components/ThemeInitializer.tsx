import { useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';

export default function ThemeInitializer() {
  const setMode = useThemeStore((s) => s.setMode);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const { mode } = useThemeStore.getState();
      if (mode === 'system') {
        setMode('system');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [setMode]);

  return null;
}
