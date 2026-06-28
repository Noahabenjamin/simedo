"use client";

import { useCallback, useEffect, useRef } from "react";
import { Eye, Heart, MessageCircle } from "lucide-react";
import Link from "next/link";
import { AiSidebar } from "@/components/ai-sidebar";
import { ViewerShell } from "@/components/viewer/viewer-shell";
import { PresenceLayer } from "@/components/collab/presence-layer";
import { ShareButton } from "@/components/collab/share-button";
import { TrustBadge } from "@/components/sim/trust-badge";
import { PaeHeatmap } from "@/components/viewer/pae-heatmap";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { MolecularViewerHandle } from "@/components/viewer/molecular-viewer";
import type { Simulation } from "@/types";
import { track } from "@/lib/analytics";
import { formatCount, initials } from "@/lib/format";
import { CATEGORY_LABEL, familySlug } from "@/lib/browse-filters";
import { isSeedAuthor, rcsbStructureUrl } from "@/lib/seed-attribution";
import {
  isPrediction,
  predictionBadgeLabel,
  plddtBucket,
  plddtTooltip,
} from "@/lib/predictions";
import { ExternalLink } from "lucide-react";

// Client workspace: viewer + AI sidebar at top, then the simulation's
// title/author/metadata directly under the viewer in the same column so
// the hierarchy reads viewer → identity → details (instead of being
// pushed below the sidebar). The AI sidebar stays pinned to the right
// of the viewer.

type Props = {
  simulation: Simulation;
  ownerId: string;
  // Server-rendered slot so the like button can read auth state without
  // hauling the page through a client boundary.
  likeSlot?: React.ReactNode;
};

