// All scroll-driven hero tuning lives here. Most of these knobs are exposed
// so the visual can be tightened without touching the scene code.

import { Vector3 } from "three";

// ---------- DNA geometry --------------------------------------------------

export const DNA = {
  nBasePairs: 24,
  nBasePairsMobile: 12,
  helixRadius: 1.0,
  risePerBp: 0.34,             // Å-style "rise" between stacked base pairs
  twistPerBpDeg: 36,           // 10 bp / turn — biologically accurate B-DNA
  backboneTubeRadius: 0.085,
  rungRadius: 0.05,
  wireframeScale: 1.02,
  wireframeOpacity: 0.22,
};
export const DNA_HEIGHT = DNA.nBasePairs * DNA.risePerBp;
export const DNA_TWIST_RAD = (DNA.twistPerBpDeg * Math.PI) / 180;

// ---------- Colors --------------------------------------------------------

export const COLORS = {
  // Deep navy → near-black background
  bgTop: "#020617",
  bgBottom: "#000814",
  // Deep-dive background — light blue
  bgDeepTop: "#DBEAFE",
  bgDeepBottom: "#C7E0F8",
  // Backbone material
  backbone: "#0EA5E9",
  backboneEmissive: "#0284C7",
  // Rungs
  rungA: "#67E8F9",
  rungB: "#0EA5E9",
  rungEmissive: "#0284C7",
  // Wireframe overlay
  wireframe: "#38BDF8",
  // Particles
  bokeh: "#7DD3FC",
  highlightedBasePair: "#A5F3FC",
};

// ---------- Idle motion ---------------------------------------------------

export const IDLE = {
  rotationRadPerSec: 0.1,      // ~one rotation per 63s
  bobAmplitude: 0.05,
  bobPeriodSec: 6,
};

// ---------- Camera keyframes ---------------------------------------------

export type Keyframe = {
  progress: number;
  cameraPosition: Vector3;
  cameraLookAt: Vector3;
  dnaOpacity: number;
  highlightBpIndex: number | null; // for keyframe 3 — index of the base pair to keep bright
  bgInterp: number;                // 0 = dark, 1 = light blue
};

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

// Centerable keyframes. localT eases between consecutive ones with cubic ease.
export const KEYFRAMES: Keyframe[] = [
  // 0% — establishing shot
  {
    progress: 0.0,
    cameraPosition: v(0, 0, 6),
    cameraLookAt: v(0, 0, 0),
    dnaOpacity: 1,
    highlightBpIndex: null,
    bgInterp: 0,
  },
  // 20% — structure callouts
  {
    progress: 0.2,
    cameraPosition: v(0.5, 0, 4.5),
    cameraLookAt: v(0, 0, 0),
    dnaOpacity: 1,
    highlightBpIndex: null,
    bgInterp: 0,
  },
  // 40% — the four bases
  {
    progress: 0.4,
    cameraPosition: v(1, 0.1, 3.5),
    cameraLookAt: v(0, 0, 0),
    dnaOpacity: 1,
    highlightBpIndex: null,
    bgInterp: 0,
  },
  // 60% — single base pair highlighted
  {
    progress: 0.6,
    cameraPosition: v(0.5, 0, 2.5),
    cameraLookAt: v(0, 0, 0),
    dnaOpacity: 0.4,
    highlightBpIndex: 12, // middle of the 24
    bgInterp: 0,
  },
  // 80% — start the dive
  {
    progress: 0.85,
    cameraPosition: v(0.2, 0, 1.2),
    cameraLookAt: v(0, 0, 0),
    dnaOpacity: 0.15,
    highlightBpIndex: 12,
    bgInterp: 0.5,
  },
  // 100% — deep-dive ready
  {
    progress: 1.0,
    cameraPosition: v(0, 0, 0.4),
    cameraLookAt: v(0, 0, 0),
    dnaOpacity: 0,
    highlightBpIndex: 12,
    bgInterp: 1,
  },
];

// ---------- Annotation visibility windows --------------------------------

export type AnnotationVisibility = {
  fadeIn: number;   // progress at which opacity hits 1
  fadeOut: number;  // progress at which opacity hits 0 again
  showFrom: number; // begin fading in
  hideAt: number;   // fully gone
};

// Each named entry is one annotation we render. Anchor positions live in
// the scene component; visibility timing lives here.
export const ANNOTATION_TIMING: Record<string, AnnotationVisibility> = {
  backbone: { showFrom: 0.12, fadeIn: 0.2, fadeOut: 0.32, hideAt: 0.38 },
  hbonds: { showFrom: 0.12, fadeIn: 0.2, fadeOut: 0.32, hideAt: 0.38 },
  adenine: { showFrom: 0.32, fadeIn: 0.42, fadeOut: 0.55, hideAt: 0.6 },
  thymine: { showFrom: 0.32, fadeIn: 0.42, fadeOut: 0.55, hideAt: 0.6 },
  cytosine: { showFrom: 0.34, fadeIn: 0.44, fadeOut: 0.55, hideAt: 0.6 },
  guanine: { showFrom: 0.34, fadeIn: 0.44, fadeOut: 0.55, hideAt: 0.6 },
  hbondsClose: { showFrom: 0.56, fadeIn: 0.62, fadeOut: 0.78, hideAt: 0.82 },
};

// ---------- Headline copy windows ----------------------------------------

export const COPY_WINDOWS = [
  {
    showFrom: 0.0,
    fadeIn: 0.04,
    fadeOut: 0.16,
    hideAt: 0.2,
    eyebrow: "Chapter one — DNA",
    heading: "The language of life, in motion.",
    body: "Twisted into a helix nature has used for four billion years.",
  },
  {
    showFrom: 0.18,
    fadeIn: 0.24,
    fadeOut: 0.36,
    hideAt: 0.4,
    eyebrow: "Structure",
    heading: "Two strands. One ladder.",
    body: "DNA stores information in a four-letter code, twisted into a helix nature has used for four billion years.",
  },
  {
    showFrom: 0.38,
    fadeIn: 0.44,
    fadeOut: 0.56,
    hideAt: 0.6,
    eyebrow: "The alphabet",
    heading: "Four letters.",
    body: "Adenine pairs with thymine. Cytosine pairs with guanine. Every gene in every organism is written in this alphabet.",
  },
  {
    showFrom: 0.58,
    fadeIn: 0.64,
    fadeOut: 0.78,
    hideAt: 0.82,
    eyebrow: "The bond",
    heading: "Strong enough together. Weak enough to break.",
    body: "Two or three hydrogen bonds per pair. Weak enough to come apart for copying, strong enough together to hold a gene stable for a lifetime.",
  },
];

// ---------- Animation utilities -------------------------------------------

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// Compute fade opacity from a visibility window and current progress.
export function fadeFromWindow(
  progress: number,
  w: { showFrom: number; fadeIn: number; fadeOut: number; hideAt: number },
): number {
  if (progress < w.showFrom || progress > w.hideAt) return 0;
  if (progress < w.fadeIn) return smoothstep(w.showFrom, w.fadeIn, progress);
  if (progress > w.fadeOut) return 1 - smoothstep(w.fadeOut, w.hideAt, progress);
  return 1;
}
