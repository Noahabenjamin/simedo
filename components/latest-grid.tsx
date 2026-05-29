import { SimulationCard } from "@/components/simulation-card";
import { SectionHeading } from "@/components/section-heading";
import { FilterChips } from "@/components/filter-chips";
import type { Simulation } from "@/types";

type Props = {
  simulations: Simulation[];
};

export function LatestGrid({ simulations }: Props) {
  return (
    <section
      id="latest"
      className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 sm:px-6 lg:px-8"
    >
      <SectionHeading
        title="Latest uploads"
        description="Fresh simulations from the community."
      />

      <div className="mb-8">
        <FilterChips />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {simulations.map((s) => (
          <SimulationCard key={s.id} simulation={s} />
        ))}
      </div>
    </section>
  );
}
