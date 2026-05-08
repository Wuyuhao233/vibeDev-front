import { useState, useRef, useEffect } from 'react';
import { Palette, Sun, Moon, Check } from 'lucide-react';
import { useThemeStore, type DesignSystem } from '../store/themeStore';

const themes: { key: DesignSystem; label: string; desc: string; preview: { primary: string; bg: string } }[] = [
  {
    key: 'github',
    label: 'GitHub',
    desc: '经典开发风格',
    preview: { primary: '#2da44e', bg: '#f9fafb' },
  },
  {
    key: 'claude',
    label: 'Claude',
    desc: '温暖人文风格',
    preview: { primary: '#cc785c', bg: '#faf9f5' },
  },
  {
    key: 'apple',
    label: 'Apple',
    desc: '简洁现代风格',
    preview: { primary: '#0066cc', bg: '#ffffff' },
  },
];

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { designSystem, resolvedMode, setDesignSystem, setMode } = useThemeStore();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isDark = resolvedMode === 'dark';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelectDesign = (ds: DesignSystem) => {
    setDesignSystem(ds);
  };

  const handleToggleMode = () => {
    setMode(isDark ? 'light' : 'dark');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 ${className}`}
        aria-label="打开主题设置"
        title="主题设置"
      >
        <Palette className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-card rounded-lg shadow-modal border border-border py-3 px-3 z-dropdown animate-fade-in">
          <p className="text-sm font-medium text-foreground mb-2 px-1">主题设置</p>

          {/* Design system cards */}
          <div className="flex gap-2 mb-3">
            {themes.map((t) => {
              const active = designSystem === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => handleSelectDesign(t.key)}
                  className={`flex-1 flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all duration-150 ${
                    active
                      ? 'border-primary bg-[var(--color-bg-active)]'
                      : 'border-border hover:border-primary/40 hover:bg-muted'
                  }`}
                >
                  {/* Color preview swatches */}
                  <div className="flex gap-1">
                    <span
                      className="w-4 h-4 rounded-full border border-border"
                      style={{ backgroundColor: t.preview.primary }}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-border"
                      style={{ backgroundColor: t.preview.bg }}
                    />
                  </div>
                  <span className="text-xs font-medium text-foreground leading-none">{t.label}</span>
                  {active && <Check className="w-3 h-3 text-primary" />}
                </button>
              );
            })}
          </div>

          <div className="border-t border-border pt-2">
            <button
              onClick={handleToggleMode}
              className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-md text-sm text-foreground hover:bg-muted transition-colors duration-150"
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>亮色模式</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-500" />
                  <span>暗色模式</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
