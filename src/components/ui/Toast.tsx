import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const typeStyles: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: {
    bg: 'bg-emerald-50',
    border: 'border-l-emerald-500',
    icon: '✓',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-l-red-500',
    icon: '✕',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-l-amber-500',
    icon: '⚠',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-l-blue-500',
    icon: 'ℹ',
  },
};

const durationMap: Record<ToastType, number> = {
  success: 3000,
  error: 5000,
  warning: 4000,
  info: 3000,
};

let toastId = 0;
const recentMessages = new Map<string, number>();

export function toast(type: ToastType, message: string) {
  const now = Date.now();
  const key = `${type}:${message}`;
  const lastTime = recentMessages.get(key);
  if (lastTime && now - lastTime < 3000) return;
  recentMessages.set(key, now);

  window.dispatchEvent(
    new CustomEvent('toast:add', {
      detail: { id: ++toastId, type, message, duration: durationMap[type] },
    }),
  );
}

toast.success = (message: string) => toast('success', message);
toast.error = (message: string) => toast('error', message);
toast.warning = (message: string) => toast('warning', message);
toast.info = (message: string) => toast('info', message);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as ToastItem;
      setToasts((prev) => [...prev.slice(-2), detail]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== detail.id));
      }, detail.duration);
    };
    window.addEventListener('toast:add', handler);
    return () => window.removeEventListener('toast:add', handler);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const ctxValue: ToastContextValue = {
    success: toast.success,
    error: toast.error,
    warning: toast.warning,
    info: toast.info,
  };

  return (
    <ToastContext.Provider value={ctxValue}>
      {children}
      <div className="fixed top-[72px] right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => {
          const style = typeStyles[t.type];
          return (
            <div
              key={t.id}
              role="status"
              aria-live="polite"
              className={`pointer-events-auto flex items-center gap-3 ${style.bg} border-l-4 ${style.border} rounded-lg shadow-modal px-4 py-3 max-w-[400px] animate-slide-up`}
            >
              <span className="text-sm flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full">
                {style.icon}
              </span>
              <span className="text-sm text-gray-900 flex-1">{t.message}</span>
              <button
                onClick={() => removeToast(t.id)}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <path d="M4.646 4.646a.5.5 0 01.708 0L7 6.293l1.646-1.647a.5.5 0 11.708.708L7.707 7l1.647 1.646a.5.5 0 01-.708.708L7 7.707 5.354 9.354a.5.5 0 01-.708-.708L6.293 7 4.646 5.354a.5.5 0 010-.708z" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
