"use client";

import { motion } from "motion/react";
import { AdenineSVG } from "./chemicals/adenine";
import { ThymineSVG } from "./chemicals/thymine";
import { CytosineSVG } from "./chemicals/cytosine";
import { GuanineSVG } from "./chemicals/guanine";
import { findKfWindow, lerp, type Keyframe } from "./hero-sequence-config";

// DOM-positioned callouts overlaying the canvas. We don't anchor them in
// 3D — they appear in fixed screen-space positions and fade with the
// callout-visibility timings on the keyframes.
//
// This keeps the layout robust across viewport sizes; the camera is
// already animating the DNA into the right region, so a fixed callout
// position lines up cleanly.

type Props = { progress: number };

export function DnaCallouts({ progress }: Props) {
  const { a, b, easedT } = findKfWindow(progress);
  const o = (pick: (kf: Keyframe) => number) =>
    lerp(pick(a), pick(b), easedT);

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* Structure callouts (stage 1) */}
      <Callout
        opacity={o((k) => k.callouts.backbone)}
        label="Sugar-phosphate backbone"
        style={{ top: "22%", left: "8%" }}
        connectorDir="right"
      />
      <Callout
        opacity={o((k) => k.callouts.hbonds)}
        label="Hydrogen bonds"
        style={{ bottom: "26%", right: "8%" }}
        connectorDir="left"
      />

      {/* Base callouts (stage 2) */}
      <Callout
        opacity={o((k) => k.callouts.adenine)}
        label="Adenine"
        style={{ top: "16%", left: "6%" }}
        connectorDir="right"
      >
        <AdenineSVG />
      </Callout>
      <Callout
        opacity={o((k) => k.callouts.thymine)}
        label="Thymine"
        style={{ top: "16%", right: "6%" }}
        connectorDir="left"
      >
        <ThymineSVG />
      </Callout>
      <Callout
        opacity={o((k) => k.callouts.cytosine)}
        label="Cytosine"
        style={{ bottom: "18%", left: "6%" }}
        connectorDir="right"
      >
        <CytosineSVG />
      </Callout>
      <Callout
        opacity={o((k) => k.callouts.guanine)}
        label="Guanine"
        style={{ bottom: "18%", right: "6%" }}
        connectorDir="left"
      >
        <GuanineSVG />
      </Callout>
    </div>
  );
}

function Callout({
  label,
  opacity,
  style,
  connectorDir,
  children,
}: {
  label: string;
  opacity: number;
  style: React.CSSProperties;
  connectorDir: "left" | "right";
  children?: React.ReactNode;
}) {
  if (opacity < 0.02) return null;
  const align = connectorDir === "right" ? "items-start" : "items-end";
  return (
    <motion.div
      initial={false}
      animate={{ opacity, filter: `blur(${(1 - opacity) * 4}px)` }}
      transition={{ duration: 0.2 }}
      style={{ position: "absolute", maxWidth: "180px", ...style }}
      className={`flex flex-col gap-2 ${align}`}
    >
      {children && (
        <div className="w-[120px] rounded-md border border-cyan-200/50 bg-white/70 p-2 backdrop-blur-sm">
          {children}
        </div>
      )}
      <div
        className="font-mono text-[11px] uppercase tracking-[0.14em]"
        style={{ color: "rgb(8, 47, 73)" }}
      >
        {label}
      </div>
      <div
        className={`h-px w-12 ${
          connectorDir === "right" ? "self-start" : "self-end"
        }`}
        style={{ background: "rgba(14, 165, 233, 0.55)" }}
      />
    </motion.div>
  );
}
