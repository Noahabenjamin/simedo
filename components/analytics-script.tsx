// Renders the Plausible script tag if NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set.
// Drop into the root layout once and forget.

export function AnalyticsScript() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return null;
  return (
    // eslint-disable-next-line @next/next/no-sync-scripts
    <script
      defer
      data-domain={domain}
      src="https://plausible.io/js/script.js"
    />
  );
}
