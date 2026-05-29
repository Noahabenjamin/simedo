"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

// Smooth, glowing, slowly-rotating B-DNA double helix for the studio hero's
// left side. Built from procedural geometry — no NGL — so the look is
// stylized and cinematic rather than literal-scientific.
//
// Smoothing choices vs the earlier cinematic version:
//   - higher tubular subdivisions on the backbone (12× per bp)
//   - 16 radial segments on the tube cross-section
//   - 24 radial segments on the cylinder rungs
//   - dropped the wireframe overlay (it added visible polygon edges)
//   - bloom intensity tuned for a white background (lower threshold, lower
//     intensity than on the dark cinematic scene)

// ----- geometry constants -----
const N_BP = 22;
const HELIX_RADIUS = 1.0;
const RISE_PER_BP = 0.34;
const TWIST_PER_BP_RAD = (36 * Math.PI) / 180;
const HELIX_HEIGHT = N_BP * RISE_PER_BP;
const BACKBONE_RADIUS = 0.105;
const RUNG_RADIUS = 0.055;

// ----- materials -----
const BACKBONE_COLOR = "#0EA5E9";
const BACKBONE_EMISSIVE = "#0284C7";
const RUNG_COLOR = "#67E8F9";
const RUNG_EMISSIVE = "#0EA5E9";

function DnaCore() {
  const groupRef = useRef<THREE.Group>(null);

  const { backboneAGeom, backboneBGeom, rungs } = useMemo(() => {
    const samples = N_BP * 14;
    const ptsA: THREE.Vector3[] = [];
    const ptsB: THREE.Vector3[] = [];
    const halfH = HELIX_HEIGHT / 2;
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const angle = t * N_BP * TWIST_PER_BP_RAD;
      const y = t * HELIX_HEIGHT - halfH;
      ptsA.push(
        new THREE.Vector3(
          Math.cos(angle) * HELIX_RADIUS,
          y,
          Math.sin(angle) * HELIX_RADIUS,
        ),
      );
      ptsB.push(
        new THREE.Vector3(
          Math.cos(angle + Math.PI) * HELIX_RADIUS,
          y,
          Math.sin(angle + Math.PI) * HELIX_RADIUS,
        ),
      );
    }
    const curveA = new THREE.CatmullRomCurve3(ptsA);
    const curveB = new THREE.CatmullRomCurve3(ptsB);
    const tubularSegs = N_BP * 12;

    const aGeom = new THREE.TubeGeometry(
      curveA,
      tubularSegs,
      BACKBONE_RADIUS,
      16,
      false,
    );
    const bGeom = new THREE.TubeGeometry(
      curveB,
      tubularSegs,
      BACKBONE_RADIUS,
      16,
      false,
    );

    const rungs: { y: number; angle: number }[] = [];
    for (let i = 0; i < N_BP; i++) {
      const angle = i * TWIST_PER_BP_RAD;
      const y = i * RISE_PER_BP - halfH + RISE_PER_BP / 2;
      rungs.push({ y, angle });
    }

    return { backboneAGeom: aGeom, backboneBGeom: bGeom, rungs };
  }, []);

  // Slow continuous Y-rotation + tiny vertical bob.
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.12;
      const t = state.clock.elapsedTime;
      groupRef.current.position.y = Math.sin((t / 6) * Math.PI * 2) * 0.04;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={backboneAGeom}>
        <meshStandardMaterial
          color={BACKBONE_COLOR}
          emissive={BACKBONE_EMISSIVE}
          emissiveIntensity={0.55}
          metalness={0.3}
          roughness={0.32}
          toneMapped={false}
        />
      </mesh>
      <mesh geometry={backboneBGeom}>
        <meshStandardMaterial
          color={BACKBONE_COLOR}
          emissive={BACKBONE_EMISSIVE}
          emissiveIntensity={0.55}
          metalness={0.3}
          roughness={0.32}
          toneMapped={false}
        />
      </mesh>

      {rungs.map((r, i) => (
        <group key={i} position={[0, r.y, 0]} rotation={[0, r.angle, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry
              args={[RUNG_RADIUS, RUNG_RADIUS, HELIX_RADIUS * 2, 24]}
            />
            <meshStandardMaterial
              color={RUNG_COLOR}
              emissive={RUNG_EMISSIVE}
              emissiveIntensity={0.45}
              metalness={0.25}
              roughness={0.4}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

type Props = {
  enableZoom?: boolean;
};

export function BlueDnaScene({ enableZoom = true }: Props) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6.2], fov: 28 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      style={{ width: "100%", height: "100%" }}
    >
      <Suspense fallback={null}>
        {/* Lights tuned for white background — strong key + cool rim */}
        <ambientLight intensity={0.45} />
        <directionalLight
          position={[3, 4, 4]}
          intensity={1.4}
          color="#E0F2FE"
        />
        <pointLight
          position={[-3, -2, 3]}
          intensity={0.5}
          color="#38BDF8"
        />

        <DnaCore />

        {enableZoom && (
          <OrbitControls
            enableZoom
            enableRotate={false}
            enablePan={false}
            minDistance={3}
            maxDistance={10}
            // Touch: pinch zoom only; single-finger swipe falls through to
            // the page scroll (one-finger rotate is disabled above).
            touches={{ ONE: undefined as never, TWO: 2 }}
          />
        )}

        <EffectComposer multisampling={2}>
          <Bloom
            intensity={0.95}
            luminanceThreshold={0.55}
            luminanceSmoothing={0.9}
            mipmapBlur
            radius={0.8}
          />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
