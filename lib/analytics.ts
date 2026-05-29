// Lightweight analytics wrapper. Defaults to Plausible (script tag + custom
// events via /api/event). PostHog can swap in later by reimplementing track().
//
// If NEXT_PUBLIC_PLAUSIBLE_DOMAIN is unset, all calls are no-ops.

export type EventName =
  | "signup_completed"
  | "upload_completed"
  | "ai_question_asked"
  | "comment_posted"
  | "simulation_viewed"
  | "simulation_shared"
  | "embed_code_copied"
  | "session_started";

type Props = Record<string, string | number | boolean>;

export function track(event: EventName, props?: Props): void {
  if (typeof window === "undefined") return;
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return;

  // Plausible's custom-event API expects a POST.
  void fetch("https://plausible.io/api/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: event,
      url: window.location.href,
      domain,
      props,
    }),
    keepalive: true,
  }).catch(() => {
    /* swallow — analytics never blocks UI */
  });
}
