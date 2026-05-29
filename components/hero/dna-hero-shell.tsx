"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { HeroReducedMotion } from "./hero-reduced-motion";
import { HeroWebGLFallback, hasWebGL } from "./hero-webgl-fallback";

// Lazy-loaded wrapper around the heavy 3D hero.
// - prefers-reduced-motion → static fallback, no Three.js loaded
// - no WebGL → static fallback, no Three.js loaded
// - otherwise → dynamic-import the full scene, ssr disabled

const DNAHero = dynamic(() => import("./dna-hero").then((m) => m.DNAHero), {
  ssr: false,
  loading: () => <HeroLoading />,
});

export function DNAHeroShell() {
  const [mode, setMode] = useState<
    "loading" | "full" | "reduced" | "no-webgl"
  >("loading");

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) {
      setMode("reduced");
      return;
    }
    if (!hasWebGL()) {
      setMode("no-webgl");
      return;
    }
    setMode("full");
  }, []);

  if (mode === "loading") return <HeroLoading />;
  if (mode === "reduced") return <HeroReducedMotion />;
  if (mode === "no-webgl") return <HeroWebGLFallback />;
  return <DNAHero />;
}

function HeroLoading() {
  return (
    <section
      className="relative w-full"
      style={{ height: "100vh", background: "#020617" }}
      aria-hidden="true"
    />
  );
}
