"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Lenis from "lenis";

// Hooks Lenis (buttery smooth scroll) and computes the hero sequence's
// progress value 0..1 based on the section's position in viewport.
//
// Returns:
//   progress    — React state for DOM overlays that re-render on scroll
//   progressRef — mutable ref for components inside useFrame that read the
//                 latest value every frame without triggering React updates.

export function useHeroScroll(
  heroRef: RefObject<HTMLElement | null>,
) {
  const progressRef = useRef(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let lenis: Lenis | null = null;
    let raf = 0;

    function compute() {
      const el = heroRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const effective = rect.height - window.innerHeight;
      if (effective <= 0) {
        progressRef.current = 0;
        setProgress(0);
        return;
      }
      const p = Math.max(0, Math.min(1, -rect.top / effective));
      progressRef.current = p;
      setProgress(p);
    }

    if (prefersReduced) {
      const onScroll = () => compute();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      compute();
      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      };
    }

    lenis = new Lenis({
      duration: 1.4,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function loop(time: number) {
      lenis?.raf(time);
      compute();
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    const onResize = () => compute();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      lenis?.destroy();
      lenis = null;
    };
  }, [heroRef]);

  return { progress, progressRef };
}
