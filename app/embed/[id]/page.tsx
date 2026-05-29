import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { SimulationWorkspaceEmbed } from "@/components/embed/simulation-workspace-embed";
import { getSimulation } from "@/lib/data/simulations";

// Minimal viewer-only route for iframe embedding.
// Loads only the molecular viewer + a small "View on Helix" link.
// Respects visibility: private sims 404 here just like everywhere else.

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function EmbedPage({ params }: Props) {
  const { id } = await params;
  const simulation = await getSimulation(id);
  if (!simulation) notFound();

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <div className="flex-1 overflow-hidden">
        <SimulationWorkspaceEmbed simulation={simulation} />
      </div>
      <Link
        href={`/simulation/${id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-full border border-border bg-background/90 px-2.5 py-1 text-[11px] font-medium text-foreground backdrop-blur-md transition-colors hover:border-foreground/30"
      >
        <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
        <span>{simulation.pdbCode || "Helix"}</span>
        <ExternalLink className="size-3 text-muted-foreground" />
      </Link>
    </div>
  );
}
