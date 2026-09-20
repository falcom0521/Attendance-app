import { useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToastContext, type ToastType, type ToastItem } from './ToastContext';

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4 text-success-500" />,
  error: <XCircle className="h-4 w-4 text-danger-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-warning-500" />,
  info: <Info className="h-4 w-4 text-info-500" />,
};

const borderMap: Record<ToastType, string> = {
  success: 'border-l-success-500',
  error: 'border-l-danger-500',
  warning: 'border-l-warning-500',
  info: 'border-l-info-500',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, title: string, message?: string) => {
      const id = `toast-${Date.now()}`;
      setToasts((prev) => [...prev, { id, type, title, message }]);
      setTimeout(() => removeToast(id), 4000);
    },
    [removeToast]
  );

  const toast = {
    success: (title: string, message?: string) => addToast('success', title, message),
    error: (title: string, message?: string) => addToast('error', title, message),
    warning: (title: string, message?: string) => addToast('warning', title, message),
    info: (title: string, message?: string) => addToast('info', title, message),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto bg-card rounded-xl shadow-soft-lg border border-surface-100 border-l-4 p-4',
              'flex items-start gap-3 animate-slide-up',
              borderMap[t.type]
            )}
            role="alert"
          >
            <div className="flex-shrink-0 mt-0.5">{iconMap[t.type]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-surface-900">{t.title}</p>
              {t.message && (
                <p className="text-xs text-surface-500 mt-0.5">{t.message}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="flex-shrink-0 text-surface-400 hover:text-surface-600 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
