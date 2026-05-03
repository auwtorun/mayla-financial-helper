import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DBInitializer } from "@/components/layout/DBInitializer";
import { BottomNav } from "@/components/layout/BottomNav";
import { ToastProvider } from "@/components/ui/Toast";

// ── SEO METADATA ─────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: "Mayla — Financial Tracker",
    template: "%s · Mayla",
  },
  description:
    "Catat keuangan pribadi dengan mudah dan cepat. Offline-first, tanpa login, langsung dari perangkatmu.",
  keywords: ["keuangan pribadi", "catat pengeluaran", "financial tracker", "offline"],
  authors: [{ name: "Mayla" }],
  creator: "Mayla Financial Tracker",
  manifest: "/manifest.json",
  openGraph: {
    title: "Mayla Financial Tracker",
    description: "Catat keuangan pribadi dengan mudah dan cepat.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#080c14",
};

// ── ROOT LAYOUT ───────────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Favicon — replace these files in /public to change the icon */}
        {/* 
  <link rel="icon" href="/favicon.ico" sizes="any" />
  <link rel="icon" href="/icon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" /> 
*/}
<link rel="icon" href="/66b3e9a09291ddecfb8e714b_60.png" type="image/png" sizes="any" />

      </head>
      <body>
        <ToastProvider>
          <DBInitializer />
          <main>{children}</main>
          {/* BottomNav hidden on intro page via CSS */}
          <BottomNav />
        </ToastProvider>
      </body>
    </html>
  );
}
