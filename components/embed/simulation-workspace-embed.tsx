"use client";

import { useRef } from "react";
import { ViewerShell } from "@/components/viewer/viewer-shell";
import type { MolecularViewerHandle } from "@/components/viewer/molecular-viewer";
import type { Simulation } from "@/types";

// A trimmed simulation workspace for the embed route — no AI sidebar,
// no surrounding metadata, just the viewer filling its container.

type Props = {
  simulation: Simulation;
};

export function SimulationWorkspaceEmbed({ simulation }: Props) {
  const viewerRef = useRef<MolecularViewerHandle | null>(null);
  return (
    <ViewerShell
      ref={viewerRef}
      pdbUrl={simulation.pdbUrl}
      trajectoryUrl={simulation.trajectoryUrl ?? undefined}
    />
  );
}
