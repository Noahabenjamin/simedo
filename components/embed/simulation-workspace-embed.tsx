"use client";

import { ViewerShell } from "@/components/viewer/viewer-shell";
import type { Simulation } from "@/types";

// A trimmed simulation workspace for the embed route — no AI sidebar,
// no surrounding metadata, just the viewer filling its container. We don't
// need the imperative handle here, so no onReady.

type Props = {
  simulation: Simulation;
};

export function SimulationWorkspaceEmbed({ simulation }: Props) {
  return (
    <ViewerShell
      pdbUrl={simulation.pdbUrl}
      trajectoryUrl={simulation.trajectoryUrl ?? undefined}
      compressedTrajectoryUrl={simulation.trajectory.compressedUrl}
      rawTrajectoryUrl={simulation.trajectory.rawUrl}
      framesStreamed={simulation.trajectory.framesStreamed}
      hasTrajectory={simulation.hasTrajectory}
    />
  );
}
