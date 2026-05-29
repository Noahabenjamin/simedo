// Single source of truth for "is the real backend wired up?"
// When NEXT_PUBLIC_SUPABASE_URL is unset, every data fetcher falls back to
// the in-memory mock data so local development keeps working.

export function isDbAvailable(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
