"use server";

import { createClient } from "@/lib/supabase/server";
import { isDbAvailable } from "@/lib/data/db-available";

// Resend a Supabase email-confirmation (or email-change) link, with a
// per-email cooldown so the button isn't a spam vector.
//
// In-memory cooldown — resets every cold start, which is fine because
// Supabase enforces its own per-email throttle server-side too. Move to
// Upstash before this is a real attack surface.

const COOLDOWN_MS = 60_000;
const _lastSent = new Map<string, number>();

export type ResendResult =
  | { ok: true; cooldownSeconds: number }
  | { ok: false; reason: string; retryAfterSeconds?: number };

export async function resendConfirmation(formData: FormData): Promise<ResendResult> {
  if (!isDbAvailable()) {
    return { ok: false, reason: "Email isn't configured yet." };
  }
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const typeRaw = String(formData.get("type") ?? "signup");
  const type =
    typeRaw === "email_change" ? "email_change" : ("signup" as const);
  if (!email || !email.includes("@")) {
    return { ok: false, reason: "Missing email." };
  }

  const now = Date.now();
  const last = _lastSent.get(email);
  if (last && now - last < COOLDOWN_MS) {
    const wait = Math.ceil((COOLDOWN_MS - (now - last)) / 1000);
    return {
      ok: false,
      reason: `You can request another link in ${wait}s.`,
      retryAfterSeconds: wait,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type, email });
  if (error) {
    return { ok: false, reason: error.message };
  }

  _lastSent.set(email, now);
  return { ok: true, cooldownSeconds: COOLDOWN_MS / 1000 };
}
