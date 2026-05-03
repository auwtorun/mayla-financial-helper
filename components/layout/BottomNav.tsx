"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// ── SVG ICONS ────────────────────────────────────────────────

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

/** Receipt scroll — "transaction history" */
function HistoryIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

/** Bank columns — "rekening koran / statement" */
function StatementIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <line x1="2" y1="9" x2="22" y2="9" />
      <line x1="8" y1="3" x2="8" y2="9" />
      <line x1="7" y1="13" x2="10" y2="13" />
      <line x1="7" y1="17" x2="10" y2="17" />
      <line x1="14" y1="13" x2="17" y2="13" />
      <line x1="14" y1="17" x2="17" y2="17" />
    </svg>
  );
}

/** Piggy bank — "tabungan / savings" */
function SavingsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 1 6 6v1h1a2 2 0 0 1 0 4h-1v1a6 6 0 0 1-12 0v-1H5a2 2 0 0 1 0-4h1V9a6 6 0 0 1 6-6z" />
      <circle cx="9.5" cy="9.5" r="0.5" fill="currentColor" />
      <path d="M14 15a2 2 0 0 1-4 0" />
      <path d="M12 17v2" />
    </svg>
  );
}

/** User silhouette — "akun / profile" */
function AccountIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

// ── NAV CONFIG ────────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  isFAB?: boolean;
}

const navItems: NavItem[] = [
  { href: "/",           label: "Home",     icon: <HomeIcon /> },
  { href: "/history",    label: "Riwayat",  icon: <HistoryIcon /> },
  { href: "/transaction/add", label: "Tambah", icon: <PlusIcon />, isFAB: true },
  { href: "/statement",  label: "Rekening", icon: <StatementIcon /> },
  { href: "/account",    label: "Akun",     icon: <AccountIcon /> },
];

// ── COMPONENT ─────────────────────────────────────────────────

export function BottomNav() {
  const pathname = usePathname();
  if (pathname === "/intro") return null;

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "var(--nav-height)",
        background: "var(--bg-surface)",
        borderTop: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        paddingBottom: "env(safe-area-inset-bottom)",
        zIndex: 50,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {navItems.map((item) => {
        const isActive = item.isFAB
          ? false
          : pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

        if (item.isFAB) {
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label="Tambah transaksi"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "var(--accent)",
                color: "#000",
                marginBottom: 24,
                boxShadow: "0 4px 20px rgba(0, 212, 170, 0.4)",
                flexShrink: 0,
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
            >
              {item.icon}
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "6px 10px",
              color: isActive ? "var(--accent)" : "var(--text-muted)",
              textDecoration: "none",
              flex: 1,
              transition: "color 0.15s",
              position: "relative",
            }}
          >
            {/* Active indicator dot */}
            {isActive && (
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 20,
                  height: 2,
                  background: "var(--accent)",
                  borderRadius: "0 0 2px 2px",
                }}
              />
            )}
            <span>{item.icon}</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: isActive ? 600 : 400,
                letterSpacing: "0.02em",
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
