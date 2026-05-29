import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client using the service role key.
// Bypasses RLS — never import this from a "use client" file.
// Use only for: seeding, admin endpoints, system operations.
//
// Imports of this file are gated behind a runtime check so a stray browser
// bundle attempt at least throws a clear error.

if (typeof window !== "undefined") {
  throw new Error(
    "lib/supabase/admin.ts must never be imported in the browser. " +
      "Service-role key would be exposed.",
  );
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
