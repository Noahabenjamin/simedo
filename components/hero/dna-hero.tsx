"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { DNAModel } from "./dna-model";
import { HeroAtmosphere } from "./hero-atmosphere";
import { HeroPostEffects } from "./hero-post-effects";
import { HeroAnnotation } from "./hero-annotation";
import { AdenineSVG } from "./chemicals/adenine";
import { ThymineSVG } from "./chemicals/thymine";
import { CytosineSVG } from "./chemicals/cytosine";
import { GuanineSVG } from "./chemicals/guanine";
import { useHeroScroll } from "./hero-scroll";
import {
  ANNOTATION_TIMING,
  COLORS,
  COPY_WINDOWS,
  DNA,
  DNA_HEIGHT,
  DNA_TWIST_RAD,
  KEYFRAMES,
  easeInOutCubic,
  fadeFromWindow,
} from "./hero-config";

// The cinematic scroll-driven DNA hero.
//
// Outer layout:
//   <section ref={heroRef} className="h-[400vh]">         ← scroll container
//     <div className="sticky top-0 h-screen">              ← sticky stage
//       background gradient — interpolates dark→light at keyframe 4
//       <Canvas>                                            ← R3F scene
//         <DNAModel/>
//         atmosphere, post-effects, annotations (via Drei <Html>)
//       </Canvas>
//       text overlay — eyebrow / heading / body per scroll window
//     </div>
//   </section>
//
// All scroll progress flows through one ref (no re-renders in 3D) and one
// useState (for DOM overlays).

const HERO_HEIGHT_VH = 400;

export function DNAHero() {
  const heroRef = useRef<HTMLElement>(null);
  const { progress, progressRef } = useHeroScroll(heroRef);

  // Mobile detection (drives geometry + postFX reduction).
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const nBp = isMobile ? DNA.nBasePairsMobile : DNA.nBasePairs;
  const particleCount = isMobile ? 10 : 40;

  // Background gradient interpolates from dark navy to light blue across
  // keyframe 4. CSS does the actual paint; we just compute the colors.
  const bg = useMemo(() => interpolateBg(progress), [progress]);

  return (
    <section
      ref={heroRef}
      className="relative w-full"
      style={{ height: `${HERO_HEIGHT_VH}vh` }}
    >
      <div
        className="sticky top-0 h-screen w-full overflow-hidden"
        style={{ background: bg }}
      >
        <Canvas
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
          style={{ position: "absolute", inset: 0 }}
        >
          <SceneCameraRig progressRef={progressRef} />

          <HeroAtmosphere particleCount={particleCount} />
          <DNAModel progressRef={progressRef} nBasePairs={nBp} />
          <AnnotationLayer progress={progress} nBp={nBp} />

          <HeroPostEffects enableHeavy={!isMobile} />
        </Canvas>

        {/* Copy overlay */}
        <CopyOverlay progress={progress} />

        {/* Scroll hint at the very start */}
        <ScrollHint progress={progress} />
      </div>
    </section>
  );
}

// ---------- Camera rig --------------------------------------------------

function SceneCameraRig({
  progressRef,
}: {
  progressRef: React.RefObject<number>;
}) {
  const camRef = useRef<THREE.PerspectiveCamera>(null);
  const fogTarget = useThree((s) => s.scene.fog);
  const fogColor = useMemo(() => new THREE.Color(COLORS.bgBottom), []);
  const fogColorLight = useMemo(() => new THREE.Color(COLORS.bgDeepBottom), []);

  useFrame(() => {
    if (!camRef.current) return;
    const p = progressRef.current ?? 0;

    // Camera position interpolation.
    for (let i = 0; i < KEYFRAMES.length - 1; i++) {
      const a = KEYFRAMES[i];
      const b = KEYFRAMES[i + 1];
      if (p >= a.progress && p <= b.progress) {
        const t = (p - a.progress) / (b.progress - a.progress);
        const eased = easeInOutCubic(t);
        camRef.current.position.lerpVectors(
          a.cameraPosition,
          b.cameraPosition,
          eased,
        );
        const lookAt = a.cameraLookAt
          .clone()
          .lerp(b.cameraLookAt, eased);
        camRef.current.lookAt(lookAt);
        break;
      }
    }

    // Fog colour follows the bg gradient.
    const bgInterp = interpolateBgInterp(p);
    if (fogTarget && "color" in fogTarget) {
      (fogTarget as THREE.Fog).color
        .copy(fogColor)
        .lerp(fogColorLight, bgInterp);
    }
  });

  return (
    <PerspectiveCamera
      ref={camRef}
      makeDefault
      position={[0, 0, 6]}
      fov={50}
      near={0.1}
      far={50}
    />
  );
}

