"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { hasActiveFilters, type BrowseFilters } from "@/lib/browse-filters";
import { FilterSidebar } from "./filter-sidebar";

type Props = {
  filters: BrowseFilters;
};

export function MobileFilterTrigger({ filters }: Props) {
  const [open, setOpen] = useState(false);

  // Lock scroll while the sheet is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const activeCount =
    filters.categories.length +
    filters.families.length +
    filters.organisms.length +
    filters.experiments.length +
    (filters.trajectory ? 1 : 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-foreground/30",
          hasActiveFilters(filters) && "border-primary text-primary",
        )}
      >
        <SlidersHorizontal className="size-4" />
        Filters
        {activeCount > 0 && (
          <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 font-mono text-[10px] text-primary-foreground tabular-nums">
            {activeCount}
          </span>
        )}
      </button>

      {/* Scrim */}
      <div
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-background/60 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filter simulations"
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border bg-background transition-transform duration-200 lg:hidden",
          open ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background/95 px-5 py-3 backdrop-blur">
          <span className="text-sm font-medium">Filters</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close filters"
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="px-5 py-5 pb-10">
          <FilterSidebar filters={filters} />
        </div>
      </div>
    </>
  );
}
