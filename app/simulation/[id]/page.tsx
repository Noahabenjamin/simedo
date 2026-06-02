import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SimulationWorkspace } from "@/components/simulation-workspace";
import { RelatedSimulations } from "@/components/related-simulations";
import { SimulationJsonLd } from "@/components/sim/json-ld";
import { CommentSection } from "@/components/comments/comment-section";
import { LikeButton } from "@/components/sim/like-button";
import type { CommentSort } from "@/lib/data/comments";
import {
  getRelatedSimulations,
  getSimulation,
  incrementViewCount,
} from "@/lib/data/simulations";
import type { Simulation } from "@/types";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string }>;
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

const VALID_SORTS: CommentSort[] = ["top", "newest", "oldest"];

export default async function SimulationPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const sort: CommentSort = VALID_SORTS.includes(sp.sort as CommentSort)
    ? (sp.sort as CommentSort)
    : "top";
  const simulation = await getSimulation(id);
  if (!simulation) notFound();

  void incrementViewCount(id);

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
        <SimulationWorkspace
          simulation={simulation}
          ownerId={ownerId}
          likeSlot={
            <LikeButton
              simulationId={simulation.id}
              count={simulation.likeCount}
            />
          }
        />
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-12">
          <RelatedSimulations
            simulations={related}
            description={
              simulation.proteinFamily
                ? `Other simulations in ${simulation.proteinFamily}.`
                : `Other simulations in the same category.`
            }
          />

          <div id="discussion" className="scroll-mt-24">
            <CommentSection simulationId={id} sort={sort} />
          </div>
        </div>
      </section>
    </div>
  );
}
