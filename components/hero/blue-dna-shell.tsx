"use client";

import dynamic from "next/dynamic";

// Lazy-loaded shell for the R3F-based blue DNA. SSR off because Three.js
// touches `window` at module init. Same positioning as the previous NGL
// shell — keeps the studio hero layout pixel-identical.

const BlueDnaScene = dynamic(
  () => import("./blue-dna-scene").then((m) => m.BlueDnaScene),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full" aria-hidden="true" />
    ),
  },
);

type Props = { className?: string };

export function BlueDnaShell({ className = "" }: Props) {
  return (
    <div
      className={
        // Mobile: pointer-events-none keeps page scroll unblocked.
        // md+: re-enable so users can scroll-zoom and pinch-zoom the helix.
        "pointer-events-none absolute inset-y-0 left-3 z-0 w-[54vw] sm:left-6 sm:w-[46vw] md:pointer-events-auto md:left-10 md:w-[38vw] " +
        className
      }
      aria-hidden="true"
    >
      <BlueDnaScene />
    </div>
  );
}
