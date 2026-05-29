import { Suspense } from "react";
import { BrowseSearchInput } from "@/components/browse/search-input";
import { FilterSidebar } from "@/components/browse/filter-sidebar";
import { MobileFilterTrigger } from "@/components/browse/mobile-filter-trigger";
import { SortBar } from "@/components/browse/sort-bar";
import { SimulationCard } from "@/components/simulation-card";
import { CardGridSkeleton } from "@/components/skeletons";
import { TrendingRow } from "@/components/trending-row";
import { CategoryGrid } from "@/components/category-grid";
import { parseFilters, hasActiveFilters } from "@/lib/browse-filters";
import { listSimulations } from "@/lib/data/simulations";
import { mockSimulations } from "@/lib/mock-data";
import { isDbAvailable } from "@/lib/data/db-available";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BrowsePage({ searchParams }: Props) {
  const params = await searchParams;
  const filters = parseFilters(params);

  // We need a total count for the "Showing X of Y" line. Cheap heuristic:
  // when DB is available, fetch the unfiltered count; otherwise use mock len.
  const totalPromise = isDbAvailable()
    ? listSimulations().then((s) => s.length)
    : Promise.resolve(mockSimulations.length);

  const [filtered, total] = await Promise.all([
    listSimulations({ filters }),
    totalPromise,
  ]);

  // Only show the curated discovery rows when the user hasn't already
  // applied filters — otherwise they'd push the actual filtered results
  // way down the page.
  const showDiscovery = !hasActiveFilters(filters);
  const trending = mockSimulations.slice(0, 6);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <header className="mb-8 flex flex-col gap-2 lg:mb-12">
        <h1 className="text-3xl font-medium tracking-[-0.02em] text-foreground sm:text-4xl">
          Browse simulations
        </h1>
        <p className="text-sm text-muted-foreground">
          Filter by category, family, organism, and more.
        </p>
      </header>

      {showDiscovery && (
        <div className="mb-16 flex flex-col gap-16 lg:mb-24 lg:gap-24">
          <TrendingRow simulations={trending} />
          <CategoryGrid />
        </div>
      )}

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <aside className="hidden shrink-0 lg:block lg:w-[260px]">
          <div className="sticky top-20 flex max-h-[calc(100vh-6rem)] flex-col gap-5 overflow-y-auto pr-2">
            <Suspense fallback={null}>
              <BrowseSearchInput />
            </Suspense>
            <Suspense fallback={null}>
              <FilterSidebar filters={filters} />
            </Suspense>
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <div className="mb-6 flex flex-col gap-3 lg:hidden">
            <Suspense fallback={null}>
              <BrowseSearchInput />
            </Suspense>
            <Suspense fallback={null}>
              <MobileFilterTrigger filters={filters} />
            </Suspense>
          </div>

          <Suspense fallback={null}>
            <SortBar total={total} shown={filtered.length} sort={filters.sort} />
          </Suspense>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-6 py-20 text-center">
              <p className="text-sm font-medium text-foreground">
                No simulations match these filters.
              </p>
              <p className="text-xs text-muted-foreground">
                Try removing some, or clear them all.
              </p>
            </div>
          ) : (
            <Suspense fallback={<CardGridSkeleton count={6} />}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6 xl:grid-cols-3">
                {filtered.map((s) => (
                  <SimulationCard key={s.id} simulation={s} />
                ))}
              </div>
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}
