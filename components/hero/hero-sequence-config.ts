// Single source of truth for the hero sequence's scroll-driven keyframes.
// All numbers here can be tuned without touching scene code.

import { Vector3 } from "three";

// DNA geometry (matches the smooth blue helix we already had)
export const DNA = {
  nBp: 22,
  helixRadius: 1.0,
  risePerBp: 0.34,
  twistPerBpDeg: 36,
  backboneTubeRadius: 0.105,
  rungRadius: 0.055,
  tubularSegmentsPerBp: 12,
  radialSegments: 16,
  rungRadialSegments: 24,
};
export const DNA_HEIGHT = DNA.nBp * DNA.risePerBp;
export const DNA_TWIST_RAD = (DNA.twistPerBpDeg * Math.PI) / 180;

// The base pair the camera dives into. Index 11 = middle of 22.
export const TARGET_BP_INDEX = 11;
export const TARGET_ATOM_WORLD: [number, number, number] = (() => {
  const angle = TARGET_BP_INDEX * DNA_TWIST_RAD;
  const halfH = DNA_HEIGHT / 2;
  const y = TARGET_BP_INDEX * DNA.risePerBp - halfH + DNA.risePerBp / 2;
  return [
    Math.cos(angle) * DNA.helixRadius,
    y,
    Math.sin(angle) * DNA.helixRadius,
  ];
})();

export const COLORS = {
  backbone: "#0EA5E9",
  backboneEmissive: "#0284C7",
  rung: "#67E8F9",
  rungEmissive: "#0EA5E9",
  atomC: "#67E8F9", // carbon — light cyan
  atomN: "#38BDF8", // nitrogen — sky blue
  atomO: "#0EA5E9", // oxygen — deeper blue
  atomP: "#0284C7", // phosphorus — darkest blue
  finalBlue: "#0EA5E9", // the "whole screen blue" value
};

// ---------- Keyframes ----------------------------------------------------

export type Keyframe = {
  progress: number;
  cameraPos: Vector3;
  cameraLookAt: Vector3;
  studioOpacity: number;       // 1.0 = studio hero visible, 0 = gone
  bgColor: string;             // CSS color for the page background under the canvas
  blueOverlay: number;         // fullscreen blue divisor: 0..1
  atomOpacity: number;         // CPK atoms fade in
  callouts: {
    backbone: number;
    hbonds: number;
    adenine: number;
    thymine: number;
    cytosine: number;
    guanine: number;
  };
};

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
const NO_CALLOUTS = {
  backbone: 0,
  hbonds: 0,
  adenine: 0,
  thymine: 0,
  cytosine: 0,
  guanine: 0,
};

