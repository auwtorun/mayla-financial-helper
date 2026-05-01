import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DBInitializer } from "@/components/layout/DBInitializer";
import { BottomNav } from "@/components/layout/BottomNav";

export const metadata: Metadata = {
  title: "Mayla — Financial Tracker",
  description: "Pencatatan keuangan pribadi yang cepat dan sederhana",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#080c14",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <DBInitializer />
        <main>{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
