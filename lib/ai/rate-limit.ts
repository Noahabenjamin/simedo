import { createClient } from "@/lib/supabase/server";
import { isDbAvailable } from "@/lib/data/db-available";

// Per-user AI rate limits, counted from the ai_usage table.
//   30 messages per rolling hour
//   200 messages per rolling 24 hours
// Anonymous users get a smaller bucket (5 / hour, 25 / day) so the demo
// is browseable without sign-in but not free to drain.

export const LIMITS = {
  authed: { perHour: 30, perDay: 200 },
  anon: { perHour: 5, perDay: 25 },
} as const;

export type RateLimitResult =
  | { ok: true; remainingHour: number; remainingDay: number }
  | { ok: false; reason: string; retryAfterSeconds: number };

export async function checkAiRateLimit(
  userId: string | null,
): Promise<RateLimitResult> {
  if (!isDbAvailable()) return { ok: true, remainingHour: 999, remainingDay: 999 };

  const bucket = userId ? LIMITS.authed : LIMITS.anon;
  const supabase = await createClient();
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const [hourRes, dayRes] = await Promise.all([
    supabase
      .from("ai_usage")
      .select("id", { count: "exact", head: true })
      .gte("created_at", hourAgo)
      .eq("user_id", userId ?? null as unknown as string),
    supabase
      .from("ai_usage")
      .select("id", { count: "exact", head: true })
      .gte("created_at", dayAgo)
      .eq("user_id", userId ?? null as unknown as string),
  ]);

  const hourCount = hourRes.count ?? 0;
  const dayCount = dayRes.count ?? 0;

  if (hourCount >= bucket.perHour) {
    return {
      ok: false,
      reason: `Hourly limit (${bucket.perHour} messages) reached. Try again in an hour.`,
      retryAfterSeconds: 60 * 60,
    };
  }
  if (dayCount >= bucket.perDay) {
    return {
      ok: false,
      reason: `Daily limit (${bucket.perDay} messages) reached. Try again tomorrow.`,
      retryAfterSeconds: 60 * 60 * 24,
    };
  }

  return {
    ok: true,
    remainingHour: bucket.perHour - hourCount,
    remainingDay: bucket.perDay - dayCount,
  };
}

export async function recordAiUsage(opts: {
  userId: string | null;
  simulationId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}): Promise<void> {
  if (!isDbAvailable()) return;
  try {
    const supabase = await createClient();
    await supabase.from("ai_usage").insert({
      user_id: opts.userId,
      simulation_id: opts.simulationId,
      model: opts.model,
      input_tokens: opts.inputTokens,
      output_tokens: opts.outputTokens,
    });
  } catch (e) {
    console.warn("[ai/rate-limit] recordAiUsage failed", e);
  }
}
