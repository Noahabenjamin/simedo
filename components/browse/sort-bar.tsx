"use client";

import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SORT_OPTIONS, type SortKey } from "@/lib/browse-filters";
import { cn } from "@/lib/utils";
import { useFilterUrl } from "./use-filter-url";

type Props = {
  total: number;
  shown: number;
  sort: SortKey;
};

export function SortBar({ total, shown, sort }: Props) {
  const { setSingle } = useFilterUrl();
  const activeLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label;

  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <p className="font-mono text-xs text-muted-foreground tabular-nums">
        Showing <span className="text-foreground">{shown}</span> of {total}{" "}
        simulations
      </p>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-sm text-foreground transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
          <span className="text-muted-foreground">Sort:</span>
          <span className="font-medium">{activeLabel}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={6}>
          {SORT_OPTIONS.map((opt) => (
            <DropdownMenuItem
              key={opt.value}
              onClick={() =>
                setSingle("sort", opt.value === "newest" ? undefined : opt.value)
              }
              className={cn(
                "cursor-pointer text-sm",
                sort === opt.value && "text-primary",
              )}
            >
              {opt.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
