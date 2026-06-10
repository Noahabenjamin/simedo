// Single source of truth for the hero sequence's scroll-driven keyframes.
// All numbers here can be tuned without touching scene code.

import { Vector3 } from "three";

// DNA geometry — long strand so the visible window never reaches the top
// or bottom of the helix during the opening's pulled-up motion.
export const DNA = {
  nBp: 50,
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

// Middle of the strand — the base pair the camera dives into.
export const TARGET_BP_INDEX = 25;

// Y coordinate of the target base pair's geometric center on the helix.
export const TARGET_BP_Y =
  TARGET_BP_INDEX * DNA.risePerBp -
  DNA_HEIGHT / 2 +
  DNA.risePerBp / 2;

// The point the camera dives toward at the end of the sequence. We target
// the CENTER of the base pair (on the helix axis, x=z=0) rather than the
// rung end at a backbone — that keeps the target invariant under any
// rotation of the helix, so the camera can lock onto it cleanly.
export const TARGET_ATOM_WORLD: [number, number, number] = [
  0,
  TARGET_BP_Y,
  0,
];

export const COLORS = {
  backbone: "#22D3EE",
  backboneEmissive: "#0EA5E9",
  rung: "#7DD3FC",
  rungEmissive: "#0EA5E9",
  atomC: "#67E8F9",
  atomN: "#38BDF8",
  atomO: "#0EA5E9",
  atomP: "#0284C7",
  flashCyan: "#0EA5E9", // brief flash overlay at peak of the dive
  darkVista: "#040814", // dark navy backdrop for the end vista
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
};

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

// The hero sequence is one continuous shot in three beats:
//  1. Open — DNA shoved to the left of the viewport, slowly rotating
//     while the studio hero text reads over the top.
//  2. Approach + dive — camera centers, tilts toward the target base pair,
//     and dives into the molecular adenine/thymine pair. A brief cyan
//     flash marks the moment of impact.
//  3. Vista — camera pulls back rapidly into a dark, particle-strewn
//     backdrop where smaller helixes drift behind the menu.
//
// The Catmull-Rom spline in `evalCameraAtProgress` smooths velocity across
// all of these waypoints, so the motion reads as one continuous swoop.
export const KEYFRAMES: Keyframe[] = [
  // 0% — studio hero; DNA framed on far-left of viewport (look point shoved
  //       right so the helix lives in the left third).
  {
    progress: 0.0,
    cameraPos: v(2.4, 0, 7.4),
    cameraLookAt: v(1.4, 0, 0),
    studioOpacity: 1,
    bgColor: "#FFFFFF",
    blueOverlay: 0,
    atomOpacity: 0,
  },
  // 14% — studio text fades; helix still on the left, camera glides slightly
  //       closer.
  {
    progress: 0.14,
    cameraPos: v(2.2, 0.05, 7.0),
    cameraLookAt: v(1.1, 0.05, 0),
    studioOpacity: 0,
    bgColor: "#FAFBFD",
    blueOverlay: 0,
    atomOpacity: 0,
  },
  // 34% — DNA glides toward center; camera approaches the strand.
  {
    progress: 0.34,
    cameraPos: v(0.4, 0.18, 4.6),
    cameraLookAt: v(0.05, TARGET_BP_Y * 0.35, 0),
    studioOpacity: 0,
    bgColor: "#E3ECF6",
    blueOverlay: 0,
    atomOpacity: 0.1,
  },
  // 54% — molecular structure starts to crystallise; bg cools to navy.
  {
    progress: 0.54,
    cameraPos: v(0.05, TARGET_BP_Y + 0.55, 2.4),
    cameraLookAt: v(0, TARGET_BP_Y, 0),
    studioOpacity: 0,
    bgColor: "#3F5F8E",
    blueOverlay: 0,
    atomOpacity: 0.55,
  },
  // 68% — leaning in to read the A-T pair; tilt continues toward top-down.
  {
    progress: 0.68,
    cameraPos: v(0.08, TARGET_BP_Y + 0.85, 1.25),
    cameraLookAt: v(0, TARGET_BP_Y, 0),
    studioOpacity: 0,
    bgColor: "#1A2F54",
    blueOverlay: 0,
    atomOpacity: 1,
  },
  // 80% — dive begins; flash builds.
  {
    progress: 0.8,
    cameraPos: v(0.04, TARGET_BP_Y + 0.32, 0.42),
    cameraLookAt: v(0, TARGET_BP_Y, 0),
    studioOpacity: 0,
    bgColor: "#0B1A37",
    blueOverlay: 0.5,
    atomOpacity: 1,
  },
  // 86% — peak of dive; brief full cyan flash (the moment of impact).
  {
    progress: 0.86,
    cameraPos: v(0.005, TARGET_BP_Y + 0.06, 0.06),
    cameraLookAt: v(0, TARGET_BP_Y, 0),
    studioOpacity: 0,
    bgColor: "#08152D",
    blueOverlay: 1,
    atomOpacity: 1,
  },
  // 93% — pulling back. Flash dissolves. We're outside the helix now,
  //       looking back at the strand against the dark vista.
  {
    progress: 0.93,
    cameraPos: v(-2.2, TARGET_BP_Y + 1.8, 6.0),
    cameraLookAt: v(0, 0, 0),
    studioOpacity: 0,
    bgColor: COLORS.darkVista,
    blueOverlay: 0.18,
    atomOpacity: 1,
  },
  // 100% — vista locked. Helix small on the right, menu reads on the left.
  {
    progress: 1.0,
    cameraPos: v(-3.6, TARGET_BP_Y + 2.6, 10.0),
    cameraLookAt: v(0.4, 0, 0),
    studioOpacity: 0,
    bgColor: COLORS.darkVista,
    blueOverlay: 0,
    atomOpacity: 1,
  },
];

// ---------- Animation helpers --------------------------------------------

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Smoother than cubic — gentler accel at the edges, sharper transition in
// the middle. Used for scroll-driven fades so the studio-out / vista-in
// reads as silk rather than a step.
export function easeInOutQuintic(t: number): number {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
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
      return { a, b, t, easedT: easeInOutQuintic(t) };
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

// ---------- Camera spline ------------------------------------------------
// Catmull-Rom (uniform) cubic interpolation between four control points.
// Gives C1 continuity across keyframe boundaries — no velocity reset, no
// "kink" feel when the camera transitions between segments.

function catmullRomVec3(
  p0: Vector3,
  p1: Vector3,
  p2: Vector3,
  p3: Vector3,
  t: number,
  out: Vector3,
): void {
  const t2 = t * t;
  const t3 = t2 * t;
  out.set(
    0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
    0.5 *
      (2 * p1.z +
        (-p0.z + p2.z) * t +
        (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 +
        (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3),
  );
}

// Compute camera position and lookAt at a given global progress using a
// continuous Catmull-Rom spline through the keyframes. Output vectors are
// mutated in place to avoid per-frame allocations.
export function evalCameraAtProgress(
  progress: number,
  outPos: Vector3,
  outLook: Vector3,
): void {
  const n = KEYFRAMES.length;
  let i = 0;
  for (; i < n - 1; i++) {
    if (progress <= KEYFRAMES[i + 1].progress) break;
  }
  i = Math.min(i, n - 2);

  const k1 = KEYFRAMES[i];
  const k2 = KEYFRAMES[i + 1];
  const k0 = KEYFRAMES[Math.max(0, i - 1)];
  const k3 = KEYFRAMES[Math.min(n - 1, i + 2)];

  const span = k2.progress - k1.progress || 1;
  const t = Math.max(0, Math.min(1, (progress - k1.progress) / span));

  catmullRomVec3(k0.cameraPos, k1.cameraPos, k2.cameraPos, k3.cameraPos, t, outPos);
  catmullRomVec3(
    k0.cameraLookAt,
    k1.cameraLookAt,
    k2.cameraLookAt,
    k3.cameraLookAt,
    t,
    outLook,
  );
}
