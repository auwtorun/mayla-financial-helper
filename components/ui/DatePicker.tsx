"use client";

/**
 * DATE PICKER — built on react-day-picker v9 + date-fns
 * Two modes:
 *   1. Single  — picks one date  (used in transaction form)
 *   2. Range   — picks start/end (used in history filter)
 *
 * Rendered inside a bottom-sheet-style popover for mobile comfort.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { format, isValid, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import "react-day-picker/style.css";

// ── SHARED POPOVER WRAPPER ────────────────────────────────────

function DatePopover({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.65)",
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
          padding: "0 0 16px",
          animation: "slideUp 0.22s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Drag handle */}
        <div style={{ padding: "12px 0 4px", textAlign: "center" }}>
          <div
            aria-hidden
            style={{
              width: 36,
              height: 4,
              background: "var(--border-strong)",
              borderRadius: 99,
              display: "inline-block",
            }}
          />
        </div>
        {children}
      </div>
    </div>
  );
}

// ── DAY PICKER STYLES (injected once) ────────────────────────

const DAY_PICKER_CSS = `
  .rdp-root {
    --rdp-accent-color: var(--accent) !important;
    --rdp-accent-background-color: var(--accent-muted) !important;
    --rdp-day-height: 40px;
    --rdp-day-width: 40px;
    --rdp-font-size: 14px;
    color: var(--text-primary);
    padding: 0 16px 8px;
    margin: 0 auto;
    max-width: 360px;
  }
  .rdp-month_caption { color: var(--text-primary); font-weight: 700; font-size: 15px; }
  .rdp-nav button { color: var(--text-secondary); background: var(--bg-muted); border-radius: 8px; border: 1px solid var(--border-strong); }
  .rdp-nav button:hover { background: var(--bg-card); color: var(--accent); }
  .rdp-weekday { color: var(--text-muted); font-size: 12px; }
  .rdp-day_button { 
    color: var(--text-primary); 
    border-radius: 10px;
    font-size: 13px;
    transition: background 0.1s;
  }
  .rdp-day_button:hover { background: var(--bg-muted) !important; }
  .rdp-selected .rdp-day_button { 
    background: var(--accent) !important; 
    color: #000 !important;
    font-weight: 700;
  }
  .rdp-today .rdp-day_button { color: var(--accent); font-weight: 700; }
  .rdp-outside { opacity: 0.3; }
  .rdp-range_start .rdp-day_button, .rdp-range_end .rdp-day_button {
    background: var(--accent) !important;
    color: #000 !important;
    font-weight: 700;
  }
  .rdp-range_middle .rdp-day_button {
    background: var(--accent-muted) !important;
    color: var(--accent) !important;
    border-radius: 0;
  }
`;

function DayPickerStyles() {
  return <style>{DAY_PICKER_CSS}</style>;
}

// ── INPUT TRIGGER ────────────────────────────────────────────

interface TriggerProps {
  value: string;
  placeholder: string;
  onClick: () => void;
  error?: string;
}

