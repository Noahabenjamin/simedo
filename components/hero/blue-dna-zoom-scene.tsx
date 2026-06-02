"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, PerspectiveCamera } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  COLORS,
  DNA,
  DNA_HEIGHT,
  DNA_TWIST_RAD,
  TARGET_BP_INDEX,
  evalCameraAtProgress,
  findKfWindow,
  lerp,
  smoothstep,
} from "./hero-sequence-config";
import { TargetBasePair } from "./target-base-pair";
import { BackgroundHelixes } from "./background-helixes";
import { Particles } from "./particles";

// R3F scene driven entirely by `progressRef.current`. No React re-renders
// during scroll inside the 3D subtree.
//
//   group
//     backboneA      — TubeGeometry, glossy clear-coat
//     backboneB      — TubeGeometry, glossy clear-coat
//     rungs          — group of cylinders, except the target rung is
//                      replaced by <TargetBasePair /> at the same y
//     TargetBasePair — adenine + thymine ball-and-stick at target bp
//
// Lighting: ambient + key directional + cool fill + an Environment HDR
// for proper specular reflections on the clear-coat materials.

type Props = {
  progressRef: React.RefObject<number>;
  // `lite` skips post-processing and the HDR environment, and serves
  // fewer particles — used on narrow viewports and on devices that flag
  // themselves as low-end so we keep the hero responsive.
  lite?: boolean;
};

export function BlueDnaZoomScene({ progressRef, lite = false }: Props) {
  return (
    <Canvas
      gl={{ antialias: true, alpha: true, toneMappingExposure: 1.05 }}
      dpr={lite ? [1, 1.5] : [1, 2]}
      style={{ position: "absolute", inset: 0 }}
    >
      <CameraRig progressRef={progressRef} />

      <ambientLight intensity={0.25} color="#CFE5F5" />
      <directionalLight
        position={[4, 5, 4]}
        intensity={1.0}
        color="#E2EEF8"
      />
      <directionalLight
        position={[-3, -2, 4]}
        intensity={0.45}
        color="#7DD3FC"
      />
      <pointLight position={[0, 0, 3]} intensity={0.25} color="#BAE6FD" />

      {/* Environment HDR for subtle specular reflections — skipped in
          lite mode to keep the initial paint cheap on mobile. */}
      {!lite && (
        <Suspense fallback={null}>
          <Environment
            preset="studio"
            background={false}
            environmentIntensity={0.4}
          />
        </Suspense>
      )}

      <DnaGroup progressRef={progressRef}>
        <TargetBasePair progressRef={progressRef} />
      </DnaGroup>

      <BackgroundHelixes />
      <Particles lite={lite} />

      {!lite && (
        <EffectComposer multisampling={2}>
          <Bloom
            intensity={0.65}
            luminanceThreshold={0.55}
            luminanceSmoothing={0.9}
            mipmapBlur
            radius={0.7}
          />
        </EffectComposer>
      )}
    </Canvas>
  );
}

// ---------- Camera rig --------------------------------------------------

function CameraRig({
  progressRef,
}: {
  progressRef: React.RefObject<number>;
}) {
  const camRef = useRef<THREE.PerspectiveCamera>(null);
  const targetPos = useMemo(() => new THREE.Vector3(), []);
  const targetLook = useMemo(() => new THREE.Vector3(), []);
  const smoothedLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame((_, delta) => {
    if (!camRef.current) return;
    const p = progressRef.current ?? 0;

    evalCameraAtProgress(p, targetPos, targetLook);

    const damping = 1 - Math.exp(-12 * delta);
    camRef.current.position.lerp(targetPos, damping);
    smoothedLook.lerp(targetLook, damping);
    camRef.current.lookAt(smoothedLook);
  });

  return (
    <PerspectiveCamera
      ref={camRef}
      makeDefault
      position={[2.2, 0, 7.2]}
      fov={28}
      near={0.05}
      far={50}
    />
  );
}

// ---------- DNA backbone + non-target rungs -----------------------------

