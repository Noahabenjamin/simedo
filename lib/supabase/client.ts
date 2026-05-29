import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client. Use this from "use client" components.
// Auth state lives in cookies — @supabase/ssr handles the read/write.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
