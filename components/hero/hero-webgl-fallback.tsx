"use client";

import { HeroReducedMotion } from "./hero-reduced-motion";

// Same visual as reduced-motion, plus a tiny note. Triggered when WebGL
// isn't available at all.

export function HeroWebGLFallback() {
  return (
    <div className="relative">
      <HeroReducedMotion />
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-wider text-white/40">
        Your browser doesn&apos;t support 3D — showing simplified hero.
      </p>
    </div>
  );
}

export function hasWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}
