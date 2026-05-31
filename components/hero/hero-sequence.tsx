"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef } from "react";
import { StudioHeroLayer } from "./studio-hero-layer";
import { DnaCallouts } from "./dna-callouts";
import { BlueMenu } from "./blue-menu";
import { useHeroScroll } from "./use-hero-scroll";
import {
  COLORS,
  findKfWindow,
  interpolateScalar,
  lerp,
  lerpHex,
} from "./hero-sequence-config";

// The whole scroll-driven hero — a single 400vh container with a sticky
// stage that contains the canvas, the studio overlay, the callouts, the
// blue overlay, and the blue menu.

const BlueDnaZoomScene = dynamic(
  () => import("./blue-dna-zoom-scene").then((m) => m.BlueDnaZoomScene),
  { ssr: false, loading: () => null },
);

export function HeroSequence() {
  const heroRef = useRef<HTMLElement>(null);
  const { progress, progressRef } = useHeroScroll(heroRef);

  const studioOpacity = useMemo(
    () => interpolateScalar(progress, (k) => k.studioOpacity),
    [progress],
  );
  const blueOverlay = useMemo(
    () => interpolateScalar(progress, (k) => k.blueOverlay),
    [progress],
  );

  // Background color interpolates through the keyframes' bgColor entries.
  const bgColor = useMemo(() => {
    const { a, b, easedT } = findKfWindow(progress);
    return lerpHex(a.bgColor, b.bgColor, easedT);
  }, [progress]);

  // Menu fade — appears once the flash dies down (~0.93 onward).
  const menuOpacity = useMemo(
    () => Math.max(0, Math.min(1, (progress - 0.93) / 0.06)),
    [progress],
  );

  // Same bound for the "lock scroll" behavior on the menu would be nice,
  // but we just let the user scroll back up if they want.
  void lerp;

  return (
    <section
      ref={heroRef}
      className="relative w-full"
      style={{ height: "400vh" }}
    >
      <div
        className="sticky top-0 h-screen w-full overflow-hidden"
        style={{ background: bgColor }}
      >
        {/* 3D scene — always rendered; camera moves through keyframes */}
        <BlueDnaZoomScene progressRef={progressRef} />

        {/* Callouts overlay (DOM, screen-space) */}
        <DnaCallouts progress={progress} />

        {/* Studio hero overlay (fades out at progress 0 → 0.1) */}
        <StudioHeroLayer opacity={studioOpacity} />

        {/* Flash overlay — bright cyan that peaks at the moment of impact
            (progress ~0.84) then dissolves to reveal the dark vista. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20"
          style={{
            backgroundColor: COLORS.flashCyan,
            opacity: blueOverlay,
            transition: "opacity 80ms linear",
            mixBlendMode: "screen",
          }}
        />

        {/* Blue menu — fades in at the very end */}
        <BlueMenu opacity={menuOpacity} />

        {/* Scroll hint when at the very top */}
        <ScrollHint opacity={progress < 0.04 ? 1 - progress / 0.04 : 0} />
      </div>
    </section>
  );
}

function ScrollHint({ opacity }: { opacity: number }) {
  if (opacity <= 0.01) return null;
  return (
    <div
      className="pointer-events-none absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2"
      style={{ opacity }}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40">
        Scroll
      </span>
      <div className="h-8 w-px animate-pulse bg-black/30" />
    </div>
  );
}
