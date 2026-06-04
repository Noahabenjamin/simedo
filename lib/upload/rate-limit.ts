// Per-user upload rate limiter. 5 uploads per rolling 24 hours.
//
// In-memory only — resets every cold start. That's fine for the demo
// because the alternative (Upstash + KV) is operational overhead we
// don't have time for in Phase 5. Move to Upstash before the platform
// gets meaningful traffic.
//
// TODO(upstash): swap _bucket for a Redis-backed sliding window.

const MAX_UPLOADS = 5;
const WINDOW_MS = 24 * 60 * 60 * 1000;

const _bucket = new Map<string, number[]>();

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSeconds: number; reason: string };

export function checkUploadRateLimit(userId: string): RateLimitResult {
  const now = Date.now();
  const stamps = (_bucket.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);
  _bucket.set(userId, stamps);

  if (stamps.length >= MAX_UPLOADS) {
    const oldest = stamps[0];
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((WINDOW_MS - (now - oldest)) / 1000),
    );
    return {
      ok: false,
      retryAfterSeconds,
      reason: `You've hit the upload cap (${MAX_UPLOADS} per 24 hours). Try again in ${Math.ceil(
        retryAfterSeconds / 3600,
      )} hours.`,
    };
  }
  return { ok: true, remaining: MAX_UPLOADS - stamps.length };
}

export function recordUpload(userId: string): void {
  const stamps = _bucket.get(userId) ?? [];
  stamps.push(Date.now());
  _bucket.set(userId, stamps);
}
