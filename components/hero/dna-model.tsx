"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  COLORS,
  DNA,
  DNA_HEIGHT,
  DNA_TWIST_RAD,
  IDLE,
  KEYFRAMES,
  easeInOutCubic,
} from "./hero-config";

// Procedural B-DNA double helix.
//
//   Two backbones — TubeGeometry along helical Catmull-Rom curves
//   Base pair rungs — instanced cylinders
//   Wireframe overlay — outer copy with wireframe material for the "edge glow"
//
// All idle motion (rotation + bob) and scroll-driven opacity / highlight
// happens in useFrame against the progressRef so we never re-render React on
// scroll inside the 3D subtree.

type Props = {
  progressRef: React.RefObject<number>;
  nBasePairs?: number;
};

export function DNAModel({ progressRef, nBasePairs = DNA.nBasePairs }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const tubeAOpacityRef = useRef<THREE.MeshStandardMaterial>(null);
  const tubeBOpacityRef = useRef<THREE.MeshStandardMaterial>(null);
  const rungsRef = useRef<THREE.InstancedMesh>(null);
  const wireGroupRef = useRef<THREE.Group>(null);
  const startedAtRef = useRef<number>(0);

  // ---- Backbone curves ---------------------------------------------------

  const { backboneA, backboneB, rungs } = useMemo(() => {
    const samples = nBasePairs * 6;
    const ptsA: THREE.Vector3[] = [];
    const ptsB: THREE.Vector3[] = [];
    const halfH = (nBasePairs * DNA.risePerBp) / 2;
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const angle = t * nBasePairs * DNA_TWIST_RAD;
      const y = t * nBasePairs * DNA.risePerBp - halfH;
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

    const rungs: { y: number; angle: number; isAccent: boolean }[] = [];
    for (let i = 0; i < nBasePairs; i++) {
      const angle = i * DNA_TWIST_RAD;
      const y = i * DNA.risePerBp - halfH + DNA.risePerBp / 2;
      rungs.push({ y, angle, isAccent: i % 3 === 0 });
    }
    return { backboneA: curveA, backboneB: curveB, rungs };
  }, [nBasePairs]);

  const tubeGeomA = useMemo(
    () =>
      new THREE.TubeGeometry(
        backboneA,
        nBasePairs * 8,
        DNA.backboneTubeRadius,
        10,
        false,
      ),
    [backboneA, nBasePairs],
  );
  const tubeGeomB = useMemo(
    () =>
      new THREE.TubeGeometry(
        backboneB,
        nBasePairs * 8,
        DNA.backboneTubeRadius,
        10,
        false,
      ),
    [backboneB, nBasePairs],
  );
  const rungGeom = useMemo(
    () =>
      new THREE.CylinderGeometry(
        DNA.rungRadius,
        DNA.rungRadius,
        DNA.helixRadius * 2,
        8,
      ),
    [],
  );

  // ---- Set up instanced rung matrices once -------------------------------

  const rungMatrix = useMemo(() => new THREE.Matrix4(), []);
  const rungEuler = useMemo(() => new THREE.Euler(), []);
  const rungPos = useMemo(() => new THREE.Vector3(), []);
  const rungScale = useMemo(() => new THREE.Vector3(1, 1, 1), []);
  const rungQuat = useMemo(() => new THREE.Quaternion(), []);

  // ---- Frame loop --------------------------------------------------------

  useFrame((state) => {
    const now = state.clock.elapsedTime;
    if (startedAtRef.current === 0) startedAtRef.current = now;
    const t = now - startedAtRef.current;
    const progress = progressRef.current ?? 0;

    if (groupRef.current) {
      groupRef.current.rotation.y = t * IDLE.rotationRadPerSec;
      groupRef.current.position.y =
        Math.sin((t / IDLE.bobPeriodSec) * Math.PI * 2) * IDLE.bobAmplitude;
    }

    // Match wireframe rotation/position to mesh.
    if (wireGroupRef.current && groupRef.current) {
      wireGroupRef.current.rotation.copy(groupRef.current.rotation);
      wireGroupRef.current.position.copy(groupRef.current.position);
    }

    // Interpolate per-keyframe opacity and highlight.
    const kf = interpolateKf(progress);

    if (tubeAOpacityRef.current) {
      tubeAOpacityRef.current.opacity = kf.dnaOpacity;
      tubeAOpacityRef.current.transparent = kf.dnaOpacity < 1;
    }
    if (tubeBOpacityRef.current) {
      tubeBOpacityRef.current.opacity = kf.dnaOpacity;
      tubeBOpacityRef.current.transparent = kf.dnaOpacity < 1;
    }

    // Update rung matrices for highlight: bright pair stays at 1.0 opacity.
    if (rungsRef.current) {
      const highlight = kf.highlightBpIndex;
      for (let i = 0; i < rungs.length; i++) {
        rungPos.set(0, rungs[i].y, 0);
        rungEuler.set(0, rungs[i].angle, Math.PI / 2, "YXZ");
        rungQuat.setFromEuler(rungEuler);
        const isHighlight = highlight !== null && i === highlight;
        const opacityScale = isHighlight ? 1 : kf.dnaOpacity;
        rungScale.set(opacityScale > 0 ? 1 : 0.0001, opacityScale > 0 ? 1 : 0.0001, opacityScale > 0 ? 1 : 0.0001);
        rungMatrix.compose(rungPos, rungQuat, rungScale);
        rungsRef.current.setMatrixAt(i, rungMatrix);
      }
      rungsRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  // ---- Render ------------------------------------------------------------

  return (
    <group>
      <group ref={groupRef}>
        {/* Backbones */}
        <mesh geometry={tubeGeomA}>
          <meshStandardMaterial
            ref={tubeAOpacityRef}
            color={COLORS.backbone}
            emissive={COLORS.backboneEmissive}
            emissiveIntensity={0.6}
            metalness={0.3}
            roughness={0.4}
            toneMapped={false}
          />
        </mesh>
        <mesh geometry={tubeGeomB}>
          <meshStandardMaterial
            ref={tubeBOpacityRef}
            color={COLORS.backbone}
            emissive={COLORS.backboneEmissive}
            emissiveIntensity={0.6}
            metalness={0.3}
            roughness={0.4}
            toneMapped={false}
          />
        </mesh>

        {/* Base-pair rungs as instanced cylinders */}
        <instancedMesh
          ref={rungsRef}
          args={[rungGeom, undefined, rungs.length]}
          frustumCulled={false}
        >
          <meshStandardMaterial
            color={COLORS.rungA}
            emissive={COLORS.rungEmissive}
            emissiveIntensity={0.45}
            metalness={0.2}
            roughness={0.5}
            transparent
            toneMapped={false}
          />
        </instancedMesh>
      </group>

      {/* Wireframe overlay — clone scaled out slightly. Stays synced with
          the inner group in useFrame above. */}
      <group ref={wireGroupRef} scale={DNA.wireframeScale}>
        <mesh geometry={tubeGeomA}>
          <meshBasicMaterial
            color={COLORS.wireframe}
            wireframe
            transparent
            opacity={DNA.wireframeOpacity}
            toneMapped={false}
          />
        </mesh>
        <mesh geometry={tubeGeomB}>
          <meshBasicMaterial
            color={COLORS.wireframe}
            wireframe
            transparent
            opacity={DNA.wireframeOpacity}
            toneMapped={false}
          />
        </mesh>
      </group>

    </group>
  );
}

// DNA_HEIGHT is exported from hero-config and consumed by the annotation
// layer; silence the unused-import linter without a JSX comma.
void DNA_HEIGHT;

// Linear-then-eased interpolation across keyframe entries.
function interpolateKf(progress: number) {
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    const a = KEYFRAMES[i];
    const b = KEYFRAMES[i + 1];
    if (progress >= a.progress && progress <= b.progress) {
      const localT = (progress - a.progress) / (b.progress - a.progress);
      const eased = easeInOutCubic(localT);
      return {
        dnaOpacity: a.dnaOpacity + (b.dnaOpacity - a.dnaOpacity) * eased,
        highlightBpIndex: eased < 0.5 ? a.highlightBpIndex : b.highlightBpIndex,
      };
    }
  }
  const last = KEYFRAMES[KEYFRAMES.length - 1];
  return {
    dnaOpacity: last.dnaOpacity,
    highlightBpIndex: last.highlightBpIndex,
  };
}
