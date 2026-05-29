"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const FILTERS = [
  "All",
  "Proteins",
  "DNA / RNA",
  "Drug binding",
  "Membrane",
  "Trending",
  "Recent",
] as const;

export function FilterChips() {
  // Visual-only for now — real filtering ships with the data layer (phase 5).
  const [active, setActive] = useState<(typeof FILTERS)[number]>("All");

  return (
    <div className="flex flex-wrap items-center gap-2">
      {FILTERS.map((f) => {
        const isActive = active === f;
        return (
          <button
            key={f}
            type="button"
            onClick={() => setActive(f)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
            aria-pressed={isActive}
          >
            {f}
          </button>
        );
      })}
    </div>
  );
}