// ---------- Annotations -------------------------------------------------

function AnnotationLayer({
  progress,
  nBp,
}: {
  progress: number;
  nBp: number;
}) {
  // Anchor positions on the helix surface. We position them at fixed Y
  // values so they don't drift with the auto-spin of the model (the model
  // group's rotation doesn't affect the world-space anchor — we want this).
  const halfH = (nBp * DNA.risePerBp) / 2;

  // Pick a base pair index roughly in the middle for the close-up callouts.
  const midIndex = Math.floor(nBp / 2);
  const midY = midIndex * DNA.risePerBp - halfH + DNA.risePerBp / 2;
  const midAngle = midIndex * DNA_TWIST_RAD;

  // Anchor on the outer surface of the helix at the chosen angle.
  const midAnchor = new THREE.Vector3(
    Math.cos(midAngle) * (DNA.helixRadius + 0.1),
    midY,
    Math.sin(midAngle) * (DNA.helixRadius + 0.1),
  );
  const oppositeAnchor = new THREE.Vector3(
    Math.cos(midAngle + Math.PI) * (DNA.helixRadius + 0.1),
    midY,
    Math.sin(midAngle + Math.PI) * (DNA.helixRadius + 0.1),
  );

  // For the four-base layout, fan out around the helix at varying Y.
  const baseAnchors = useMemo(() => {
    return {
      adenine: new THREE.Vector3(DNA.helixRadius + 0.2, halfH * 0.5, 0),
      thymine: new THREE.Vector3(-(DNA.helixRadius + 0.2), halfH * 0.5, 0),
      cytosine: new THREE.Vector3(DNA.helixRadius + 0.2, -halfH * 0.5, 0),
      guanine: new THREE.Vector3(-(DNA.helixRadius + 0.2), -halfH * 0.5, 0),
    };
  }, [halfH]);

  return (
    <>
      <HeroAnnotation
        anchor={midAnchor}
        visible={fadeFromWindow(progress, ANNOTATION_TIMING.backbone)}
        label="Sugar-phosphate backbone"
        side="right"
      />
      <HeroAnnotation
        anchor={oppositeAnchor}
        visible={fadeFromWindow(progress, ANNOTATION_TIMING.hbonds)}
        label="Hydrogen bonds"
        side="left"
      />

      <HeroAnnotation
        anchor={baseAnchors.adenine}
        visible={fadeFromWindow(progress, ANNOTATION_TIMING.adenine)}
        label="Adenine"
        side="right"
      >
        <AdenineSVG />
      </HeroAnnotation>
      <HeroAnnotation
        anchor={baseAnchors.thymine}
        visible={fadeFromWindow(progress, ANNOTATION_TIMING.thymine)}
        label="Thymine"
        side="left"
      >
        <ThymineSVG />
      </HeroAnnotation>
      <HeroAnnotation
        anchor={baseAnchors.cytosine}
        visible={fadeFromWindow(progress, ANNOTATION_TIMING.cytosine)}
        label="Cytosine"
        side="right"
      >
        <CytosineSVG />
      </HeroAnnotation>
      <HeroAnnotation
        anchor={baseAnchors.guanine}
        visible={fadeFromWindow(progress, ANNOTATION_TIMING.guanine)}
        label="Guanine"
        side="left"
      >
        <GuanineSVG />
      </HeroAnnotation>

      <HeroAnnotation
        anchor={midAnchor}
        visible={fadeFromWindow(progress, ANNOTATION_TIMING.hbondsClose)}
        label="2–3 H-bonds per pair"
        side="right"
      />
    </>
  );
}

