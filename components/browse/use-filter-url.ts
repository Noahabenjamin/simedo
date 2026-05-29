"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { parseMulti } from "@/lib/browse-filters";

// Small shared utility for filter components: toggle a value in a comma-list
// param, set a single value, or clear everything. Updates the URL via the
// router so the server page re-renders with the new searchParams.
export function useFilterUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const buildParams = useCallback(
    () => new URLSearchParams(searchParams.toString()),
    [searchParams],
  );

  const push = useCallback(
    (params: URLSearchParams) => {
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  const toggleMulti = useCallback(
    (key: string, value: string) => {
      const current = parseMulti(searchParams.get(key) ?? undefined);
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      const params = buildParams();
      if (next.length === 0) params.delete(key);
      else params.set(key, next.join(","));
      push(params);
    },
    [buildParams, push, searchParams],
  );

  const setSingle = useCallback(
    (key: string, value: string | undefined) => {
      const params = buildParams();
      if (!value) params.delete(key);
      else params.set(key, value);
      push(params);
    },
    [buildParams, push],
  );

  const clearAll = useCallback(() => {
    // Preserve sort, drop everything else.
    const sort = searchParams.get("sort");
    const params = new URLSearchParams();
    if (sort) params.set("sort", sort);
    push(params);
  }, [push, searchParams]);

  return { toggleMulti, setSingle, clearAll, searchParams };
}
