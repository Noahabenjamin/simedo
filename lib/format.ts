// Compact number formatter — 1234 → "1.2k", 24800 → "24.8k", 2_500_000 → "2.5m"
export function formatCount(n: number): string {
  if (n < 1000) return n.toString();
  if (n < 1_000_000) {
    const v = n / 1000;
    return v >= 10 ? `${Math.round(v)}k` : `${v.toFixed(1).replace(/\.0$/, "")}k`;
  }
  const v = n / 1_000_000;
  return v >= 10 ? `${Math.round(v)}m` : `${v.toFixed(1).replace(/\.0$/, "")}m`;
}

// "Mira Okafor" → "MO". Used for avatar fallbacks.
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}
