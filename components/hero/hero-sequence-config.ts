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

// Camera tilts gradually from a forward, slightly-elevated viewpoint down
// into a top-down view of the target base pair. The spline interpolation
// in `evalCameraAtProgress` keeps velocities continuous across all of
// these waypoints, so the motion reads as one swoop rather than a chain
// of segments.
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
  // 10% — studio text fully faded; camera drifts slightly closer
  {
    progress: 0.1,
    cameraPos: v(1.8, 0.05, 6.6),
    cameraLookAt: v(0, 0.05, 0),
    studioOpacity: 0,
    bgColor: "#FFFFFF",
    blueOverlay: 0,
    atomOpacity: 0,
    callouts: NO_CALLOUTS,
  },
  // 22% — DNA centers and grows; structure callouts fade in
  {
    progress: 0.22,
    cameraPos: v(0.25, 0.12, 5.0),
    cameraLookAt: v(0, 0.12, 0),
    studioOpacity: 0,
    bgColor: "#FAFCFF",
    blueOverlay: 0,
    atomOpacity: 0,
    callouts: { ...NO_CALLOUTS, backbone: 1, hbonds: 1 },
  },
  // 35% — closer; backbone/hbonds out, base callouts in
  {
    progress: 0.35,
    cameraPos: v(0, 0.25, 3.8),
    cameraLookAt: v(0, TARGET_BP_Y * 0.6, 0),
    studioOpacity: 0,
    bgColor: "#F4F8FF",
    blueOverlay: 0,
    atomOpacity: 0,
    callouts: {
      backbone: 0,
      hbonds: 0,
      adenine: 1,
      thymine: 1,
      cytosine: 1,
      guanine: 1,
    },
  },
  // 50% — base callouts out, base pair molecular structure starts emerging
  {
    progress: 0.5,
    cameraPos: v(0.05, TARGET_BP_Y + 0.55, 2.4),
    cameraLookAt: v(0, TARGET_BP_Y, 0),
    studioOpacity: 0,
    bgColor: "#EBF3FF",
    blueOverlay: 0,
    atomOpacity: 0.4,
    callouts: NO_CALLOUTS,
  },
  // 65% — leaning into the base pair; tilt continues toward top-down
  {
    progress: 0.65,
    cameraPos: v(0.08, TARGET_BP_Y + 0.85, 1.25),
    cameraLookAt: v(0, TARGET_BP_Y, 0),
    studioOpacity: 0,
    bgColor: "#DBEAFE",
    blueOverlay: 0,
    atomOpacity: 1,
    callouts: NO_CALLOUTS,
  },
  // 78% — diving onto the base pair from above-and-slightly-front
  {
    progress: 0.78,
    cameraPos: v(0.04, TARGET_BP_Y + 0.42, 0.55),
    cameraLookAt: v(0, TARGET_BP_Y, 0),
    studioOpacity: 0,
    bgColor: "#A7C5FA",
    blueOverlay: 0.12,
    atomOpacity: 1,
    callouts: NO_CALLOUTS,
  },
  // 90% — essentially touching; the blue overlay is doing the rest
  {
    progress: 0.9,
    cameraPos: v(0.01, TARGET_BP_Y + 0.14, 0.12),
    cameraLookAt: v(0, TARGET_BP_Y, 0),
    studioOpacity: 0,
    bgColor: "#60A5FA",
    blueOverlay: 0.6,
    atomOpacity: 1,
    callouts: NO_CALLOUTS,
  },
  // 96% — whole screen blue
  {
    progress: 0.96,
    cameraPos: v(0, TARGET_BP_Y + 0.04, 0.03),
    cameraLookAt: v(0, TARGET_BP_Y, 0),
    studioOpacity: 0,
    bgColor: COLORS.finalBlue,
    blueOverlay: 1,
    atomOpacity: 1,
    callouts: NO_CALLOUTS,
  },
  // 100% — blue menu fully revealed
  {
    progress: 1.0,
    cameraPos: v(0, TARGET_BP_Y + 0.04, 0.03),
    cameraLookAt: v(0, TARGET_BP_Y, 0),
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
