"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import {
  ATOM_COLORS,
  ATOM_RADII,
  BOND_COLOR,
  HBOND_COLOR,
  TARGET_BP_Y,
  buildAdenineThymine,
} from "./base-pair-geometry";
import { findKfWindow, lerp } from "./hero-sequence-config";

// The molecular base pair the camera dives into. Renders adenine and
// thymine with ball-and-stick geometry and two H-bonds between them.
// Materials are MeshPhysicalMaterial with a heavy clearcoat for the
// glossy look; an Environment in the parent provides the reflections.
//
// All atom/bond opacity is driven from the scroll progress ref in
// useFrame, so this component never re-renders during the scroll.

type Props = {
  progressRef: React.RefObject<number>;
};

const Y_UP = new THREE.Vector3(0, 1, 0);

type BondTransform = {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  length: number;
};

// Cylinder pose that spans from a to b along its local +Y axis.
function bondTransform(a: THREE.Vector3, b: THREE.Vector3): BondTransform {
  const dir = new THREE.Vector3().subVectors(b, a);
  const length = dir.length();
  const position = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    Y_UP,
    dir.clone().normalize(),
  );
  return { position, quaternion, length };
}

export function TargetBasePair({ progressRef }: Props) {
  const groupRef = useRef<THREE.Group>(null);

  const { atoms, bonds, hBonds } = useMemo(() => buildAdenineThymine(), []);

  const bondXforms = useMemo<BondTransform[]>(
    () => bonds.map(([p1, p2]) => bondTransform(p1, p2)),
    [bonds],
  );

  // Chop each H-bond into N segments, draw every other one — dashed
  // line look without a custom shader.
  const hBondSegments = useMemo<BondTransform[]>(() => {
    const out: BondTransform[] = [];
    const N_SEG = 5;
    for (const [a, b] of hBonds) {
      for (let i = 0; i < N_SEG; i++) {
        if (i % 2 === 1) continue;
        const t0 = i / N_SEG;
        const t1 = (i + 1) / N_SEG;
        const p0 = new THREE.Vector3().lerpVectors(a, b, t0);
        const p1 = new THREE.Vector3().lerpVectors(a, b, t1);
        out.push(bondTransform(p0, p1));
      }
    }
    return out;
  }, [hBonds]);

  useFrame(() => {
    if (!groupRef.current) return;
    const p = progressRef.current ?? 0;
    const { a, b, easedT } = findKfWindow(p);
    const op = lerp(a.atomOpacity, b.atomOpacity, easedT);

    const s = 0.72 + 0.28 * op;
    groupRef.current.scale.setScalar(s);
    groupRef.current.visible = op > 0.005;

    // Drive opacity on every child material via traversal.
    groupRef.current.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshPhysicalMaterial | undefined;
      if (!mat) return;
      mat.opacity = op;
      mat.transparent = op < 0.995;
      mat.depthWrite = op > 0.5;
    });
  });

  return (
    <group ref={groupRef} position={[0, TARGET_BP_Y, 0]}>
      {atoms.map((atom) => (
        <mesh key={atom.id} position={atom.pos}>
          <sphereGeometry args={[ATOM_RADII[atom.element], 32, 32]} />
          <meshPhysicalMaterial
            color={ATOM_COLORS[atom.element]}
            metalness={0.05}
            roughness={0.18}
            clearcoat={1}
            clearcoatRoughness={0.06}
            reflectivity={0.6}
            envMapIntensity={1.4}
            emissive={ATOM_COLORS[atom.element]}
            emissiveIntensity={0.05}
            toneMapped={false}
            transparent
          />
        </mesh>
      ))}

      {bondXforms.map((bt, i) => (
        <mesh key={`bond-${i}`} position={bt.position} quaternion={bt.quaternion}>
          <cylinderGeometry args={[0.018, 0.018, bt.length, 14]} />
          <meshPhysicalMaterial
            color={BOND_COLOR}
            metalness={0.25}
            roughness={0.25}
            clearcoat={0.8}
            clearcoatRoughness={0.1}
            envMapIntensity={1.0}
            toneMapped={false}
            transparent
          />
        </mesh>
      ))}

      {hBondSegments.map((bt, i) => (
        <mesh key={`hb-${i}`} position={bt.position} quaternion={bt.quaternion}>
          <cylinderGeometry args={[0.012, 0.012, bt.length, 12]} />
          <meshPhysicalMaterial
            color={HBOND_COLOR}
            emissive={HBOND_COLOR}
            emissiveIntensity={0.6}
            metalness={0}
            roughness={0.4}
            clearcoat={0.4}
            clearcoatRoughness={0.2}
            toneMapped={false}
            transparent
          />
        </mesh>
      ))}
    </group>
  );
}
