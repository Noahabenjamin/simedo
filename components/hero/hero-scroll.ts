"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Lenis from "lenis";

// Hero scroll progress. Hooks Lenis (so the page has buttery smooth scroll)
// and computes a 0-1 value mapped to the hero section's position in viewport.
//
// Returns:
//   progress   — React state for components that need to re-render on scroll
//                (text overlays, background gradient)
//   progressRef — mutable ref for components inside @react-three/fiber's
//                useFrame that should read the latest value without
//                triggering a React re-render every frame
//
// Lenis is initialized at the document level (window scroll) and lives for the
// lifetime of the hook. Single Lenis instance per page is best practice.

export function useHeroScroll(heroRef: RefObject<HTMLElement | null>) {
  const progressRef = useRef(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let lenis: Lenis | null = null;

    function compute() {
      const el = heroRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const heroHeight = rect.height;
      const heroEffective = heroHeight - window.innerHeight;
      if (heroEffective <= 0) return;
      // rect.top goes from heroHeight (above viewport) to -heroEffective
      // (scrolled past). Map to 0-1.
      const p = Math.max(0, Math.min(1, -rect.top / heroEffective));
      progressRef.current = p;
      setProgress(p);
    }

    if (prefersReduced) {
      // No Lenis — use native scroll. Compute on scroll + on resize.
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
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis?.raf(time);
      compute();
      requestAnimationFrame(raf);
    }
    const handle = requestAnimationFrame(raf);

    const onResize = () => compute();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(handle);
      window.removeEventListener("resize", onResize);
      lenis?.destroy();
      lenis = null;
    };
  }, [heroRef]);

  return { progress, progressRef };
}
