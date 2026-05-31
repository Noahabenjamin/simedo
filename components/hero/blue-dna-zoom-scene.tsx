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
};

export function BlueDnaZoomScene({ progressRef }: Props) {
  return (
    <Canvas
      gl={{ antialias: true, alpha: true, toneMappingExposure: 1.05 }}
      dpr={[1, 2]}
      style={{ position: "absolute", inset: 0 }}
    >
      <CameraRig progressRef={progressRef} />

      <ambientLight intensity={0.35} color="#E0F2FE" />
      <directionalLight
        position={[4, 5, 4]}
        intensity={1.6}
        color="#FFFFFF"
      />
      <directionalLight
        position={[-3, -2, 4]}
        intensity={0.7}
        color="#7DD3FC"
      />
      <pointLight position={[0, 0, 3]} intensity={0.4} color="#BAE6FD" />

      {/* Environment HDR for crisp specular reflections on the clear-coat
            materials. Wrapped in its own Suspense so the scene paints with
            light-only shading while the HDR loads. */}
      <Suspense fallback={null}>
        <Environment
          preset="studio"
          background={false}
          environmentIntensity={0.7}
        />
      </Suspense>

      <DnaGroup progressRef={progressRef}>
        <TargetBasePair progressRef={progressRef} />
      </DnaGroup>

      <BackgroundHelixes />
      <Particles />

      <EffectComposer multisampling={2}>
        <Bloom
          intensity={1.3}
          luminanceThreshold={0.35}
          luminanceSmoothing={0.9}
          mipmapBlur
          radius={0.9}
        />
      </EffectComposer>
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
  const targetRungMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    const p = progressRef.current ?? 0;

    // Helix spins around its long axis during the opening, fading off so the
    // dive can lock onto the (stationary, on-axis) molecular base pair.
    if (groupRef.current) {
      const motion = 1 - smoothstep(0.20, 0.55, p);
      groupRef.current.rotation.y += delta * 0.45 * motion;
    }

    // Target rung crossfades with the molecular base pair.
    if (targetRungMatRef.current) {
      const { a, b, easedT } = findKfWindow(p);
      const atomOp = lerp(a.atomOpacity, b.atomOpacity, easedT);
      const op = 1 - atomOp;
      const m = targetRungMatRef.current;
      m.opacity = op;
      m.transparent = op < 0.995;
      m.depthWrite = op > 0.5;
      m.visible = op > 0.01;
    }
  });

  // Backbone curves and rung positions are computed once.
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

    const rungs: { y: number; angle: number; isTarget: boolean }[] = [];
    for (let i = 0; i < DNA.nBp; i++) {
      const angle = i * DNA_TWIST_RAD;
      const y = i * DNA.risePerBp - halfH + DNA.risePerBp / 2;
      rungs.push({ y, angle, isTarget: i === TARGET_BP_INDEX });
    }
    return { tubeAGeom: aGeom, tubeBGeom: bGeom, rungs };
  }, []);

  return (
    <group ref={groupRef}>
      {/* Backbones — punchier glow so they read like the reference image. */}
      <mesh geometry={tubeAGeom}>
        <meshPhysicalMaterial
          color={COLORS.backbone}
          emissive={COLORS.backboneEmissive}
          emissiveIntensity={0.85}
          metalness={0.2}
          roughness={0.16}
          clearcoat={1}
          clearcoatRoughness={0.06}
          reflectivity={0.7}
          envMapIntensity={1.3}
          toneMapped={false}
        />
      </mesh>
      <mesh geometry={tubeBGeom}>
        <meshPhysicalMaterial
          color={COLORS.backbone}
          emissive={COLORS.backboneEmissive}
          emissiveIntensity={0.85}
          metalness={0.2}
          roughness={0.16}
          clearcoat={1}
          clearcoatRoughness={0.06}
          reflectivity={0.7}
          envMapIntensity={1.3}
          toneMapped={false}
        />
      </mesh>

      {/* Rungs — target rung is the only one that fades, crossfading with
          the molecular base pair the camera dives into. */}
      <group>
        {rungs.map((r, i) => (
          <group key={i} position={[0, r.y, 0]} rotation={[0, r.angle, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry
                args={[
                  DNA.rungRadius,
                  DNA.rungRadius,
                  DNA.helixRadius * 2,
                  DNA.rungRadialSegments,
                ]}
              />
              <meshPhysicalMaterial
                ref={r.isTarget ? targetRungMatRef : undefined}
                color={COLORS.rung}
                emissive={COLORS.rungEmissive}
                emissiveIntensity={0.55}
                metalness={0.2}
                roughness={0.22}
                clearcoat={0.9}
                clearcoatRoughness={0.1}
                envMapIntensity={1.0}
                toneMapped={false}
                transparent={r.isTarget}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* Children render inside the rotating helix group — e.g. the
          molecular target base pair, which sits on the helix axis so
          rotation doesn't translate it. */}
      {children}
    </group>
  );
}
