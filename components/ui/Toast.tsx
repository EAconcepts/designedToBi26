'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

interface ToastContextValue {
  showToast: (
    message: string,
    opts?: { title?: string; type?: 'success' | 'error' | 'info' },
  ) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (message: string, opts?: { title?: string; type?: 'success' | 'error' | 'info' }) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [
        ...prev,
        { id, message, title: opts?.title, type: opts?.type ?? 'info' },
      ]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto rounded-xl p-4 shadow-lg border backdrop-blur-md transition-all ${
              toast.type === 'error'
                ? 'bg-magenta-800 text-white border-magenta-600'
                : toast.type === 'success'
                  ? 'bg-ink-900 text-ivory border-gold-500'
                  : 'bg-white/95 text-ink-900 border-gold-500'
            }`}
          >
            {toast.title && <div className="font-semibold text-sm mb-1">{toast.title}</div>}
            <div className="text-sm font-normal">{toast.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
