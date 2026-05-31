"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

// Floating cyan dust drifting upward. Sells the "DNA is being pulled up"
// sensation in the opening, and gives the dark vista at the end texture.
//
// Implemented as an InstancedMesh of tiny spheres positioned in a tall
// cylinder around the helix axis. Each instance has its own drift speed,
// and y-positions wrap modulo the cylinder height — so it loops forever
// without visual seams.

const COUNT = 220;
const RADIUS = 6;
const HEIGHT = 20;

export function Particles() {
  const ref = useRef<THREE.InstancedMesh>(null);

  // Per-instance state: home position (radius, angle, baseY), drift speed.
  const state = useMemo(() => {
    const items: {
      r: number;
      a: number;
      y0: number;
      speed: number;
      size: number;
    }[] = [];
    for (let i = 0; i < COUNT; i++) {
      items.push({
        r: 0.3 + Math.random() * RADIUS,
        a: Math.random() * Math.PI * 2,
        y0: Math.random() * HEIGHT - HEIGHT / 2,
        speed: 0.12 + Math.random() * 0.28,
        size: 0.005 + Math.random() * 0.018,
      });
    }
    return items;
  }, []);

  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const tmpV = useMemo(() => new THREE.Vector3(), []);

  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.getElapsedTime();
    for (let i = 0; i < COUNT; i++) {
      const p = state[i];
      // Drift upward, wrapping when past the top.
      let y = p.y0 + t * p.speed;
      y = ((y + HEIGHT / 2) % HEIGHT) - HEIGHT / 2;
      tmpV.set(Math.cos(p.a) * p.r, y, Math.sin(p.a) * p.r);
      matrix.makeScale(p.size, p.size, p.size);
      matrix.setPosition(tmpV);
      ref.current.setMatrixAt(i, matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial
        color="#BAE6FD"
        transparent
        opacity={0.75}
        toneMapped={false}
        depthWrite={false}
      />
    </instancedMesh>
  );
}
