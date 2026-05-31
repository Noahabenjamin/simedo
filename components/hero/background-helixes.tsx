"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { COLORS, DNA_TWIST_RAD } from "./hero-sequence-config";

// Lightweight DNA helixes that drift in the background of the dark vista
// at the end of the sequence. Each is a single double-helix with a smaller
// rung count and a dimmer, mostly-emissive material so they read as
// blurred, glowing depth rather than crisp foreground geometry.
//
// They render at all times (cheap) but visually only matter once the
// camera pulls back and the bg goes dark.

type HelixSpec = {
  position: [number, number, number];
  scale: number;
  rotation: [number, number, number];
  rotSpeed: number;
  emissive: string;
  alpha: number;
};

const SPECS: HelixSpec[] = [
  {
    position: [-3.5, 0, -8],
    scale: 0.9,
    rotation: [0, 0.3, 0.12],
    rotSpeed: 0.08,
    emissive: "#0EA5E9",
    alpha: 0.55,
  },
  {
    position: [5, 1.5, -11],
    scale: 1.1,
    rotation: [0, -0.5, -0.1],
    rotSpeed: -0.05,
    emissive: "#22D3EE",
    alpha: 0.4,
  },
  {
    position: [-7, -2, -14],
    scale: 1.4,
    rotation: [0, 0.9, 0.18],
    rotSpeed: 0.04,
    emissive: "#38BDF8",
    alpha: 0.3,
  },
];

const N_BP = 22;
const HELIX_RADIUS = 0.7;
const RISE_PER_BP = 0.32;
const BACKBONE_RADIUS = 0.08;
const RUNG_RADIUS = 0.04;

export function BackgroundHelixes() {
  // Build the single shared helix geometry once — reused for every instance.
  const { tubeAGeom, tubeBGeom, rungs } = useMemo(() => {
    const samples = N_BP * 12;
    const ptsA: THREE.Vector3[] = [];
    const ptsB: THREE.Vector3[] = [];
    const halfH = (N_BP * RISE_PER_BP) / 2;
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const angle = t * N_BP * DNA_TWIST_RAD;
      const y = t * N_BP * RISE_PER_BP - halfH;
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
    const aGeom = new THREE.TubeGeometry(curveA, N_BP * 8, BACKBONE_RADIUS, 12, false);
    const bGeom = new THREE.TubeGeometry(curveB, N_BP * 8, BACKBONE_RADIUS, 12, false);

    const rungs: { y: number; angle: number }[] = [];
    for (let i = 0; i < N_BP; i++) {
      rungs.push({
        y: i * RISE_PER_BP - halfH + RISE_PER_BP / 2,
        angle: i * DNA_TWIST_RAD,
      });
    }
    return { tubeAGeom: aGeom, tubeBGeom: bGeom, rungs };
  }, []);

  return (
    <>
      {SPECS.map((spec, i) => (
        <BackgroundHelix
          key={i}
          spec={spec}
          tubeAGeom={tubeAGeom}
          tubeBGeom={tubeBGeom}
          rungs={rungs}
        />
      ))}
    </>
  );
}

function BackgroundHelix({
  spec,
  tubeAGeom,
  tubeBGeom,
  rungs,
}: {
  spec: HelixSpec;
  tubeAGeom: THREE.BufferGeometry;
  tubeBGeom: THREE.BufferGeometry;
  rungs: { y: number; angle: number }[];
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * spec.rotSpeed;
  });

  return (
    <group
      ref={ref}
      position={spec.position}
      rotation={spec.rotation}
      scale={spec.scale}
    >
      <mesh geometry={tubeAGeom}>
        <meshBasicMaterial
          color={spec.emissive}
          transparent
          opacity={spec.alpha}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
      <mesh geometry={tubeBGeom}>
        <meshBasicMaterial
          color={spec.emissive}
          transparent
          opacity={spec.alpha}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
      <group>
        {rungs.map((r, i) => (
          <group key={i} position={[0, r.y, 0]} rotation={[0, r.angle, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[RUNG_RADIUS, RUNG_RADIUS, HELIX_RADIUS * 2, 10]} />
              <meshBasicMaterial
                color={COLORS.rung}
                transparent
                opacity={spec.alpha * 0.7}
                toneMapped={false}
                depthWrite={false}
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
