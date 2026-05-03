"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { seedDefaultData } from "@/lib/db/database";

/**
 * Runs on every page:
 *  1. Seeds IndexedDB with defaults on first open
 *  2. Redirects to /intro if user has never seen it
 *     (skips redirect if already on /intro)
 */
export function DBInitializer() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    seedDefaultData().catch(console.error);

    if (pathname !== "/intro") {
      const seen = localStorage.getItem("hasSeenIntro");
      if (!seen) {
        router.replace("/intro");
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