export function SimulationWorkspace({ simulation, ownerId, likeSlot }: Props) {
  const viewerRef = useRef<MolecularViewerHandle | null>(null);

  useEffect(() => {
    track("simulation_viewed", { simulationId: simulation.id });
  }, [simulation.id]);

  const handleReady = useCallback((handle: MolecularViewerHandle) => {
    viewerRef.current = handle;
  }, []);

  const createdAt = new Date(simulation.createdAt).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "short", day: "numeric" },
  );

  const predicted = isPrediction(simulation.structureSource);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-10 lg:gap-6">
      <div className="flex flex-col gap-6 lg:col-span-7">
        <div className="relative h-[55vh] overflow-hidden rounded-2xl border border-border sm:h-[60vh] lg:h-[70vh]">
          <ViewerShell
            pdbUrl={simulation.pdbUrl}
            trajectoryUrl={simulation.trajectoryUrl ?? undefined}
            compressedTrajectoryUrl={simulation.trajectory.compressedUrl}
            rawTrajectoryUrl={simulation.trajectory.rawUrl}
            framesStreamed={simulation.trajectory.framesStreamed}
            hasTrajectory={simulation.hasTrajectory}
            structureSource={simulation.structureSource}
            onReady={handleReady}
          />
          <PresenceLayer
            simulationId={simulation.id}
            viewerRef={viewerRef}
            ownerId={ownerId}
          />
        </div>

        {predicted && simulation.predictionPaeUrl && (
          <PaeHeatmap
            url={simulation.predictionPaeUrl}
            size={320}
            max={simulation.predictionPaeMax}
          />
        )}

        <header className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-medium tracking-[-0.02em] text-foreground sm:text-4xl">
              {simulation.title}
            </h1>
            <ShareButton simulationId={simulation.id} />
          </div>

          {(predicted ||
            simulation.scientificallyReviewedBy ||
            simulation.requestedBy) && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {predicted && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/25 bg-background px-3 py-1 text-xs font-medium text-foreground">
                    <span className="size-1.5 rounded-full bg-foreground/60" />
                    {predictionBadgeLabel(simulation.structureSource)}
                  </span>
                )}
                {predicted && simulation.predictionMeanPlddt !== null && (
                  <abbr
                    title={plddtTooltip(simulation.predictionMeanPlddt)}
                    className="cursor-help rounded-full border border-border bg-background px-3 py-1 font-mono text-xs tabular-nums text-muted-foreground no-underline"
                  >
                    pLDDT {simulation.predictionMeanPlddt.toFixed(1)}
                    <span className="ml-1.5 text-foreground/70">
                      ({plddtBucket(simulation.predictionMeanPlddt)})
                    </span>
                  </abbr>
                )}
                {simulation.scientificallyReviewedBy && (
                  <span className="rounded-full border border-foreground/25 bg-background px-3 py-1 text-xs font-medium text-foreground">
                    Scientifically reviewed by{" "}
                    {simulation.scientificallyReviewedBy}
                    {simulation.reviewedByAffiliation
                      ? `, ${simulation.reviewedByAffiliation}`
                      : ""}
                  </span>
                )}
              </div>
              {simulation.requestedBy && (
                <p className="text-xs italic text-muted-foreground">
                  Requested by {simulation.requestedBy}
                  {simulation.requestedByAffiliation
                    ? `, ${simulation.requestedByAffiliation}`
                    : ""}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4">
            {isSeedAuthor(simulation.author.username) ? (
              predicted ? (
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  Curated from{" "}
                  <span className="font-mono text-foreground">
                    AlphaFold DB
                  </span>
                  <span className="font-mono text-xs">· {createdAt}</span>
                </span>
              ) : (
                <a
                  href={rcsbStructureUrl(simulation.pdbCode)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Curated from{" "}
                  <span className="font-mono text-foreground">
                    RCSB PDB {simulation.pdbCode}
                  </span>
                  <ExternalLink className="size-3.5" />
                  <span className="font-mono text-xs">· {createdAt}</span>
                </a>
              )
            ) : (
              <Link
                href={`/u/${simulation.author.username}`}
                className="flex items-center gap-3 transition-opacity hover:opacity-80"
              >
                <Avatar className="size-10">
                  <AvatarImage src={simulation.author.avatarUrl} alt="" />
                  <AvatarFallback className="bg-muted text-xs text-muted-foreground">
                    {initials(simulation.author.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {simulation.author.name}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    @{simulation.author.username} · {createdAt}
                  </span>
                </div>
              </Link>
            )}

            {!isSeedAuthor(simulation.author.username) &&
              (simulation.viewCount > 0 ||
                simulation.likeCount > 0 ||
                simulation.commentCount > 0 ||
                likeSlot) && (
                <div className="flex items-center gap-5 font-mono text-sm text-muted-foreground">
                  {simulation.viewCount > 0 && (
                    <span className="flex items-center gap-1.5 tabular-nums">
                      <Eye className="size-4" />
                      {formatCount(simulation.viewCount)}
                    </span>
                  )}
                  {likeSlot ??
                    (simulation.likeCount > 0 && (
                      <span className="flex items-center gap-1.5 tabular-nums">
                        <Heart className="size-4" />
                        {formatCount(simulation.likeCount)}
                      </span>
                    ))}
                  {simulation.commentCount > 0 && (
                    <a
                      href="#discussion"
                      className="flex items-center gap-1.5 tabular-nums transition-colors hover:text-foreground"
                    >
                      <MessageCircle className="size-4" />
                      {formatCount(simulation.commentCount)}
                    </a>
                  )}
                </div>
              )}
          </div>
        </header>

        <TrustBadge simulation={simulation} />

        <p className="text-base leading-relaxed text-foreground/85">
          {simulation.description}
        </p>

        {predicted && (
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
            This is a computational prediction, not an experimental
            structure. AlphaFold predictions are useful for generating
            hypotheses about structure and function but should not be
            treated as definitive. Confidence varies across the
            protein — examine the per-residue pLDDT coloring and PAE
            plot below before drawing conclusions about specific regions.
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/browse?category=${simulation.category}`}
            className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            {CATEGORY_LABEL[simulation.category]}
          </Link>
          {simulation.proteinFamily && (
            <Link
              href={`/family/${familySlug(simulation.proteinFamily)}`}
              className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {simulation.proteinFamily}
            </Link>
          )}
          {simulation.organism && (
            <Link
              href={`/browse?organism=${encodeURIComponent(simulation.organism)}`}
              className="rounded-full border border-border bg-background px-3 py-1 text-xs italic text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {simulation.organism}
            </Link>
          )}
          {simulation.pdbCode && (
            <span className="rounded-full border border-border bg-background px-3 py-1 font-mono text-xs text-muted-foreground tabular-nums">
              {simulation.pdbCode}
            </span>
          )}
          {simulation.tags.map((t) => (
            <Link
              key={t}
              href={`/browse?tag=${encodeURIComponent(t)}`}
              className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {t}
            </Link>
          ))}
        </div>
      </div>

      <div className="lg:col-span-3 lg:h-[70vh]">
        <AiSidebar simulationId={simulation.id} viewerRef={viewerRef} />
      </div>
    </div>
  );
}
