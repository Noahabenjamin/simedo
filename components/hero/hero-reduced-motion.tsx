"use client";

import Link from "next/link";

// Reduced-motion fallback. Static gradient, simple SVG of a double helix
// silhouette, copy block, CTAs. No Three.js, no scroll-tied animation.

export function HeroReducedMotion() {
  return (
    <section className="relative w-full overflow-hidden bg-[#020617] text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 px-6 py-24 sm:py-32 lg:py-40">
        <DoubleHelixSilhouette className="size-48" />

        <div className="flex flex-col items-center gap-4 text-center">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/60">
            Chapter one — DNA
          </span>
          <h1 className="max-w-2xl text-4xl font-medium leading-[1.05] tracking-[-0.02em] sm:text-5xl lg:text-6xl">
            The language of life, in motion.
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-white/70">
            DNA stores information in a four-letter code, twisted into a helix
            nature has used for four billion years.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/browse"
            className="rounded-full bg-white/95 px-5 py-2.5 text-sm font-medium text-[#020617] transition-colors hover:bg-white"
          >
            Explore simulations
          </Link>
          <Link
            href="/upload"
            className="rounded-full border border-white/40 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/80"
          >
            Upload yours
          </Link>
        </div>
      </div>
    </section>
  );
}

function DoubleHelixSilhouette({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 200"
      fill="none"
      stroke="#0EA5E9"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      <path d="M 30 10 C 60 30, 60 70, 30 90 S 0 130, 30 150 S 60 190, 30 210" />
      <path d="M 70 10 C 40 30, 40 70, 70 90 S 100 130, 70 150 S 40 190, 70 210" />
      {Array.from({ length: 8 }).map((_, i) => (
        <line
          key={i}
          x1="30"
          y1={20 + i * 25}
          x2="70"
          y2={20 + i * 25}
          opacity="0.5"
        />
      ))}
    </svg>
  );
}