function DnaGroup({
  progressRef,
  children,
}: {
  progressRef: React.RefObject<number>;
  children?: React.ReactNode;
}) {
  const targetRungGroupRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    const p = progressRef.current ?? 0;

    // Helix spins around its long axis during the opening, fading off so the
    // dive can lock onto the (stationary, on-axis) molecular base pair.
    if (groupRef.current) {
      const motion = 1 - smoothstep(0.20, 0.55, p);
      groupRef.current.rotation.y += delta * 0.45 * motion;
    }

    // Target rung crossfades with the molecular base pair — traverse the
    // wrapper group so every sub-mesh (beads, halves, H-bond hint) fades
    // together.
    if (targetRungGroupRef.current) {
      const { a, b, easedT } = findKfWindow(p);
      const atomOp = lerp(a.atomOpacity, b.atomOpacity, easedT);
      const op = 1 - atomOp;
      targetRungGroupRef.current.visible = op > 0.01;
      targetRungGroupRef.current.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        const mat = mesh.material as THREE.MeshPhysicalMaterial | undefined;
        if (!mat) return;
        mat.opacity = op;
        mat.transparent = op < 0.995;
        mat.depthWrite = op > 0.5;
      });
    }
  });

  // Backbone curves, rung positions, and per-bp base-pair assignments are
  // all computed once. The pair type (A-T vs G-C) and its orientation are
  // seeded so the same pattern shows every render — no shimmer.
  const { tubeAGeom, tubeBGeom, rungs } = useMemo(() => {
    const samples = DNA.nBp * 14;
    const ptsA: THREE.Vector3[] = [];
    const ptsB: THREE.Vector3[] = [];
    const halfH = DNA_HEIGHT / 2;
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const angle = t * DNA.nBp * DNA_TWIST_RAD;
      const y = t * DNA_HEIGHT - halfH;
      ptsA.push(
        new THREE.Vector3(
          Math.cos(angle) * DNA.helixRadius,
          y,
          Math.sin(angle) * DNA.helixRadius,
        ),
      );
      ptsB.push(
        new THREE.Vector3(
          Math.cos(angle + Math.PI) * DNA.helixRadius,
          y,
          Math.sin(angle + Math.PI) * DNA.helixRadius,
        ),
      );
    }
    const curveA = new THREE.CatmullRomCurve3(ptsA);
    const curveB = new THREE.CatmullRomCurve3(ptsB);

    const aGeom = new THREE.TubeGeometry(
      curveA,
      DNA.nBp * DNA.tubularSegmentsPerBp,
      DNA.backboneTubeRadius,
      DNA.radialSegments,
      false,
    );
    const bGeom = new THREE.TubeGeometry(
      curveB,
      DNA.nBp * DNA.tubularSegmentsPerBp,
      DNA.backboneTubeRadius,
      DNA.radialSegments,
      false,
    );

    // Seeded PRNG so the A-T / G-C pattern is deterministic across renders.
    let seed = 1337;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const rungs: {
      y: number;
      angle: number;
      isTarget: boolean;
      pairType: "AT" | "GC";
      flipped: boolean;
    }[] = [];
    for (let i = 0; i < DNA.nBp; i++) {
      const angle = i * DNA_TWIST_RAD;
      const y = i * DNA.risePerBp - halfH + DNA.risePerBp / 2;
      const isTarget = i === TARGET_BP_INDEX;
      // Target is pinned to A-T (matches the molecular detail rendered there).
      rungs.push({
        y,
        angle,
        isTarget,
        pairType: isTarget ? "AT" : rand() < 0.5 ? "AT" : "GC",
        flipped: isTarget ? false : rand() < 0.5,
      });
    }
    return { tubeAGeom: aGeom, tubeBGeom: bGeom, rungs };
  }, []);

  return (
    <group ref={groupRef}>
      {/* Backbones — calmer matte/satin finish, not high-gloss. */}
      <mesh geometry={tubeAGeom}>
        <meshPhysicalMaterial
          color={COLORS.backbone}
          emissive={COLORS.backboneEmissive}
          emissiveIntensity={0.35}
          metalness={0.1}
          roughness={0.42}
          clearcoat={0.35}
          clearcoatRoughness={0.4}
          reflectivity={0.3}
          envMapIntensity={0.55}
          toneMapped={false}
        />
      </mesh>
      <mesh geometry={tubeBGeom}>
        <meshPhysicalMaterial
          color={COLORS.backbone}
          emissive={COLORS.backboneEmissive}
          emissiveIntensity={0.35}
          metalness={0.1}
          roughness={0.42}
          clearcoat={0.35}
          clearcoatRoughness={0.4}
          reflectivity={0.3}
          envMapIntensity={0.55}
          toneMapped={false}
        />
      </mesh>

      {/* Rungs — each base pair is rendered as two attachment beads on the
          backbone (the "phosphate-sugar" nodes), two short half-rungs
          (one per nucleotide) that emerge from those beads and meet
          in the middle, and a thin H-bond hint connecting them. The
          target rung is wrapped in a separate group so the whole unit
          can crossfade with the molecular base pair beneath it. */}
      <group>
        {rungs.map((r, i) => {
          const rung = (
            <RungUnit
              key={i}
              y={r.y}
              angle={r.angle}
              pairType={r.pairType}
              flipped={r.flipped}
            />
          );
          if (r.isTarget) {
            return (
              <group ref={targetRungGroupRef} key={`target-${i}`}>
                {rung}
              </group>
            );
          }
          return rung;
        })}
      </group>

      {/* Children render inside the rotating helix group — e.g. the
          molecular target base pair, which sits on the helix axis so
          rotation doesn't translate it. */}
      {children}
    </group>
  );
}

