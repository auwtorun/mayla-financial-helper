"use client";

import { useEffect } from "react";
import { seedDefaultData } from "@/lib/db/database";

/**
 * Invisible component that initializes IndexedDB on first render.
 * Placed in root layout so it runs on every page.
 */
export function DBInitializer() {
  useEffect(() => {
    seedDefaultData().catch(console.error);
  }, []);

  return null;
}
