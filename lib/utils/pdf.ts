/**
 * PDF EXPORT — Rekening Koran
 *
 * Uses jsPDF (dynamic import so it doesn't bloat initial bundle).
 * Called only from StatementView when user taps "Export PDF".
 *
 * Extend this file in future iterations without touching StatementView.
 */

import type { StatementRow } from "@/features/statement/types";
import { formatCurrency, formatCurrencyCompact } from "./calculations";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export interface PDFPayload {
  userName: string;
  accountName: string;
  period: string;           // e.g. "Mei 2026" or "1 Apr – 31 Mei 2026"
  openingBalance: number;
  rows: StatementRow[];
}

// ── COLOR PALETTE ─────────────────────────────────────────────
const C = {
  bg: [8, 12, 20] as [number, number, number],
  surface: [14, 20, 32] as [number, number, number],
  accent: [0, 212, 170] as [number, number, number],
  income: [34, 197, 94] as [number, number, number],
  expense: [244, 63, 94] as [number, number, number],
  muted: [74, 94, 122] as [number, number, number],
  text: [240, 244, 255] as [number, number, number],
  border: [30, 40, 60] as [number, number, number],
} as const;

export async function exportStatementPDF(payload: PDFPayload): Promise<void> {
  // Dynamic import — not loaded on app startup
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const PW = 210;  // page width
  const PH = 297;  // page height
  const ML = 14;   // margin left
  const MR = 14;   // margin right
  const CW = PW - ML - MR;  // content width
  let y = 0;

  // ── HELPER FUNCTIONS ────────────────────────────────────────

  function setFill(c: readonly [number, number, number]) {
    doc.setFillColor(c[0], c[1], c[2]);
  }
  function setDraw(c: readonly [number, number, number]) {
    doc.setDrawColor(c[0], c[1], c[2]);
  }
  function setTextColor(c: readonly [number, number, number]) {
    doc.setTextColor(c[0], c[1], c[2]);
  }
  function rect(x: number, yy: number, w: number, h: number) {
    doc.rect(x, yy, w, h, "F");
  }

  // ── BACKGROUND ──────────────────────────────────────────────

  setFill(C.bg);
  rect(0, 0, PW, PH);

  // ── HEADER BAND ──────────────────────────────────────────────

  setFill(C.surface);
  rect(0, 0, PW, 42);

  // Accent left strip
  setFill(C.accent);
  rect(0, 0, 4, 42);

  // App name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  setTextColor(C.accent);
  doc.text("Mayla", ML + 4, 14);

  doc.setFontSize(9);
  setTextColor(C.muted);
  doc.text("Financial Tracker", ML + 4, 20);

  // Report title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  setTextColor(C.text);
  doc.text("REKENING KORAN", PW - MR, 14, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setTextColor(C.muted);
  doc.text(payload.period, PW - MR, 20, { align: "right" });
  doc.text(`Akun: ${payload.accountName}`, PW - MR, 26, { align: "right" });
  doc.text(`Pemilik: ${payload.userName}`, PW - MR, 32, { align: "right" });

  // Generated at
  const genAt = format(new Date(), "d MMMM yyyy, HH:mm", { locale: idLocale });
  doc.text(`Dicetak: ${genAt}`, PW - MR, 38, { align: "right" });

  y = 52;

  // ── SUMMARY CARDS ────────────────────────────────────────────

  const totalDebit = payload.rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = payload.rows.reduce((s, r) => s + r.credit, 0);
  const closingBalance = payload.rows[payload.rows.length - 1]?.runningBalance ?? payload.openingBalance;

  const cards = [
    { label: "Saldo Awal",   value: payload.openingBalance, color: C.muted },
    { label: "Total Masuk",  value: totalDebit,             color: C.income },
    { label: "Total Keluar", value: totalCredit,            color: C.expense },
    { label: "Saldo Akhir",  value: closingBalance,         color: C.accent },
  ];

  const cardW = (CW - 9) / 4;
  cards.forEach((card, i) => {
    const cx = ML + i * (cardW + 3);
    setFill(C.surface);
    doc.roundedRect(cx, y, cardW, 20, 2, 2, "F");

    setFill(card.color);
    rect(cx, y, cardW, 2);  // colored top strip

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setTextColor(C.muted);
    doc.text(card.label.toUpperCase(), cx + 4, y + 8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setTextColor(card.color);
    const valStr = formatCurrencyCompact(card.value);
    doc.text(valStr, cx + 4, y + 15);
  });

  y += 28;

  // ── TABLE ─────────────────────────────────────────────────────

  // Column config
  const cols = [
    { header: "TANGGAL",  w: 20, align: "left"  as const },
    { header: "DESKRIPSI",w: 70, align: "left"  as const },
    { header: "MASUK",    w: 28, align: "right" as const },
    { header: "KELUAR",   w: 28, align: "right" as const },
    { header: "SALDO",    w: 32, align: "right" as const },
  ];

  const colX: number[] = [];
  let xCursor = ML;
  cols.forEach((col) => { colX.push(xCursor); xCursor += col.w; });

  const ROW_H = 8;
  const HEADER_H = 9;
  const PAGE_BREAK_Y = PH - 20;

  // Table header
  setFill(C.surface);
  rect(ML, y, CW, HEADER_H);
  setFill(C.accent);
  rect(ML, y, CW, 0.8);  // top accent line

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setTextColor(C.muted);
  cols.forEach((col, i) => {
    const tx = col.align === "right" ? colX[i] + col.w - 2 : colX[i] + 2;
    doc.text(col.header, tx, y + 6, { align: col.align });
  });
  y += HEADER_H;

  // Table rows
  payload.rows.forEach((row, idx) => {
    // Page break
    if (y + ROW_H > PAGE_BREAK_Y) {
      doc.addPage();
      setFill(C.bg);
      rect(0, 0, PW, PH);
      y = 14;

      // Repeat header
      setFill(C.surface);
      rect(ML, y, CW, HEADER_H);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      setTextColor(C.muted);
      cols.forEach((col, i) => {
        const tx = col.align === "right" ? colX[i] + col.w - 2 : colX[i] + 2;
        doc.text(col.header, tx, y + 6, { align: col.align });
      });
      y += HEADER_H;
    }

    // Alternating rows
    if (idx % 2 === 0) {
      setFill([12, 17, 28]);
      rect(ML, y, CW, ROW_H);
    }

    const txn = row.txn;
    const dateStr = format(parseISO(txn.date), "d/M/yy");
    const desc = `${txn.category}${txn.note ? " · " + txn.note : ""}`;
    const isNeg = row.runningBalance < 0;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setTextColor(C.text);

    // Date
    doc.text(dateStr, colX[0] + 2, y + 5.5);

    // Description — truncate to fit
    const maxDescW = cols[1].w - 4;
    const truncDesc = doc.splitTextToSize(desc, maxDescW)[0];
    doc.text(truncDesc, colX[1] + 2, y + 5.5);

    // Debit
    if (row.debit > 0) {
      setTextColor(C.income);
      doc.text(formatCurrencyCompact(row.debit), colX[2] + cols[2].w - 2, y + 5.5, { align: "right" });
    } else {
      setTextColor(C.muted);
      doc.text("—", colX[2] + cols[2].w - 2, y + 5.5, { align: "right" });
    }

    // Credit
    if (row.credit > 0) {
      setTextColor(C.expense);
      doc.text(formatCurrencyCompact(row.credit), colX[3] + cols[3].w - 2, y + 5.5, { align: "right" });
    } else {
      setTextColor(C.muted);
      doc.text("—", colX[3] + cols[3].w - 2, y + 5.5, { align: "right" });
    }

    // Running balance
    setTextColor(isNeg ? C.expense : C.text);
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrencyCompact(row.runningBalance), colX[4] + cols[4].w - 2, y + 5.5, { align: "right" });

    y += ROW_H;
  });

  // Bottom closing line
  setDraw(C.border);
  doc.setLineWidth(0.3);
  doc.line(ML, y, ML + CW, y);
  y += 6;

  // ── FOOTER ────────────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setTextColor(C.muted);
  doc.text("Dokumen ini dibuat oleh Mayla Financial Tracker · Data tersimpan lokal di perangkat Anda", PW / 2, y, { align: "center" });

  // ── SAVE ──────────────────────────────────────────────────────
  const fileName = `rekening-koran-${payload.accountName.toLowerCase().replace(/\s+/g, "-")}-${payload.period.replace(/\s+/g, "-")}.pdf`;
  doc.save(fileName);
}
