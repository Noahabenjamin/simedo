import Link from "next/link";
import { familySlug } from "@/lib/browse-filters";
import { mockSimulations } from "@/lib/mock-data";

type Props = {
  family: string;
};

// Compute "related" as: families whose simulations share at least one category
// with the current family, excluding the family itself.
function computeRelatedFamilies(family: string): string[] {
  const familySims = mockSimulations.filter((s) => s.proteinFamily === family);
  if (familySims.length === 0) return [];
  const categories = new Set(familySims.map((s) => s.category));
  const related = new Set<string>();
  for (const s of mockSimulations) {
    if (
      s.proteinFamily &&
      s.proteinFamily !== family &&
      categories.has(s.category)
    ) {
      related.add(s.proteinFamily);
    }
  }
  return Array.from(related).sort();
}

export function RelatedFamiliesRow({ family }: Props) {
  const related = computeRelatedFamilies(family);
  if (related.length === 0) return null;

  return (
    <section className="mt-16 flex flex-col gap-6">
      <h2 className="text-xl font-medium tracking-tight text-foreground sm:text-2xl">
        Related families
      </h2>

      <div className="scrollbar-hidden -mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex snap-x snap-mandatory gap-3 pb-2 lg:gap-4">
          {related.map((f) => {
            const count = mockSimulations.filter(
              (s) => s.proteinFamily === f,
            ).length;
            return (
              <Link
                key={f}
                href={`/family/${familySlug(f)}`}
                className="group flex w-[200px] shrink-0 snap-start flex-col gap-1 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-foreground/30 sm:w-[220px]"
              >
                <span className="text-sm font-medium tracking-tight text-foreground group-hover:text-primary transition-colors">
                  {f}
                </span>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {count} {count === 1 ? "simulation" : "simulations"}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
