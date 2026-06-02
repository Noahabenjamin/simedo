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

const FULL_COUNT = 220;
const LITE_COUNT = 80;
const RADIUS = 6;
const HEIGHT = 20;

// Pure hash → value in [0, 1). Used to seed particle positions without
// any closure state — keeps the render pure and the field deterministic.
function hash(index: number, salt: number): number {
  let x = index * 2654435761 + salt * 1597334677;
  x = (x ^ (x >>> 16)) >>> 0;
  x = Math.imul(x, 2246822519) >>> 0;
  x = (x ^ (x >>> 13)) >>> 0;
  x = Math.imul(x, 3266489917) >>> 0;
  x = (x ^ (x >>> 16)) >>> 0;
  return x / 0x100000000;
}

type Props = { lite?: boolean };

export function Particles({ lite = false }: Props) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = lite ? LITE_COUNT : FULL_COUNT;

  // Per-instance state: home position (radius, angle, baseY), drift speed.
  // Pure index-based hash so the particle field stays stable across renders
  // without any in-render mutation. Each particle pulls 5 deterministic
  // values from `hash(index, salt)`.
  const state = useMemo(() => {
    const items: {
      r: number;
      a: number;
      y0: number;
      speed: number;
      size: number;
    }[] = [];
    for (let i = 0; i < count; i++) {
      items.push({
        r: 0.3 + hash(i, 1) * RADIUS,
        a: hash(i, 2) * Math.PI * 2,
        y0: hash(i, 3) * HEIGHT - HEIGHT / 2,
        speed: 0.12 + hash(i, 4) * 0.28,
        size: 0.005 + hash(i, 5) * 0.018,
      });
    }
    return items;
  }, [count]);

  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const tmpV = useMemo(() => new THREE.Vector3(), []);

  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
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
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
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
