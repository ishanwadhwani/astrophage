"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  //   useRef,
} from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};

const icons: Record<ToastType, React.ReactNode> = {
  success: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22,4 12,14.01 9,11.01" />
    </svg>
  ),
  error: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  warning: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
};

const styles: Record<ToastType, { wrap: string; icon: string }> = {
  success: {
    wrap: "bg-card border-status-paid-foreground/20",
    icon: "bg-status-paid text-status-paid-foreground",
  },
  error: {
    wrap: "bg-card border-destructive/20",
    icon: "bg-destructive/10 text-destructive",
  },
  warning: {
    wrap: "bg-card border-status-pending-foreground/20",
    icon: "bg-status-pending text-status-pending-foreground",
  },
  info: {
    wrap: "bg-card border-primary/20",
    icon: "bg-primary/10 text-primary",
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirm, setConfirmState] = useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, title: string, message?: string) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev.slice(-4), { id, type, title, message }]);
      setTimeout(() => removeToast(id), 4000);
    },
    [removeToast],
  );

  const value: ToastContextValue = {
    toast: addToast,
    success: (t, m) => addToast("success", t, m),
    error: (t, m) => addToast("error", t, m),
    warning: (t, m) => addToast("warning", t, m),
    info: (t, m) => addToast("info", t, m),
    confirm: (options) =>
      new Promise((resolve) => {
        setConfirmState({ options, resolve });
      }),
  };

  const handleConfirm = (result: boolean) => {
    confirm?.resolve(result);
    setConfirmState(null);
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast stack */}
      <div className="fixed bottom-6 right-6 z-100 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`
              flex items-start gap-3 px-4 py-3.5 rounded-xl
              border shadow-lg pointer-events-auto
              animate-in slide-in-from-right-4 fade-in duration-200
              min-w-72 max-w-sm
              ${styles[t.type].wrap}
            `}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${styles[t.type].icon}`}
            >
              {icons[t.type]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{t.title}</p>
              {t.message && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t.message}
                </p>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-muted-foreground hover:text-foreground transition shrink-0 mt-0.5"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Confirm dialog */}
      {confirm && (
        <>
          <div className="fixed inset-0 z-200 bg-black/40 backdrop-blur-sm" />
          <div className="fixed inset-0 z-201 flex items-center justify-center p-6">
            <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-sm p-6">
              <h3 className="text-base font-semibold text-foreground mb-2">
                {confirm.options.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {confirm.options.message}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleConfirm(false)}
                  className="flex-1 py-2.5 border border-border text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted transition"
                >
                  {confirm.options.cancelText ?? "Cancel"}
                </button>
                <button
                  onClick={() => handleConfirm(true)}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition ${
                    confirm.options.danger
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {confirm.options.confirmText ?? "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </ToastContext.Provider>
  );
}
