"use client";

import { createBrowserClient } from "@supabase/ssr";

// Memoized browser-side Supabase client.
// Returns null if env vars aren't set so callers can gate features cleanly.

let cached: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserSupabase() {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  cached = createBrowserClient(url, anon);
  return cached;
}
