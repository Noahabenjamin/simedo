"use client";

import { motion } from "motion/react";
import { Html } from "@react-three/drei";
import type { ReactNode } from "react";
import type { Vector3 } from "three";

// A floating chemical-structure callout anchored to a 3D point on the helix.
//
// Layout:
//   ┌─ corner bracket at the anchor
//   │  thin connector line going up-right
//   │     ┌─ chemical structure SVG (optional)
//   │     └─ uppercase label
//
// The Drei <Html> keeps the anchor pinned in 3D as the camera moves; the
// inner SVG / label live in screen space so they stay crisp at any zoom.

type Props = {
  anchor: Vector3;
  visible: number;        // 0..1 opacity
  label: string;
  side?: "left" | "right" | "top" | "bottom";
  children?: ReactNode;   // chemical SVG slot
};

const ANCHOR_OFFSETS: Record<NonNullable<Props["side"]>, { dx: string; dy: string; lineDx: number; lineDy: number }> = {
  right: { dx: "20px", dy: "-20px", lineDx: 60, lineDy: 0 },
  left: { dx: "-180px", dy: "-20px", lineDx: -60, lineDy: 0 },
  top: { dx: "-50px", dy: "-90px", lineDx: 0, lineDy: -60 },
  bottom: { dx: "-50px", dy: "60px", lineDx: 0, lineDy: 60 },
};

export function HeroAnnotation({
  anchor,
  visible,
  label,
  side = "right",
  children,
}: Props) {
  if (visible <= 0.01) return null;

  const offsets = ANCHOR_OFFSETS[side];

  return (
    <Html
      position={anchor}
      style={{ pointerEvents: "none", whiteSpace: "nowrap" }}
      center={false}
    >
      <motion.div
        initial={false}
        animate={{ opacity: visible, filter: `blur(${(1 - visible) * 6}px)` }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{ position: "absolute" }}
      >
        {/* connector line + bracket. SVG so the line endpoint stays sharp. */}
        <svg
          width="200"
          height="120"
          viewBox="0 0 200 120"
          style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
        >
          {/* corner bracket at (0, 0) */}
          <path
            d="M 0 -6 L 0 6 M -6 0 L 6 0"
            stroke="rgba(125, 211, 252, 0.9)"
            strokeWidth="1"
          />
          {/* connector */}
          <line
            x1="0"
            y1="0"
            x2={offsets.lineDx}
            y2={offsets.lineDy}
            stroke="rgba(125, 211, 252, 0.5)"
            strokeWidth="1"
          />
        </svg>

        {/* label + structure card */}
        <div
          style={{
            position: "absolute",
            left: offsets.dx,
            top: offsets.dy,
          }}
        >
          {children && (
            <div
              style={{
                width: "120px",
                height: "78px",
                marginBottom: "6px",
                opacity: 0.95,
              }}
            >
              {children}
            </div>
          )}
          <div
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: "11px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(232, 245, 255, 0.92)",
            }}
          >
            {label}
          </div>
        </div>
      </motion.div>
    </Html>
  );
}
