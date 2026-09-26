"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  showPermissionDenied: (actionOrMessage?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, message }]);

      setTimeout(() => {
        removeToast(id);
      }, 3500);
    },
    [removeToast]
  );

  const showPermissionDenied = useCallback(
    (actionOrMessage?: string) => {
      let msg: string;

      // 如果参数包含 "权限不足" 或 "权限"，则视为完整消息
      if (actionOrMessage && (actionOrMessage.includes("权限不足") || actionOrMessage.includes("权限"))) {
        msg = actionOrMessage;
      } else if (actionOrMessage) {
        // 否则视为操作名称
        msg = `权限不足：您没有${actionOrMessage}的权限，请联系管理员开通`;
      } else {
        msg = "权限不足：您没有执行此操作的权限";
      }

      showToast(msg, "warning");
    },
    [showToast]
  );

  const getToastStyle = (type: ToastType) => {
    switch (type) {
      case "success":
        return "bg-green-500 text-white";
      case "error":
        return "bg-red-500 text-white";
      case "warning":
        return "bg-amber-500 text-white";
      case "info":
      default:
        return "bg-blue-500 text-white";
    }
  };

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "warning":
        return "⚠";
      case "info":
      default:
        return "ℹ";
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, showPermissionDenied }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-fade-in ${getToastStyle(
              toast.type
            )}`}
          >
            <span className="text-lg">{getToastIcon(toast.type)}</span>
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
