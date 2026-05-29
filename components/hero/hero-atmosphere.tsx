"use client";

import { Stars } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { COLORS } from "./hero-config";

// Atmosphere = ambient + key rim light + Drei star field + a few dozen
// glowing bokeh spheres drifting upward. Bloom turns the bokeh into the
// soft glowing orbs from the reference imagery.

type Props = {
  particleCount: number;
};

export function HeroAtmosphere({ particleCount }: Props) {
  return (
    <>
      {/* Lights */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[3, 5, 4]}
        intensity={1.2}
        color="#E0F2FE"
      />
      <pointLight
        position={[-4, -2, 2]}
        intensity={0.4}
        color="#0EA5E9"
      />

      {/* Fog — distant atmosphere fades to background */}
      <fog attach="fog" args={[COLORS.bgBottom, 4, 14]} />

      {/* Star field */}
      <Stars
        radius={50}
        depth={20}
        count={800}
        factor={2}
        fade
        speed={0.1}
      />

      {/* Bokeh */}
      <Bokeh count={particleCount} />
    </>
  );
}

// Instanced glowing spheres drifting upward. Toned-down emissive so bloom
// produces the halos rather than the spheres being raw bright.
function Bokeh({ count }: { count: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const quat = useMemo(() => new THREE.Quaternion(), []);
  const scale = useMemo(() => new THREE.Vector3(), []);

  const particles = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * 12,
        y: (Math.random() - 0.5) * 12,
        z: (Math.random() - 0.5) * 8 - 1,
        size: 0.05 + Math.random() * 0.15,
        speed: 0.15 + Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2,
      })),
    [count],
  );

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      let y = p.y + t * p.speed;
      y = ((y + 6) % 12) - 6; // wrap top to bottom
      pos.set(p.x, y, p.z);
      // breathing fade
      const breath = (Math.sin(t * 0.5 + p.phase) + 1) / 2;
      scale.setScalar(p.size * (0.7 + breath * 0.6));
      quat.identity();
      matrix.compose(pos, quat, scale);
      meshRef.current.setMatrixAt(i, matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 12, 12]} />
      <meshBasicMaterial
        color={COLORS.bokeh}
        transparent
        opacity={0.7}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
