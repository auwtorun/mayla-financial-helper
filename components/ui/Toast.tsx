"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { createPortal } from "react-dom";

// ── TYPES ────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

// ── CONTEXT ──────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ── SINGLE TOAST ─────────────────────────────────────────────

const TOAST_COLORS: Record<ToastType, string> = {
  success: "var(--income)",
  error: "var(--expense)",
  info: "var(--accent)",
};

const TOAST_ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  info: "i",
};

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const t1 = setTimeout(() => setVisible(true), 10);
    // Auto-dismiss after 3s
    const t2 = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 280);
    }, 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [toast.id, onRemove]);

  const color = TOAST_COLORS[toast.type];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 16px",
        background: "var(--bg-elevated)",
        border: `1px solid ${color}33`,
        borderLeft: `3px solid ${color}`,
        borderRadius: "var(--radius-sm)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        transform: visible ? "translateY(0)" : "translateY(12px)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.25s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.25s ease",
        cursor: "pointer",
        userSelect: "none",
      }}
      onClick={() => {
        setVisible(false);
        setTimeout(() => onRemove(toast.id), 280);
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: `${color}22`,
          color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {TOAST_ICONS[toast.type]}
      </span>
      <span style={{ fontSize: 13, color: "var(--text-primary)", flex: 1 }}>
        {toast.message}
      </span>
    </div>
  );
}

// ── PROVIDER ─────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = `toast_${++counterRef.current}`;
    setToasts((prev) => [...prev.slice(-2), { id, message, type }]); // max 3 toasts
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {typeof window !== "undefined" &&
        toasts.length > 0 &&
        createPortal(
          <div
            aria-live="polite"
            style={{
              position: "fixed",
              bottom: "calc(var(--nav-height) + 16px)",
              left: "50%",
              transform: "translateX(-50%)",
              width: "calc(100% - 32px)",
              maxWidth: 400,
              zIndex: 200,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              pointerEvents: "none",
            }}
          >
            {toasts.map((t) => (
              <div key={t.id} style={{ pointerEvents: "auto" }}>
                <ToastItem toast={t} onRemove={remove} />
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

// ── HOOK ─────────────────────────────────────────────────────

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
