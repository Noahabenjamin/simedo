"use client";

import { cn } from "@/lib/utils";
import {
  CATEGORIES,
  EXPERIMENT_TYPES,
  countForOption,
  getAllFamilies,
  getAllOrganisms,
  hasActiveFilters,
  type BrowseFilters,
} from "@/lib/browse-filters";
import { mockSimulations } from "@/lib/mock-data";
import { CheckboxOption } from "./checkbox-option";
import { FilterSection } from "./filter-section";
import { useFilterUrl } from "./use-filter-url";

type Props = {
  filters: BrowseFilters;
};

export function FilterSidebar({ filters }: Props) {
  const { toggleMulti, setSingle, clearAll } = useFilterUrl();
  const families = getAllFamilies();
  const organisms = getAllOrganisms();
  const hasFilters = hasActiveFilters(filters);

  return (
    <div className="flex flex-col gap-5 text-sm">
      <FilterSection title="Category">
        {CATEGORIES.map((c) => (
          <CheckboxOption
            key={c.value}
            label={c.label}
            checked={filters.categories.includes(c.value)}
            onChange={() => toggleMulti("category", c.value)}
            count={countForOption(
              mockSimulations,
              filters,
              "categories",
              c.value,
            )}
          />
        ))}
      </FilterSection>

      <FilterSection title="Protein family">
        {families.map((f) => (
          <CheckboxOption
            key={f}
            label={f}
            checked={filters.families.includes(f)}
            onChange={() => toggleMulti("family", f)}
            count={countForOption(mockSimulations, filters, "families", f)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Organism">
        {organisms.map((o) => (
          <CheckboxOption
            key={o}
            label={o}
            checked={filters.organisms.includes(o)}
            onChange={() => toggleMulti("organism", o)}
            count={countForOption(mockSimulations, filters, "organisms", o)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Experiment type">
        {EXPERIMENT_TYPES.map((e) => (
          <CheckboxOption
            key={e.value}
            label={e.label}
            checked={filters.experiments.includes(e.value)}
            onChange={() => toggleMulti("experiment", e.value)}
            count={countForOption(
              mockSimulations,
              filters,
              "experiments",
              e.value,
            )}
          />
        ))}
      </FilterSection>

      <FilterSection title="Has trajectory">
        <div className="flex gap-2 pt-1">
          {(["yes", "no"] as const).map((v) => {
            const active = filters.trajectory === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setSingle("trajectory", active ? undefined : v)}
                aria-pressed={active}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                )}
              >
                {v === "yes" ? "Yes" : "No"}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {hasFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="self-start text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