// ---------- Copy overlay (eyebrow / heading / body cross-fade) -----------

function CopyOverlay({ progress }: { progress: number }) {
  const fades = COPY_WINDOWS.map((w) => fadeFromWindow(progress, w));
  const bgInterp = interpolateBgInterp(progress);
  const textColor =
    bgInterp < 0.4
      ? "#FAFAFA"
      : interpolateColor("#FAFAFA", "#0A0A0A", (bgInterp - 0.4) / 0.6);
  const subColor =
    bgInterp < 0.4
      ? "#A3A3A3"
      : interpolateColor("#A3A3A3", "#525252", (bgInterp - 0.4) / 0.6);

  return (
    <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-20 sm:items-center sm:pb-0">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 text-center">
        {COPY_WINDOWS.map((w, i) => (
          <motion.div
            key={i}
            initial={false}
            animate={{ opacity: fades[i] }}
            transition={{ duration: 0.2 }}
            style={{
              position: "absolute",
              pointerEvents: fades[i] > 0.5 ? "auto" : "none",
            }}
          >
            <div
              className="font-mono text-[11px] uppercase tracking-[0.18em]"
              style={{ color: subColor }}
            >
              {w.eyebrow}
            </div>
            <h1
              className="mt-4 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] sm:text-5xl lg:text-6xl"
              style={{ color: textColor }}
            >
              {w.heading}
            </h1>
            <p
              className="mx-auto mt-4 max-w-xl text-sm leading-relaxed sm:text-base"
              style={{ color: subColor }}
            >
              {w.body}
            </p>
            {i === 0 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <Link
                  href="/browse"
                  className="pointer-events-auto rounded-full bg-white/95 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white"
                >
                  Explore simulations
                </Link>
                <Link
                  href="/upload"
                  className="pointer-events-auto rounded-full border border-white/40 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/80"
                >
                  Upload yours
                </Link>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ScrollHint({ progress }: { progress: number }) {
  const opacity = progress < 0.05 ? 1 - progress / 0.05 : 0;
  if (opacity <= 0) return null;
  return (
    <div
      className="pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
      style={{ opacity }}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">
        Scroll
      </span>
      <div className="h-8 w-px animate-pulse bg-white/40" />
    </div>
  );
}

// ---------- Color helpers ---------------------------------------------

function interpolateBgInterp(progress: number): number {
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    const a = KEYFRAMES[i];
    const b = KEYFRAMES[i + 1];
    if (progress >= a.progress && progress <= b.progress) {
      const t = (progress - a.progress) / (b.progress - a.progress);
      return a.bgInterp + (b.bgInterp - a.bgInterp) * easeInOutCubic(t);
    }
  }
  return KEYFRAMES[KEYFRAMES.length - 1].bgInterp;
}

function interpolateBg(progress: number): string {
  const t = interpolateBgInterp(progress);
  const top = interpolateColor(COLORS.bgTop, COLORS.bgDeepTop, t);
  const bot = interpolateColor(COLORS.bgBottom, COLORS.bgDeepBottom, t);
  return `linear-gradient(180deg, ${top} 0%, ${bot} 100%)`;
}

function interpolateColor(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const r = Math.round(ca.r + (cb.r - ca.r) * t);
  const g = Math.round(ca.g + (cb.g - ca.g) * t);
  const bl = Math.round(ca.b + (cb.b - ca.b) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = hex.replace("#", "");
  return {
    r: parseInt(m.slice(0, 2), 16),
    g: parseInt(m.slice(2, 4), 16),
    b: parseInt(m.slice(4, 6), 16),
  };
}

// Silence unused-warning for DNA_HEIGHT (used only via constants elsewhere).
void DNA_HEIGHT;
