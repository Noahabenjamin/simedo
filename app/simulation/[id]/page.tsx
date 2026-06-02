import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, Heart, MessageCircle } from "lucide-react";
import { SimulationWorkspace } from "@/components/simulation-workspace";
import { RelatedSimulations } from "@/components/related-simulations";
import { ShareButton } from "@/components/collab/share-button";
import { SimulationJsonLd } from "@/components/sim/json-ld";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCount, initials } from "@/lib/format";
import { CATEGORY_LABEL, familySlug } from "@/lib/browse-filters";
import {
  getRelatedSimulations,
  getSimulation,
  incrementViewCount,
} from "@/lib/data/simulations";

type Props = {
  params: Promise<{ id: string }>;
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://simedo.work";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const sim = await getSimulation(id);
  if (!sim) return { title: "Simulation not found — Helix" };

  const url = `${SITE_URL}/simulation/${id}`;
  const ogImage = `${SITE_URL}/api/og/sim/${id}`;
  const desc =
    sim.description.length > 160
      ? sim.description.slice(0, 157) + "…"
      : sim.description;

  return {
    title: `${sim.title} — Helix`,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: sim.title,
      description: desc,
      url,
      type: "article",
      siteName: "Helix",
      images: [{ url: ogImage, width: 1200, height: 630, alt: sim.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: sim.title,
      description: desc,
      images: [ogImage],
    },
  };
}

export default async function SimulationPage({ params }: Props) {
  const { id } = await params;
  const simulation = await getSimulation(id);
  if (!simulation) notFound();

  void incrementViewCount(id);

  const createdAt = new Date(simulation.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const related = await getRelatedSimulations(simulation, 3);

  const ownerId =
    (simulation as Simulation & { ownerId?: string }).ownerId ?? "";

  return (
    <div className="flex flex-1 flex-col gap-16 pb-24 pt-6 lg:pt-8">
      <SimulationJsonLd
        simulation={simulation}
        url={`${SITE_URL}/simulation/${id}`}
      />

      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SimulationWorkspace simulation={simulation} ownerId={ownerId} />
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          <header className="flex flex-col gap-6">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-medium tracking-[-0.02em] text-foreground sm:text-4xl">
                {simulation.title}
              </h1>
              <ShareButton simulationId={id} />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
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
              </div>

              <div className="flex items-center gap-5 font-mono text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5 tabular-nums">
                  <Eye className="size-4" />
                  {formatCount(simulation.viewCount)}
                </span>
                <span className="flex items-center gap-1.5 tabular-nums">
                  <Heart className="size-4" />
                  {formatCount(simulation.likeCount)}
                </span>
                <span className="flex items-center gap-1.5 tabular-nums">
                  <MessageCircle className="size-4" />
                  {formatCount(simulation.commentCount)}
                </span>
              </div>
            </div>
          </header>

          <p className="text-base leading-relaxed text-foreground/85">
            {simulation.description}
          </p>

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
            <span className="rounded-full border border-border bg-background px-3 py-1 font-mono text-xs text-muted-foreground tabular-nums">
              {simulation.pdbCode}
            </span>
            {simulation.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>

          <RelatedSimulations
            simulations={related}
            description={
              simulation.proteinFamily
                ? `Other simulations in ${simulation.proteinFamily}.`
                : `Other simulations in the same category.`
            }
          />

          <div className="mt-4 rounded-2xl border border-border bg-card px-6 py-16">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex size-12 items-center justify-center rounded-full border border-border text-muted-foreground">
                <MessageCircle className="size-5" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium text-foreground">
                Comments coming soon
              </p>
              <p className="text-xs text-muted-foreground">
                Phase 7 will add discussion threads
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

import type { Simulation } from "@/types";
