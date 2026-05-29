import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SimulationCard } from "@/components/simulation-card";
import { RelatedFamiliesRow } from "@/components/family/related-families-row";
import { findFamilyBySlug, getAllFamilies as getAllFamiliesSync } from "@/lib/browse-filters";
import { getFamilyDescription } from "@/lib/family-descriptions";
import { getSimulationsByFamily } from "@/lib/data/simulations";

type Props = {
  params: Promise<{ family: string }>;
};

export default async function FamilyPage({ params }: Props) {
  const { family: slug } = await params;

  // findFamilyBySlug iterates over family names; use the (sync) static helper
  // that reads from mock data — it still gives the right canonical name even
  // when the DB is live, because family names are consistent across both
  // sources. If a family exists in DB but not mock, falls through and 404s.
  const family = findFamilyBySlug(slug) ?? (await fallbackResolveFamily(slug));
  if (!family) notFound();

  const sims = await getSimulationsByFamily(family);
  if (sims.length === 0) notFound();

  const description = getFamilyDescription(family);

  const resolutions = sims
    .map((s) => s.resolution)
    .filter((r): r is number => typeof r === "number");
  const avgResolution =
    resolutions.length > 0
      ? resolutions.reduce((a, b) => a + b, 0) / resolutions.length
      : null;
  const contributors = new Set(sims.map((s) => s.author.username)).size;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <header className="flex flex-col gap-5">
        <Link
          href="/browse"
          className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to browse
        </Link>

        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-medium tracking-[-0.02em] text-foreground sm:text-5xl">
            {family}
          </h1>
          {description && (
            <p className="max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {description}
            </p>
          )}
        </div>
      </header>

      <div className="mt-10 grid grid-cols-3 gap-4 border-y border-border py-6 lg:mt-12">
        <Stat
          value={sims.length.toString()}
          label={sims.length === 1 ? "Simulation" : "Simulations"}
        />
        <Stat
          value={
            avgResolution !== null ? `${avgResolution.toFixed(2)} Å` : "—"
          }
          label="Average resolution"
        />
        <Stat
          value={contributors.toString()}
          label={contributors === 1 ? "Contributor" : "Contributors"}
        />
      </div>

      <section className="mt-10 flex flex-col gap-6 lg:mt-12">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-xl font-medium tracking-tight text-foreground sm:text-2xl">
            All {family} simulations
          </h2>
          <Link
            href={`/browse?family=${encodeURIComponent(family)}`}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Filter in browse
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {sims.map((s) => (
            <SimulationCard key={s.id} simulation={s} />
          ))}
        </div>
      </section>

      <RelatedFamiliesRow family={family} />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-xl font-medium tabular-nums text-foreground sm:text-2xl">
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

// When the DB is the source of truth, the static getAllFamilies() (mock-derived)
// may miss families. Recheck against actual DB content.
async function fallbackResolveFamily(slug: string): Promise<string | undefined> {
  const { getAllFamilies } = await import("@/lib/data/simulations");
  const families = await getAllFamilies();
  return families.find((f) => {
    return f
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") === slug;
  });
  // Note: getAllFamiliesSync is only used for the static fallback above.
  void getAllFamiliesSync;
}