// ---------- One rendered rung (attachment beads + halves + H-bond) -----

const BASE_COLORS: Record<"A" | "T" | "G" | "C", string> = {
  A: "#38BDF8", // sky
  T: "#67E8F9", // light cyan
  G: "#818CF8", // indigo
  C: "#A5B4FC", // lavender
};
const BEAD_COLOR = "#7DD3FC";
const BEAD_EMISSIVE = "#0EA5E9";
const HBOND_HINT_COLOR = "#E0F2FE";

// Half-rung geometry: emerges from just inside the attachment bead and
// stops just before the base pair center, leaving room for the H-bond
// hint. With helixRadius = 1 these numbers describe one nucleotide's
// extent toward the centre.
const HALF_INNER = 0.18; // x where the half-rung meets the H-bond hint
const HALF_OUTER = 0.92; // x where the half-rung meets its attachment bead
const HALF_LENGTH = HALF_OUTER - HALF_INNER;
const HALF_CENTER = (HALF_OUTER + HALF_INNER) / 2;
const HBOND_LENGTH = HALF_INNER * 2;

function RungUnit({
  y,
  angle,
  pairType,
  flipped,
}: {
  y: number;
  angle: number;
  pairType: "AT" | "GC";
  flipped: boolean;
}) {
  // Pick which nucleotide sits on the +x side (toward backbone A).
  // Watson-Crick pairs: A↔T and G↔C.
  let leftBase: "A" | "T" | "G" | "C";
  let rightBase: "A" | "T" | "G" | "C";
  if (pairType === "AT") {
    leftBase = flipped ? "A" : "T";
    rightBase = flipped ? "T" : "A";
  } else {
    leftBase = flipped ? "G" : "C";
    rightBase = flipped ? "C" : "G";
  }

  const beadRadius = DNA.backboneTubeRadius * 1.35;
  const halfRadius = DNA.rungRadius;
  const hbondRadius = DNA.rungRadius * 0.55;

  return (
    <group position={[0, y, 0]} rotation={[0, angle, 0]}>
      {/* Attachment bead on the +x backbone */}
      <mesh position={[DNA.helixRadius, 0, 0]}>
        <sphereGeometry args={[beadRadius, 18, 18]} />
        <meshPhysicalMaterial
          color={BEAD_COLOR}
          emissive={BEAD_EMISSIVE}
          emissiveIntensity={0.25}
          metalness={0.1}
          roughness={0.4}
          clearcoat={0.4}
          clearcoatRoughness={0.35}
          envMapIntensity={0.5}
          toneMapped={false}
        />
      </mesh>
      {/* Attachment bead on the -x backbone */}
      <mesh position={[-DNA.helixRadius, 0, 0]}>
        <sphereGeometry args={[beadRadius, 18, 18]} />
        <meshPhysicalMaterial
          color={BEAD_COLOR}
          emissive={BEAD_EMISSIVE}
          emissiveIntensity={0.25}
          metalness={0.1}
          roughness={0.4}
          clearcoat={0.4}
          clearcoatRoughness={0.35}
          envMapIntensity={0.5}
          toneMapped={false}
        />
      </mesh>

      {/* +x half (this nucleotide's base, extending inward from backbone A) */}
      <mesh position={[HALF_CENTER, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[halfRadius, halfRadius, HALF_LENGTH, 14]} />
        <meshPhysicalMaterial
          color={BASE_COLORS[rightBase]}
          emissive={BASE_COLORS[rightBase]}
          emissiveIntensity={0.18}
          metalness={0.15}
          roughness={0.32}
          clearcoat={0.5}
          clearcoatRoughness={0.25}
          envMapIntensity={0.55}
          toneMapped={false}
        />
      </mesh>
      {/* -x half (this nucleotide's complement) */}
      <mesh position={[-HALF_CENTER, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[halfRadius, halfRadius, HALF_LENGTH, 14]} />
        <meshPhysicalMaterial
          color={BASE_COLORS[leftBase]}
          emissive={BASE_COLORS[leftBase]}
          emissiveIntensity={0.18}
          metalness={0.15}
          roughness={0.32}
          clearcoat={0.5}
          clearcoatRoughness={0.25}
          envMapIntensity={0.55}
          toneMapped={false}
        />
      </mesh>

      {/* Hydrogen-bond hint between the two bases */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[hbondRadius, hbondRadius, HBOND_LENGTH, 12]} />
        <meshPhysicalMaterial
          color={HBOND_HINT_COLOR}
          emissive={HBOND_HINT_COLOR}
          emissiveIntensity={0.4}
          metalness={0}
          roughness={0.5}
          envMapIntensity={0.3}
          toneMapped={false}
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  );
}
