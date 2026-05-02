"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

// ── TYPES ────────────────────────────────────────────────────

export type ModalVariant = "confirm" | "success" | "error" | "info";

export interface ModalAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "danger" | "ghost";
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  variant?: ModalVariant;
  actions?: ModalAction[];
  /** Prevent closing on backdrop click (e.g. during async op) */
  blocking?: boolean;
}

// ── ICON MAP ─────────────────────────────────────────────────

const ICONS: Record<ModalVariant, string> = {
  confirm: "⚠️",
  success: "✅",
  error: "❌",
  info: "ℹ️",
};

const ACCENT_COLORS: Record<ModalVariant, string> = {
  confirm: "var(--expense)",
  success: "var(--income)",
  error: "var(--expense)",
  info: "var(--accent)",
};

// ── ACTION BUTTON ────────────────────────────────────────────

function ActionButton({
  action,
  autoFocus,
}: {
  action: ModalAction;
  autoFocus?: boolean;
}) {
  const btnVariant = action.variant ?? "primary";

  const styles: React.CSSProperties = {
    flex: 1,
    padding: "12px 16px",
    borderRadius: "var(--radius-sm)",
    fontSize: 14,
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
    transition: "opacity 0.15s, transform 0.1s",
    ...(btnVariant === "primary" && {
      background: "var(--accent)",
      color: "#000",
    }),
    ...(btnVariant === "danger" && {
      background: "var(--expense-bg)",
      color: "var(--expense)",
      border: "1px solid rgba(244, 63, 94, 0.25)",
    }),
    ...(btnVariant === "ghost" && {
      background: "var(--bg-muted)",
      color: "var(--text-secondary)",
      border: "1px solid var(--border-strong)",
    }),
  };

  return (
    <button
      style={styles}
      onClick={action.onClick}
      // eslint-disable-next-line jsx-a11y/no-autofocus
      autoFocus={autoFocus}
    >
      {action.label}
    </button>
  );
}

// ── MAIN MODAL ───────────────────────────────────────────────

export function Modal({
  open,
  onClose,
  title,
  description,
  variant = "info",
  actions,
  blocking = false,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !blocking) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, blocking]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const accentColor = ACCENT_COLORS[variant];

  const modal = (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (!blocking && e.target === overlayRef.current) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        animation: "fadeIn 0.15s ease",
        padding: "0 0 env(safe-area-inset-bottom)",
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>

      {/* Sheet panel — slides up from bottom (mobile-native feel) */}
      <div
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-strong)",
          borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
          width: "100%",
          maxWidth: 480,
          padding: "20px 20px 28px",
          animation: "slideUp 0.22s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Drag handle */}
        <div
          aria-hidden
          style={{
            width: 36,
            height: 4,
            background: "var(--border-strong)",
            borderRadius: 99,
            margin: "0 auto 20px",
          }}
        />

        {/* Icon + Title */}
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 36, marginBottom: 10, lineHeight: 1 }}>
            {ICONS[variant]}
          </div>
          <h2
            id="modal-title"
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            {title}
          </h2>
          {description && (
            <p
              style={{
                margin: "8px 0 0",
                fontSize: 14,
                color: "var(--text-secondary)",
                lineHeight: 1.5,
              }}
            >
              {description}
            </p>
          )}
        </div>

        {/* Divider */}
        <div
          aria-hidden
          style={{
            height: 1,
            background: "var(--border)",
            margin: "16px 0",
          }}
        />

        {/* Actions */}
        {actions && actions.length > 0 ? (
          <div style={{ display: "flex", gap: 10 }}>
            {actions.map((action, i) => (
              <ActionButton
                key={i}
                action={action}
                autoFocus={i === actions.length - 1}
              />
            ))}
          </div>
        ) : (
          <button
            onClick={onClose}
            style={{
              width: "100%",
              padding: "12px",
              background: "var(--bg-muted)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-strong)",
              borderRadius: "var(--radius-sm)",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Tutup
          </button>
        )}
      </div>
    </div>
  );

  // Render outside DOM hierarchy via portal
  return typeof window !== "undefined"
    ? createPortal(modal, document.body)
    : null;
}

// ── CONVENIENCE HOOK ─────────────────────────────────────────

import { useState, useCallback } from "react";

interface UseModalOptions {
  title: string;
  description?: string;
  variant?: ModalVariant;
  actions?: ModalAction[];
  blocking?: boolean;
}

export function useModal() {
  const [state, setState] = useState<(UseModalOptions & { open: boolean }) | null>(
    null
  );

  const show = useCallback((opts: UseModalOptions) => {
    setState({ ...opts, open: true });
  }, []);

  const close = useCallback(() => {
    setState((prev) => (prev ? { ...prev, open: false } : null));
  }, []);

  const modalProps: ModalProps | null = state
    ? { ...state, onClose: close }
    : null;

  return { show, close, modalProps };
}

// ── CONFIRM HOOK — common pattern ────────────────────────────

export function useConfirmModal() {
  const { show, close, modalProps } = useModal();

  const confirm = useCallback(
    (opts: {
      title: string;
      description?: string;
      confirmLabel?: string;
      onConfirm: () => void | Promise<void>;
    }) => {
      show({
        title: opts.title,
        description: opts.description,
        variant: "confirm",
        actions: [
          {
            label: "Batal",
            variant: "ghost",
            onClick: close,
          },
          {
            label: opts.confirmLabel ?? "Ya, Lanjutkan",
            variant: "danger",
            onClick: async () => {
              close();
              await opts.onConfirm();
            },
          },
        ],
      });
    },
    [show, close]
  );

  return { confirm, modalProps };
}