export const KEYFRAMES: Keyframe[] = [
  // 0% — studio hero, DNA renders left side of viewport, small
  {
    progress: 0.0,
    cameraPos: v(2.2, 0, 7.2),
    cameraLookAt: v(0, 0, 0),
    studioOpacity: 1,
    bgColor: "#FFFFFF",
    blueOverlay: 0,
    atomOpacity: 0,
    callouts: NO_CALLOUTS,
  },
  // 10% — studio text fully faded; camera holds
  {
    progress: 0.1,
    cameraPos: v(2.0, 0, 7.0),
    cameraLookAt: v(0, 0, 0),
    studioOpacity: 0,
    bgColor: "#FFFFFF",
    blueOverlay: 0,
    atomOpacity: 0,
    callouts: NO_CALLOUTS,
  },
  // 22% — DNA centers and grows; structure callouts fade in
  {
    progress: 0.22,
    cameraPos: v(0.3, 0, 5.5),
    cameraLookAt: v(0, 0, 0),
    studioOpacity: 0,
    bgColor: "#FFFFFF",
    blueOverlay: 0,
    atomOpacity: 0,
    callouts: { ...NO_CALLOUTS, backbone: 1, hbonds: 1 },
  },
  // 35% — closer; backbone/hbonds out, base callouts in
  {
    progress: 0.35,
    cameraPos: v(0, 0, 4.2),
    cameraLookAt: v(0, 0, 0),
    studioOpacity: 0,
    bgColor: "#F8FAFC",
    blueOverlay: 0,
    atomOpacity: 0.2,
    callouts: {
      backbone: 0,
      hbonds: 0,
      adenine: 1,
      thymine: 1,
      cytosine: 1,
      guanine: 1,
    },
  },
  // 50% — base callouts out, atoms emerging, bg cooling toward blue
  {
    progress: 0.5,
    cameraPos: v(0.2, 0.05, 3.0),
    cameraLookAt: v(0.2, 0.05, 0),
    studioOpacity: 0,
    bgColor: "#EFF6FF",
    blueOverlay: 0,
    atomOpacity: 0.7,
    callouts: NO_CALLOUTS,
  },
  // 65% — leaning toward target base pair, atoms full
  {
    progress: 0.65,
    cameraPos: v(0.45, 0.12, 2.0),
    cameraLookAt: v(0.5, 0.15, 0.2),
    studioOpacity: 0,
    bgColor: "#DBEAFE",
    blueOverlay: 0,
    atomOpacity: 1,
    callouts: NO_CALLOUTS,
  },
  // 78% — diving toward target atom
  {
    progress: 0.78,
    cameraPos: v(
      TARGET_ATOM_WORLD[0] - 0.25,
      TARGET_ATOM_WORLD[1] + 0.08,
      TARGET_ATOM_WORLD[2] + 0.45,
    ),
    cameraLookAt: v(...TARGET_ATOM_WORLD),
    studioOpacity: 0,
    bgColor: "#93C5FD",
    blueOverlay: 0.15,
    atomOpacity: 1,
    callouts: NO_CALLOUTS,
  },
  // 90% — basically touching it; the blue overlay is doing the rest
  {
    progress: 0.9,
    cameraPos: v(
      TARGET_ATOM_WORLD[0] - 0.05,
      TARGET_ATOM_WORLD[1] + 0.02,
      TARGET_ATOM_WORLD[2] + 0.18,
    ),
    cameraLookAt: v(...TARGET_ATOM_WORLD),
    studioOpacity: 0,
    bgColor: "#60A5FA",
    blueOverlay: 0.6,
    atomOpacity: 1,
    callouts: NO_CALLOUTS,
  },
  // 96% — whole screen blue
  {
    progress: 0.96,
    cameraPos: v(...TARGET_ATOM_WORLD),
    cameraLookAt: v(...TARGET_ATOM_WORLD),
    studioOpacity: 0,
    bgColor: COLORS.finalBlue,
    blueOverlay: 1,
    atomOpacity: 1,
    callouts: NO_CALLOUTS,
  },
  // 100% — blue menu fully revealed
  {
    progress: 1.0,
    cameraPos: v(...TARGET_ATOM_WORLD),
    cameraLookAt: v(...TARGET_ATOM_WORLD),
    studioOpacity: 0,
    bgColor: COLORS.finalBlue,
    blueOverlay: 1,
    atomOpacity: 1,
    callouts: NO_CALLOUTS,
  },
];

// ---------- Animation helpers --------------------------------------------

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Hex → {r,g,b} 0-255
export function hexRgb(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  return [
    parseInt(m.slice(0, 2), 16),
    parseInt(m.slice(2, 4), 16),
    parseInt(m.slice(4, 6), 16),
  ];
}

export function lerpHex(a: string, b: string, t: number): string {
  const ca = hexRgb(a);
  const cb = hexRgb(b);
  return `rgb(${Math.round(lerp(ca[0], cb[0], t))}, ${Math.round(lerp(ca[1], cb[1], t))}, ${Math.round(lerp(ca[2], cb[2], t))})`;
}

// Find the surrounding two keyframes and return the eased interpolation
// fraction between them.
export function findKfWindow(progress: number): {
  a: Keyframe;
  b: Keyframe;
  t: number;
  easedT: number;
} {
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    const a = KEYFRAMES[i];
    const b = KEYFRAMES[i + 1];
    if (progress >= a.progress && progress <= b.progress) {
      const t = (progress - a.progress) / (b.progress - a.progress);
      return { a, b, t, easedT: easeInOutCubic(t) };
    }
  }
  const last = KEYFRAMES[KEYFRAMES.length - 1];
  return { a: last, b: last, t: 1, easedT: 1 };
}

// Common scalar interpolation across keyframes.
export function interpolateScalar(
  progress: number,
  pick: (kf: Keyframe) => number,
): number {
  const { a, b, easedT } = findKfWindow(progress);
  return lerp(pick(a), pick(b), easedT);
}
