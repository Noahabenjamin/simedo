"use client";

import dynamic from "next/dynamic";

// Lazy-load the NGL viewer so its weight stays off the initial bundle.
const RotatingDna = dynamic(
  () => import("./rotating-dna").then((m) => m.RotatingDna),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-white" aria-hidden="true" />
    ),
  },
);

type Props = {
  className?: string;
};

/*
  Container for the rotating DNA.
  - Fills the section vertically (top to bottom).
  - Anchored to the left edge with a small breathing margin.
  - Width: ~10% wider than the previous step at every breakpoint.
  - pointer-events-none so it never intercepts clicks on the text above.

  NGL's autoView frames the helix inside whatever container it's given, so
  inside a tall narrow strip the DNA renders centered with whitespace above
  and below — never crowds the nav at top or the tagline at bottom.
*/
export function RotatingDnaShell({ className = "" }: Props) {
  return (
    <div
      className={
        // Mobile: pointer-events-none keeps page scroll free.
        // md+: re-enable so users can scroll-zoom and drag-rotate the helix.
        "pointer-events-none absolute inset-y-0 left-3 z-0 w-[54vw] sm:left-6 sm:w-[46vw] md:pointer-events-auto md:left-10 md:w-[38vw] " +
        className
      }
      aria-hidden="true"
    >
      <RotatingDna />
    </div>
  );
}
