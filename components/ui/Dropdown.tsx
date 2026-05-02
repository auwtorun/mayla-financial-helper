"use client";

/**
 * DROPDOWN — Custom select, zero native browser UI.
 * Opens as a bottom-sheet on mobile for thumb-friendly picking.
 *
 * Usage:
 *   <Dropdown
 *     value={category}
 *     onChange={setCategory}
 *     options={[{ value: "food", label: "Makan & Minum", meta: "expense" }]}
 *     placeholder="Pilih kategori"
 *   />
 */

import { useState, useRef, useEffect, useCallback, useId } from "react";
import { createPortal } from "react-dom";

// ── TYPES ────────────────────────────────────────────────────

export interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
  /** Optional sub-text shown below label */
  description?: string;
  /** Optional colored dot / badge color (CSS color string) */
  accentColor?: string;
  /** If true, option is shown but not selectable */
  disabled?: boolean;
}

export interface DropdownProps<T extends string = string> {
  value: T | "";
  onChange: (value: T) => void;
  options: DropdownOption<T>[];
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  /** Group label shown above the list in the sheet */
  sheetTitle?: string;
}

// ── OVERLAY SHEET ────────────────────────────────────────────

function DropdownSheet<T extends string>({
  open,
  onClose,
  options,
  value,
  onSelect,
  sheetTitle,
  placeholder,
}: {
  open: boolean;
  onClose: () => void;
  options: DropdownOption<T>[];
  value: T | "";
  onSelect: (v: T) => void;
  sheetTitle?: string;
  placeholder?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 95,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
        animation: "fadeIn 0.15s ease",
        padding: "0 0 env(safe-area-inset-bottom)",
      }}
    >
      <div
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-strong)",
          borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
          width: "100%",
          maxWidth: 480,
          maxHeight: "72vh",
          display: "flex",
          flexDirection: "column",
          animation: "slideUp 0.22s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Handle + title */}
        <div style={{ padding: "12px 20px 8px", flexShrink: 0 }}>
          <div
            aria-hidden
            style={{
              width: 36, height: 4,
              background: "var(--border-strong)",
              borderRadius: 99,
              margin: "0 auto 12px",
            }}
          />
          {sheetTitle && (
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
              {sheetTitle}
            </p>
          )}
        </div>

        {/* Options list — scrollable */}
        <div style={{ overflowY: "auto", padding: "0 12px 20px", flex: 1 }}>
          {placeholder && (
            <OptionRow
              option={{ value: "" as T, label: placeholder }}
              selected={value === ""}
              onSelect={() => { onSelect("" as T); onClose(); }}
              isPlaceholder
            />
          )}
          {options.map((opt) => (
            <OptionRow
              key={opt.value}
              option={opt}
              selected={value === opt.value}
              onSelect={() => {
                if (!opt.disabled) { onSelect(opt.value); onClose(); }
              }}
            />
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── SINGLE OPTION ROW ────────────────────────────────────────

function OptionRow<T extends string>({
  option,
  selected,
  onSelect,
  isPlaceholder = false,
}: {
  option: DropdownOption<T> | { value: T; label: string };
  selected: boolean;
  onSelect: () => void;
  isPlaceholder?: boolean;
}) {
  const opt = option as DropdownOption<T>;
  return (
    <button
      onClick={onSelect}
      disabled={opt.disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "12px 12px",
        background: selected ? "var(--accent-muted)" : "transparent",
        border: `1px solid ${selected ? "var(--accent)" : "transparent"}`,
        borderRadius: "var(--radius-sm)",
        marginBottom: 4,
        textAlign: "left",
        cursor: opt.disabled ? "not-allowed" : "pointer",
        opacity: opt.disabled ? 0.4 : 1,
        transition: "background 0.12s",
      }}
    >
      {/* Accent dot */}
      {opt.accentColor && (
        <span
          style={{
            width: 8, height: 8,
            borderRadius: "50%",
            background: opt.accentColor,
            flexShrink: 0,
          }}
        />
      )}

      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontSize: 14,
            fontWeight: selected ? 600 : 400,
            color: isPlaceholder
              ? "var(--text-muted)"
              : selected
              ? "var(--accent)"
              : "var(--text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {option.label}
        </span>
        {opt.description && (
          <span
            style={{
              display: "block",
              fontSize: 12,
              color: "var(--text-muted)",
              marginTop: 1,
            }}
          >
            {opt.description}
          </span>
        )}
      </span>

      {/* Checkmark */}
      {selected && !isPlaceholder && (
        <span style={{ color: "var(--accent)", fontSize: 16, flexShrink: 0 }}>✓</span>
      )}
    </button>
  );
}

// ── TRIGGER BUTTON ────────────────────────────────────────────

export function Dropdown<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = "Pilih...",
  label,
  error,
  disabled,
  sheetTitle,
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const id = useId();

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption?.label ?? "";

  const handleSelect = useCallback(
    (v: T) => {
      onChange(v);
      setOpen(false);
    },
    [onChange]
  );

  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          style={{
            display: "block",
            fontSize: 11,
            color: "var(--text-muted)",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          {label}
        </label>
      )}

      <button
        id={id}
        type="button"
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          width: "100%",
          padding: "12px 14px",
          background: "var(--bg-muted)",
          border: `1px solid ${error ? "var(--expense)" : open ? "var(--accent)" : "var(--border-strong)"}`,
          borderRadius: "var(--radius-sm)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          transition: "border-color 0.15s",
          boxShadow: open ? "0 0 0 3px var(--accent-glow)" : "none",
        }}
      >
        {/* Accent dot if present */}
        {selectedOption?.accentColor && (
          <span
            style={{
              width: 8, height: 8,
              borderRadius: "50%",
              background: selectedOption.accentColor,
              flexShrink: 0,
            }}
          />
        )}

        <span
          style={{
            flex: 1,
            fontSize: 15,
            color: displayLabel ? "var(--text-primary)" : "var(--text-muted)",
            textAlign: "left",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {displayLabel || placeholder}
        </span>

        {/* Chevron */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {error && (
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--expense)" }}>
          {error}
        </p>
      )}

      {typeof window !== "undefined" && (
        <DropdownSheet
          open={open}
          onClose={() => setOpen(false)}
          options={options}
          value={value}
          onSelect={handleSelect}
          sheetTitle={sheetTitle ?? label}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
