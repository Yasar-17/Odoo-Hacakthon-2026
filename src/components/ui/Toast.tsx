"use client";

import { useEffect, useState, createContext, useContext, useCallback, useRef } from "react";
import Icon from "@/components/ui/Icon";

type ToastType = "success" | "error";

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const toast = useCallback((type: ToastType, message: string) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl ambient-shadow border text-sm font-medium animate-slide-in ${
              t.type === "success"
                ? "bg-surface-pure text-success-text border-border-light"
                : "bg-surface-pure text-danger-text border-border-light"
            }`}
          >
            <Icon name={t.type === "success" ? "check_circle" : "error"} filled className="text-[18px]" />
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
