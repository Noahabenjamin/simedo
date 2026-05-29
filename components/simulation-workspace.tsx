"use client";

import { useEffect, useRef } from "react";
import { AiSidebar } from "@/components/ai-sidebar";
import { ViewerShell } from "@/components/viewer/viewer-shell";
import { PresenceLayer } from "@/components/collab/presence-layer";
import type { MolecularViewerHandle } from "@/components/viewer/molecular-viewer";
import type { Simulation } from "@/types";
import { track } from "@/lib/analytics";

// Client wrapper that wires the viewer ref to both the AI sidebar (for tool
// dispatch) and the presence layer (for collab). Tracks the "simulation_viewed"
// event on mount.

type Props = {
  simulation: Simulation;
  ownerId: string;
};

export function SimulationWorkspace({ simulation, ownerId }: Props) {
  const viewerRef = useRef<MolecularViewerHandle | null>(null);

  useEffect(() => {
    track("simulation_viewed", { simulationId: simulation.id });
  }, [simulation.id]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-10 lg:gap-6">
      <div className="relative h-[55vh] overflow-hidden rounded-2xl border border-border sm:h-[60vh] lg:col-span-7 lg:h-[70vh]">
        <ViewerShell
          ref={viewerRef}
          pdbUrl={simulation.pdbUrl}
          trajectoryUrl={simulation.trajectoryUrl ?? undefined}
        />
        <PresenceLayer
          simulationId={simulation.id}
          viewerRef={viewerRef}
          ownerId={ownerId}
        />
      </div>
      <div className="lg:col-span-3 lg:h-[70vh]">
        <AiSidebar simulationId={simulation.id} viewerRef={viewerRef} />
      </div>
    </div>
  );
}