function DateTrigger({ value, placeholder, onClick, error }: TriggerProps) {
  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        style={{
          width: "100%",
          padding: "12px 14px",
          background: "var(--bg-muted)",
          border: `1px solid ${error ? "var(--expense)" : "var(--border-strong)"}`,
          borderRadius: "var(--radius-sm)",
          color: value ? "var(--text-primary)" : "var(--text-muted)",
          fontSize: 15,
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
        }}
      >
        <span style={{ fontSize: 16, flexShrink: 0 }}>📅</span>
        <span style={{ flex: 1 }}>{value || placeholder}</span>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>▾</span>
      </button>
      {error && (
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--expense)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ── SINGLE DATE PICKER ────────────────────────────────────────

export interface SingleDatePickerProps {
  /** ISO date string YYYY-MM-DD */
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  error?: string;
  label?: string;
}

export function SingleDatePicker({
  value,
  onChange,
  placeholder = "Pilih tanggal",
  error,
  label,
}: SingleDatePickerProps) {
  const [open, setOpen] = useState(false);

  const selected = value && isValid(parseISO(value)) ? parseISO(value) : undefined;

  const displayValue = selected
    ? format(selected, "EEEE, d MMMM yyyy", { locale: idLocale })
    : "";

  const handleSelect = useCallback(
    (day: Date | undefined) => {
      if (!day) return;
      onChange(format(day, "yyyy-MM-dd"));
      setOpen(false);
    },
    [onChange]
  );

  return (
    <div>
      {label && (
        <label
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
      <DateTrigger
        value={displayValue}
        placeholder={placeholder}
        onClick={() => setOpen(true)}
        error={error}
      />

      <DatePopover open={open} onClose={() => setOpen(false)}>
        <DayPickerStyles />
        <p
          style={{
            margin: "8px 16px 12px",
            fontSize: 15,
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          Pilih Tanggal
        </p>
        <DayPicker
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          locale={idLocale}
          defaultMonth={selected ?? new Date()}
        />
        <div style={{ padding: "0 16px" }}>
          <button
            onClick={() => setOpen(false)}
            style={{
              width: "100%",
              padding: "12px",
              background: "var(--bg-muted)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-strong)",
              borderRadius: "var(--radius-sm)",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Batal
          </button>
        </div>
      </DatePopover>
    </div>
  );
}

// ── RANGE DATE PICKER ─────────────────────────────────────────

export interface DateRangeValue {
  from: string; // ISO
  to: string;   // ISO
}

export interface RangeDatePickerProps {
  value: DateRangeValue;
  onChange: (range: DateRangeValue) => void;
  placeholder?: string;
}

export function RangeDatePicker({
  value,
  onChange,
  placeholder = "Pilih rentang tanggal",
}: RangeDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [localRange, setLocalRange] = useState<DateRange | undefined>(() => ({
    from: value.from ? parseISO(value.from) : undefined,
    to: value.to ? parseISO(value.to) : undefined,
  }));

  const displayValue = (() => {
    const from = value.from ? format(parseISO(value.from), "d MMM yyyy", { locale: idLocale }) : null;
    const to = value.to ? format(parseISO(value.to), "d MMM yyyy", { locale: idLocale }) : null;
    if (from && to && from !== to) return `${from} – ${to}`;
    if (from) return from;
    return "";
  })();

  const handleSelect = useCallback((range: DateRange | undefined) => {
    setLocalRange(range);
  }, []);

  const handleApply = useCallback(() => {
    onChange({
      from: localRange?.from ? format(localRange.from, "yyyy-MM-dd") : "",
      to: localRange?.to ? format(localRange.to, "yyyy-MM-dd") : "",
    });
    setOpen(false);
  }, [localRange, onChange]);

  const handleClear = useCallback(() => {
    setLocalRange(undefined);
    onChange({ from: "", to: "" });
    setOpen(false);
  }, [onChange]);

  return (
    <div>
      <DateTrigger
        value={displayValue}
        placeholder={placeholder}
        onClick={() => setOpen(true)}
      />

      <DatePopover open={open} onClose={() => setOpen(false)}>
        <DayPickerStyles />
        <p
          style={{
            margin: "8px 16px 12px",
            fontSize: 15,
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          Rentang Tanggal
        </p>
        <DayPicker
          mode="range"
          selected={localRange}
          onSelect={handleSelect}
          locale={idLocale}
          defaultMonth={localRange?.from ?? new Date()}
        />
        <div style={{ padding: "8px 16px 0", display: "flex", gap: 10 }}>
          <button
            onClick={handleClear}
            style={{
              flex: 1,
              padding: "12px",
              background: "transparent",
              color: "var(--text-muted)",
              border: "1px solid var(--border-strong)",
              borderRadius: "var(--radius-sm)",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            style={{
              flex: 2,
              padding: "12px",
              background: "var(--accent)",
              color: "#000",
              border: "none",
              borderRadius: "var(--radius-sm)",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            Terapkan
          </button>
        </div>
      </DatePopover>
    </div>
  );
}
