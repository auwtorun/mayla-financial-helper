"use client";

import Link from "next/link";

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
        gap: 8,
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 32,
          marginBottom: 8,
        }}
      >
        {icon}
      </div>

      <p
        style={{
          margin: 0,
          fontSize: 16,
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        {title}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: 13,
          color: "var(--text-muted)",
          lineHeight: 1.6,
          maxWidth: 260,
        }}
      >
        {description}
      </p>

      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          style={{
            marginTop: 16,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "11px 24px",
            background: "var(--accent)",
            color: "#000",
            borderRadius: "var(--radius-sm)",
            fontSize: 14,
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "0 4px 16px rgba(0, 212, 170, 0.25)",
          }}
        >
          {actionLabel}
        </Link>
      )}

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            marginTop: 16,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "11px 24px",
            background: "var(--accent)",
            color: "#000",
            borderRadius: "var(--radius-sm)",
            fontSize: 14,
            fontWeight: 700,
            border: "none",
            boxShadow: "0 4px 16px rgba(0, 212, 170, 0.25)",
            cursor: "pointer",
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
