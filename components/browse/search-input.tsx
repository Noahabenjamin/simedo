"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useFilterUrl } from "./use-filter-url";

export function BrowseSearchInput() {
  const searchParams = useSearchParams();
  const { setSingle } = useFilterUrl();
  const urlQ = searchParams.get("q") ?? "";
  const [value, setValue] = useState(urlQ);

  // Re-sync if the URL is changed by another component (e.g. clear all).
  useEffect(() => {
    setValue(urlQ);
  }, [urlQ]);

  // Push to URL debounced — typing shouldn't push on every keystroke.
  useEffect(() => {
    if (value === urlQ) return;
    const t = setTimeout(() => {
      setSingle("q", value.trim() || undefined);
    }, 220);
    return () => clearTimeout(t);
  }, [value, urlQ, setSingle]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search title, PDB, tags…"
        aria-label="Search simulations"
        className="h-10 rounded-full pl-10 pr-4 text-sm"
      />
    </div>
  );
}
