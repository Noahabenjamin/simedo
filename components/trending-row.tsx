import { SimulationCard } from "@/components/simulation-card";
import { SectionHeading } from "@/components/section-heading";
import type { Simulation } from "@/types";

type Props = {
  simulations: Simulation[];
};

export function TrendingRow({ simulations }: Props) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeading
        title="Trending this week"
        description="What researchers are looking at right now."
      />

      <div className="scrollbar-hidden -mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex snap-x snap-mandatory gap-4 pb-2 lg:gap-6">
          {simulations.map((s) => (
            <div
              key={s.id}
              className="w-[280px] shrink-0 snap-start sm:w-[320px] lg:w-[360px]"
            >
              <SimulationCard simulation={s} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
