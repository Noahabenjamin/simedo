"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  COLORS,
  DNA,
  DNA_HEIGHT,
  DNA_TWIST_RAD,
  KEYFRAMES,
  TARGET_BP_INDEX,
  findKfWindow,
  lerp,
} from "./hero-sequence-config";

// R3F scene driven entirely by `progressRef.current`. No React re-renders
// during scroll inside the 3D subtree.
//
//   group           — auto-rotates slowly around Y at all times
//     backboneA     — TubeGeometry (smooth)
//     backboneB     — TubeGeometry (smooth)
//     rungs         — group-rotated cylinders (smooth)
//     atoms         — InstancedMesh of CPK spheres, opacity tied to progress

type Props = {
  progressRef: React.RefObject<number>;
};

export function BlueDnaZoomScene({ progressRef }: Props) {
  return (
    <Canvas
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      style={{ position: "absolute", inset: 0 }}
    >
      <Suspense fallback={null}>
        <CameraRig progressRef={progressRef} />

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

        <DnaGroup progressRef={progressRef} />

        <EffectComposer multisampling={2}>
          <Bloom
            intensity={1.05}
            luminanceThreshold={0.5}
            luminanceSmoothing={0.9}
            mipmapBlur
            radius={0.85}
          />
        </EffectComposer>
      </Suspense>
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
  const lookAtTmp = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!camRef.current) return;
    const p = progressRef.current ?? 0;
    const { a, b, easedT } = findKfWindow(p);
    camRef.current.position.lerpVectors(a.cameraPos, b.cameraPos, easedT);
    lookAtTmp.copy(a.cameraLookAt).lerp(b.cameraLookAt, easedT);
    camRef.current.lookAt(lookAtTmp);
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

// ---------- DNA + atoms group -------------------------------------------

function DnaGroup({
  progressRef,
}: {
  progressRef: React.RefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const backboneAMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const backboneBMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const rungsGroupRef = useRef<THREE.Group>(null);
  const atomsRef = useRef<THREE.InstancedMesh>(null);
  const atomsMatRef = useRef<THREE.MeshStandardMaterial>(null);

  // ---- Backbone curves + rung positions --------------------------------

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

    const rungs: { y: number; angle: number }[] = [];
    for (let i = 0; i < DNA.nBp; i++) {
      const angle = i * DNA_TWIST_RAD;
      const y = i * DNA.risePerBp - halfH + DNA.risePerBp / 2;
      rungs.push({ y, angle });
    }
    return { tubeAGeom: aGeom, tubeBGeom: bGeom, rungs };
  }, []);

  // ---- Atom positions --------------------------------------------------
  // Faked CPK-style cluster around each base pair: 5 atoms per pair, with
  // heavier density around the target base pair.

  const { atomPositions, atomColors } = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    const colors: string[] = [];
    const halfH = DNA_HEIGHT / 2;
    for (let i = 0; i < DNA.nBp; i++) {
      const angle = i * DNA_TWIST_RAD;
      const yMid = i * DNA.risePerBp - halfH + DNA.risePerBp / 2;
      const isTarget = i === TARGET_BP_INDEX;
      const cluster = isTarget ? 9 : 5;
      for (let k = 0; k < cluster; k++) {
        const along = (k / (cluster - 1) - 0.5) * 1.6; // -0.8 .. +0.8 along rung
        const jitterY = (Math.random() - 0.5) * 0.08;
        const jitterRadial = (Math.random() - 0.5) * 0.08;
        const x =
          Math.cos(angle) * (DNA.helixRadius - 0.05) * along +
          jitterRadial * Math.cos(angle + Math.PI / 2);
        const z =
          Math.sin(angle) * (DNA.helixRadius - 0.05) * along +
          jitterRadial * Math.sin(angle + Math.PI / 2);
        positions.push(new THREE.Vector3(x, yMid + jitterY, z));
        // Pick atom color from CPK palette
        const cpkChoice = k % 4;
        if (cpkChoice === 0) colors.push(COLORS.atomN);
        else if (cpkChoice === 1) colors.push(COLORS.atomO);
        else if (cpkChoice === 2) colors.push(COLORS.atomP);
        else colors.push(COLORS.atomC);
      }
    }
    return { atomPositions: positions, atomColors: colors };
  }, []);

  const atomCount = atomPositions.length;
  const atomMatrix = useMemo(() => new THREE.Matrix4(), []);
  const atomColor = useMemo(() => new THREE.Color(), []);

  // ---- Frame loop ------------------------------------------------------

  useFrame((state, delta) => {
    const p = progressRef.current ?? 0;

    // Constant slow Y rotation (drift), independent of scroll progress.
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.12;
    }

    const { a, b, easedT } = findKfWindow(p);

    // Atom opacity
    const atomOp = lerp(a.atomOpacity, b.atomOpacity, easedT);
    if (atomsMatRef.current) {
      atomsMatRef.current.opacity = atomOp;
      atomsMatRef.current.transparent = atomOp < 1;
      atomsMatRef.current.visible = atomOp > 0.005;
    }
    if (atomsRef.current) {
      // Slight scale animation: atoms grow as they emerge.
      const scale = 0.5 + atomOp * 0.5;
      for (let i = 0; i < atomCount; i++) {
        atomMatrix.makeScale(scale, scale, scale);
        atomMatrix.setPosition(atomPositions[i]);
        atomsRef.current.setMatrixAt(i, atomMatrix);
        atomColor.set(atomColors[i]);
        atomsRef.current.setColorAt(i, atomColor);
      }
      atomsRef.current.instanceMatrix.needsUpdate = true;
      if (atomsRef.current.instanceColor) {
        atomsRef.current.instanceColor.needsUpdate = true;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Backbones */}
      <mesh geometry={tubeAGeom}>
        <meshStandardMaterial
          ref={backboneAMatRef}
          color={COLORS.backbone}
          emissive={COLORS.backboneEmissive}
          emissiveIntensity={0.55}
          metalness={0.3}
          roughness={0.3}
          toneMapped={false}
        />
      </mesh>
      <mesh geometry={tubeBGeom}>
        <meshStandardMaterial
          ref={backboneBMatRef}
          color={COLORS.backbone}
          emissive={COLORS.backboneEmissive}
          emissiveIntensity={0.55}
          metalness={0.3}
          roughness={0.3}
          toneMapped={false}
        />
      </mesh>

      {/* Rungs */}
      <group ref={rungsGroupRef}>
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
              <meshStandardMaterial
                color={COLORS.rung}
                emissive={COLORS.rungEmissive}
                emissiveIntensity={0.45}
                metalness={0.25}
                roughness={0.4}
                toneMapped={false}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* Atoms — instanced CPK spheres */}
      <instancedMesh
        ref={atomsRef}
        args={[undefined, undefined, atomCount]}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial
          ref={atomsMatRef}
          color="white"
          emissive="#0EA5E9"
          emissiveIntensity={0.6}
          metalness={0.4}
          roughness={0.3}
          toneMapped={false}
          transparent
        />
      </instancedMesh>
    </group>
  );
}
