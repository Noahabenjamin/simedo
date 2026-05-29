import { SimulationCard } from "@/components/simulation-card";
import type { Simulation } from "@/types";

type Props = {
  simulations: Simulation[];
  title?: string;
  description?: string;
};

export function RelatedSimulations({
  simulations,
  title = "Related simulations",
  description,
}: Props) {
  if (simulations.length === 0) return null;

  return (
    <section className="mt-10 flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl font-medium tracking-tight text-foreground sm:text-2xl">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {simulations.map((s) => (
          <SimulationCard key={s.id} simulation={s} />
        ))}
      </div>
    </section>
  );
}
