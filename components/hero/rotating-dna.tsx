"use client";

import { useEffect, useRef } from "react";

/*
  All-atom rotating B-DNA helix for the hero.

  - Structure: 1BNA (Drew–Dickerson dodecamer), 12 base pairs.
  - Representations layered for realism:
      * cartoon       — sugar-phosphate backbone, color by chain
      * base          — flat base-pair panels, color by chain
      * ball+stick    — every heavy atom and bond, color by element (CPK)
  - Lighting tuned so the shadowed side stays readable instead of going black
    as the helix rotates (high ambient, modest directional).
  - sampleLevel 3 for smoother edges.
  - Mouse: on md+ users can scroll-zoom and drag-rotate; on mobile pointer
    events are disabled so page scroll isn't hijacked.
*/
export function RotatingDna() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    let handleResize: (() => void) | null = null;

    (async () => {
      const NGL = await import("ngl");
      if (cancelled || !containerRef.current) return;

      // NGL types are strict; runtime accepts all these. Contained any.
      const stage: any = new NGL.Stage(containerRef.current, {
        backgroundColor: "white",
        cameraType: "perspective",
        cameraFov: 32,
        quality: "high",
        sampleLevel: 3,
        // High ambient + modest directional → no black shadowed face as
        // the helix rotates. The molecule reads as evenly lit.
        ambientIntensity: 0.65,
        lightIntensity: 0.95,
      });
      stageRef.current = stage;

      handleResize = () => stage.handleResize();
      window.addEventListener("resize", handleResize);

      try {
        const comp: any = await stage.loadFile(
          "https://files.rcsb.org/download/1BNA.pdb",
          { defaultRepresentation: false },
        );
        if (cancelled || !comp) return;

        comp.addRepresentation("cartoon", {
          colorScheme: "chainname",
          aspectRatio: 2.5,
          radiusScale: 2.0,
          smoothSheet: true,
          subdiv: 16,
        });
        comp.addRepresentation("base", {
          colorScheme: "chainname",
          radius: 0.55,
        });
        // Bigger atoms and bonds — pushes the "real molecular model" feel.
        comp.addRepresentation("ball+stick", {
          colorScheme: "element",
          radiusScale: 0.55,
          bondScale: 0.5,
          sele: "not hydrogen",
        });

        stage.autoView(0);
        stage.viewerControls.zoom(0.9);
        stage.setSpin([0, 1, 0], 0.005);
      } catch (err) {
        console.error("[RotatingDna] load failed", err);
      }
    })();

    return () => {
      cancelled = true;
      if (handleResize) window.removeEventListener("resize", handleResize);
      if (stageRef.current) {
        try {
          stageRef.current.dispose();
        } catch {
          /* NGL occasionally throws on dispose during a partial init */
        }
        stageRef.current = null;
      }
    };
  }, []);

  // bg-white on the inner div *and* the NGL canvas via the descendant selector
  // so there's never a black flash before the first WebGL frame paints.
  return (
    <div
      ref={containerRef}
      className="h-full w-full bg-white [&_canvas]:bg-white"
      aria-hidden="true"
    />
  );
}
