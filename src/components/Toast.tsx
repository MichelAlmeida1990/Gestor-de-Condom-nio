import { useEffect, useState, createContext, useContext, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { CheckCircle, AlertCircle, X, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++counter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const remove = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-bottom-4 fade-in duration-300 min-w-[280px] max-w-sm"
            style={{
              background: t.type === "success" ? "rgba(16,185,129,0.12)" : t.type === "error" ? "rgba(244,63,94,0.12)" : "rgba(99,102,241,0.12)",
              borderColor: t.type === "success" ? "rgba(16,185,129,0.25)" : t.type === "error" ? "rgba(244,63,94,0.25)" : "rgba(99,102,241,0.25)",
            }}
          >
            {t.type === "success" && <CheckCircle size={18} className="text-emerald-400 shrink-0" />}
            {t.type === "error" && <AlertCircle size={18} className="text-rose-400 shrink-0" />}
            {t.type === "info" && <Info size={18} className="text-indigo-400 shrink-0" />}
            <p className="text-sm font-semibold text-white flex-1">{t.message}</p>
            <button onClick={() => remove(t.id)} className="text-slate-400 hover:text-white transition-colors">
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
