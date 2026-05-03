"use client";

/**
 * MONTH PICKER
 * Picks a year+month combination. Opens as a bottom-sheet.
 * Returns value as { year: number, month: number } (month is 0-indexed).
 *
 * Also exports helpers:
 *   monthToDateRange(year, month) → { from: string, to: string }
 *   formatMonthLabel(year, month) → "Mei 2026"
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { id as idLocale } from "date-fns/locale";

// ── TYPES ─────────────────────────────────────────────────────

export interface MonthValue {
  year: number;
  month: number; // 0-indexed (0 = Jan, 11 = Dec)
}

export interface MonthPickerProps {
  value: MonthValue;
  onChange: (v: MonthValue) => void;
  /** How many years back to show (default: 3) */
  yearsBack?: number;
}

// ── HELPERS ───────────────────────────────────────────────────

/** Convert MonthValue → ISO date range string */
export function monthToDateRange(year: number, month: number) {
  const d = new Date(year, month, 1);
  return {
    from: format(startOfMonth(d), "yyyy-MM-dd"),
    to: format(endOfMonth(d), "yyyy-MM-dd"),
  };
}

/** "Mei 2026", "Januari 2025", etc. */
export function formatMonthLabel(year: number, month: number): string {
  return format(new Date(year, month, 1), "MMMM yyyy", { locale: idLocale });
}

/** Short form: "Mei '26" */
export function formatMonthShort(year: number, month: number): string {
  return format(new Date(year, month, 1), "MMM yyyy", { locale: idLocale });
}

/** Current month as MonthValue */
export function currentMonth(): MonthValue {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

// ── INDONESIAN MONTH NAMES ─────────────────────────────────────

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April",
  "Mei", "Juni", "Juli", "Agustus",
  "September", "Oktober", "November", "Desember",
];

// ── SHEET ─────────────────────────────────────────────────────

function MonthPickerSheet({
  open,
  onClose,
  value,
  onSelect,
  yearsBack,
}: {
  open: boolean;
  onClose: () => void;
  value: MonthValue;
  onSelect: (v: MonthValue) => void;
  yearsBack: number;
}) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const [displayYear, setDisplayYear] = useState(value.year);

  // Reset display year whenever sheet opens
  useEffect(() => {
    if (open) setDisplayYear(value.year);
  }, [open, value.year]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const minYear = currentYear - yearsBack;
  const canGoBack = displayYear > minYear;
  const canGoForward = displayYear < currentYear;

  const handleSelect = (month: number) => {
    onSelect({ year: displayYear, month });
    onClose();
  };

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 95,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)",
        animation: "fadeIn 0.15s ease",
        padding: "0 0 env(safe-area-inset-bottom)",
      }}
    >
      <div
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-strong)",
          borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
          width: "100%", maxWidth: 480,
          animation: "slideUp 0.22s cubic-bezier(0.32, 0.72, 0, 1)",
          padding: "0 0 24px",
        }}
      >
        {/* Handle */}
        <div style={{ padding: "12px 0 4px", textAlign: "center" }}>
          <div aria-hidden style={{ width: 36, height: 4, background: "var(--border-strong)", borderRadius: 99, display: "inline-block" }} />
        </div>

        {/* Year navigator */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 20px 16px",
        }}>
          <button
            onClick={() => canGoBack && setDisplayYear(y => y - 1)}
            disabled={!canGoBack}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: "var(--bg-muted)", border: "1px solid var(--border-strong)",
              color: canGoBack ? "var(--text-primary)" : "var(--text-muted)",
              fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: canGoBack ? "pointer" : "not-allowed", opacity: canGoBack ? 1 : 0.35,
            }}
          >
            ‹
          </button>

          <span style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
            {displayYear}
          </span>

          <button
            onClick={() => canGoForward && setDisplayYear(y => y + 1)}
            disabled={!canGoForward}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: "var(--bg-muted)", border: "1px solid var(--border-strong)",
              color: canGoForward ? "var(--text-primary)" : "var(--text-muted)",
              fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: canGoForward ? "pointer" : "not-allowed", opacity: canGoForward ? 1 : 0.35,
            }}
          >
            ›
          </button>
        </div>

        {/* Month grid — 4×3 */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8, padding: "0 16px",
        }}>
          {MONTHS_ID.map((name, idx) => {
            const isSelected = value.year === displayYear && value.month === idx;
            const isCurrent =
              currentYear === displayYear && now.getMonth() === idx;
            // Disable future months
            const isFuture =
              displayYear === currentYear && idx > now.getMonth();

            return (
              <button
                key={idx}
                onClick={() => !isFuture && handleSelect(idx)}
                disabled={isFuture}
                style={{
                  padding: "11px 4px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 13,
                  fontWeight: isSelected ? 700 : 400,
                  background: isSelected ? "var(--accent)" : isCurrent ? "var(--accent-muted)" : "var(--bg-muted)",
                  border: `1px solid ${isSelected ? "var(--accent)" : isCurrent ? "var(--accent)" : "transparent"}`,
                  color: isSelected
                    ? "#000"
                    : isFuture
                    ? "var(--text-muted)"
                    : isCurrent
                    ? "var(--accent)"
                    : "var(--text-primary)",
                  cursor: isFuture ? "not-allowed" : "pointer",
                  opacity: isFuture ? 0.3 : 1,
                  transition: "all 0.12s",
                }}
              >
                {name.slice(0, 3)}
              </button>
            );
          })}
        </div>

        {/* Cancel */}
        <div style={{ padding: "16px 16px 0" }}>
          <button
            onClick={onClose}
            style={{
              width: "100%", padding: "12px",
              background: "var(--bg-muted)", color: "var(--text-secondary)",
              border: "1px solid var(--border-strong)", borderRadius: "var(--radius-sm)",
              fontSize: 14, fontWeight: 500,
            }}
          >
            Batal
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── TRIGGER BUTTON ─────────────────────────────────────────────

export function MonthPicker({ value, onChange, yearsBack = 3 }: MonthPickerProps) {
  const [open, setOpen] = useState(false);

  const label = formatMonthLabel(value.year, value.month);

  const handleSelect = useCallback(
    (v: MonthValue) => {
      onChange(v);
      setOpen(false);
    },
    [onChange]
  );

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          width: "100%",
          padding: "12px 14px",
          background: "var(--bg-muted)",
          border: `1px solid ${open ? "var(--accent)" : "var(--border-strong)"}`,
          borderRadius: "var(--radius-sm)",
          display: "flex", alignItems: "center", gap: 10,
          cursor: "pointer",
          boxShadow: open ? "0 0 0 3px var(--accent-glow)" : "none",
          transition: "border-color 0.15s",
        }}
      >
        <span style={{ fontSize: 16, flexShrink: 0 }}>📅</span>
        <span style={{ flex: 1, fontSize: 15, color: "var(--text-primary)", textAlign: "left", fontWeight: 500 }}>
          {label}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {typeof window !== "undefined" && (
        <MonthPickerSheet
          open={open}
          onClose={() => setOpen(false)}
          value={value}
          onSelect={handleSelect}
          yearsBack={yearsBack}
        />
      )}
    </div>
  );
}
