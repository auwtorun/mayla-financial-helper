"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ── SLIDE DATA ────────────────────────────────────────────────

const slides = [
  {
    emoji: "💚",
    title: "Hai, aku sudah update\ntracker kamu, sayang💗",
    subtitle: "Mayla Financial Tracker kini hadir dengan tampilan dan fitur yang lebih baik.",
    bg: "radial-gradient(ellipse at 30% 20%, rgba(0,212,170,0.12) 0%, transparent 60%)",
  },
  {
    emoji: "✨",
    title: "Supaya kamu lebih\nnyaman dari sebelumnya",
    subtitle: "Rekening koran, export PDF, filter bulan, dan banyak perbaikan kecil yang kamu pasti suka.",
    bg: "radial-gradient(ellipse at 70% 30%, rgba(129,140,248,0.12) 0%, transparent 60%)",
  },
  {
    emoji: "🌸",
    title: "Semoga kamu suka\nya sama update ini",
    subtitle: "Semua data tersimpan di perangkatmu. Privat, cepat, dan selalu bisa diakses offline.",
    bg: "radial-gradient(ellipse at 50% 60%, rgba(34,197,94,0.1) 0%, transparent 60%)",
  },
];

// ── DOT INDICATOR ─────────────────────────────────────────────

function Dots({ total, active }: { total: number; active: number }) {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          style={{
            width: i === active ? 24 : 8,
            height: 8,
            borderRadius: 99,
            background: i === active ? "var(--accent)" : "var(--border-strong)",
            transition: "width 0.3s cubic-bezier(0.32, 0.72, 0, 1), background 0.2s",
            display: "block",
          }}
        />
      ))}
    </div>
  );
}

// ── MAIN VIEW ─────────────────────────────────────────────────

export function IntroView() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [visible, setVisible] = useState(false);

  // Fade in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const isLast = current === slides.length - 1;

  const goNext = () => {
    if (animating) return;
    if (isLast) {
      finish();
      return;
    }
    setAnimating(true);
    setTimeout(() => {
      setCurrent((c) => c + 1);
      setAnimating(false);
    }, 200);
  };

  const finish = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("hasSeenIntro", "true");
    }
    router.replace("/");
  };

  const slide = slides[current];

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--bg-base)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
        maxWidth: 480,
        margin: "0 auto",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.4s ease",
      }}
    >
      {/* Background glow per slide */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background: slide.bg,
          pointerEvents: "none",
          transition: "background 0.6s ease",
          zIndex: 0,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flex: 1,
          justifyContent: "center",
          gap: 0,
        }}
      >
        {/* Logo / App name */}
        <p
          style={{
            position: "absolute",
            top: 0,
            margin: 0,
            fontSize: 13,
            fontWeight: 700,
            color: "var(--accent)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Mayla
        </p>

        {/* Emoji */}
        <div
          key={`emoji-${current}`}
          style={{
            fontSize: 72,
            marginBottom: 32,
            animation: "introEmoji 0.4s cubic-bezier(0.32, 0.72, 0, 1) both",
          }}
        >
          {slide.emoji}
        </div>

        {/* Title */}
        <h1
          key={`title-${current}`}
          style={{
            margin: "0 0 16px",
            fontSize: 28,
            fontWeight: 800,
            color: "var(--text-primary)",
            textAlign: "center",
            lineHeight: 1.25,
            letterSpacing: "-0.02em",
            whiteSpace: "pre-line",
            animation: "introText 0.35s ease both",
          }}
        >
          {slide.title}
        </h1>

        {/* Subtitle */}
        <p
          key={`sub-${current}`}
          style={{
            margin: "0 0 48px",
            fontSize: 15,
            color: "var(--text-secondary)",
            textAlign: "center",
            lineHeight: 1.65,
            maxWidth: 300,
            animation: "introText 0.45s ease both",
          }}
        >
          {slide.subtitle}
        </p>

        {/* Dots */}
        <div style={{ marginBottom: 36 }}>
          <Dots total={slides.length} active={current} />
        </div>
      </div>

      {/* CTA */}
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 360 }}>
        <button
          onClick={goNext}
          style={{
            width: "100%",
            padding: "17px",
            background: "var(--accent)",
            color: "#000",
            fontSize: 16,
            fontWeight: 800,
            borderRadius: "var(--radius-lg)",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 6px 28px rgba(0,212,170,0.35)",
            letterSpacing: "0.01em",
            transition: "transform 0.1s, box-shadow 0.15s",
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.97)";
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "";
          }}
        >
          {isLast ? "Mulai 🚀" : "Lanjut →"}
        </button>

        {!isLast && (
          <button
            onClick={finish}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: 8,
              background: "transparent",
              color: "var(--text-muted)",
              fontSize: 13,
              border: "none",
              cursor: "pointer",
            }}
          >
            Lewati
          </button>
        )}
      </div>

      <style>{`
        @keyframes introEmoji {
          from { opacity: 0; transform: scale(0.7) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes introText {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
