"use client";

import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Vignette,
} from "@react-three/postprocessing";

type Props = {
  enableHeavy: boolean; // false on mobile
};

// Post-processing chain. Bloom does most of the visual lifting — the neon
// edge glow comes from emissive materials + bloom's mipmapBlur. Vignette
// gives the cinematic edge darkening. Chromatic aberration is a subtle
// sci-fi accent that we turn off on mobile.

export function HeroPostEffects({ enableHeavy }: Props) {
  return (
    <EffectComposer multisampling={enableHeavy ? 4 : 0}>
      <Bloom
        intensity={1.2}
        luminanceThreshold={0.4}
        luminanceSmoothing={0.9}
        mipmapBlur
        radius={0.85}
      />
      <Vignette eccentricity={0.5} darkness={0.6} />
      {enableHeavy ? (
        <ChromaticAberration
          offset={[0.0008, 0.0008]}
          radialModulation={false}
          modulationOffset={0}
        />
      ) : (
        <></>
      )}
    </EffectComposer>
  );
}
