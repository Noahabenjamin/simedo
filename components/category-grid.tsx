import Link from "next/link";
import {
  Atom,
  Dna,
  FlaskConical,
  Layers,
  Pill,
  Radio,
  Shield,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import type { SimulationCategory } from "@/types";
import { mockSimulations } from "@/lib/mock-data";

type Category = {
  slug: SimulationCategory;
  name: string;
  Icon: LucideIcon;
};

// 8 categories mirroring the filter taxonomy in /browse.
const CATEGORIES: Category[] = [
  { slug: "protein", name: "Proteins", Icon: Atom },
  { slug: "dna", name: "DNA", Icon: Dna },
  { slug: "rna", name: "RNA", Icon: Workflow },
  { slug: "membrane", name: "Membranes", Icon: Layers },
  { slug: "drug-complex", name: "Drug complexes", Icon: Pill },
  { slug: "enzyme", name: "Enzymes", Icon: FlaskConical },
  { slug: "antibody", name: "Antibodies", Icon: Shield },
  { slug: "receptor", name: "Receptors", Icon: Radio },
];

function countForCategory(slug: SimulationCategory): number {
  return mockSimulations.filter((s) => s.category === slug).length;
}

export function CategoryGrid() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeading
        title="Browse by category"
        description="Find the structures and systems you care about."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {CATEGORIES.map((c) => {
          const count = countForCategory(c.slug);
          return (
            <Link
              key={c.slug}
              href={`/browse?category=${c.slug}`}
              className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-7 transition-colors hover:border-foreground/30"
            >
              <div className="flex size-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors group-hover:text-primary">
                <c.Icon className="size-5" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-base font-medium tracking-tight text-foreground">
                  {c.name}
                </h3>
                <p className="font-mono text-xs tabular-nums text-muted-foreground">
                  {count.toLocaleString()}{" "}
                  {count === 1 ? "simulation" : "simulations"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
