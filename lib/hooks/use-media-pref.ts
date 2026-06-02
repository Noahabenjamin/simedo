"use client";

import { useSyncExternalStore } from "react";

// Match a media query without the setState-in-effect lint trap. We hand
// React a subscribe/getSnapshot pair so the value comes from the actual
// MediaQueryList event stream rather than a state copy we have to sync.
// The server snapshot is `false` so SSR markup is stable.

function makeMediaStore(query: string) {
  return {
    subscribe(onChange: () => void) {
      if (typeof window === "undefined") return () => {};
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    getSnapshot(): boolean {
      if (typeof window === "undefined") return false;
      return window.matchMedia(query).matches;
    },
    getServerSnapshot(): boolean {
      return false;
    },
  };
}

const STORE_CACHE = new Map<string, ReturnType<typeof makeMediaStore>>();
function getStore(query: string) {
  let store = STORE_CACHE.get(query);
  if (!store) {
    store = makeMediaStore(query);
    STORE_CACHE.set(query, store);
  }
  return store;
}

export function useReducedMotion(): boolean {
  const store = getStore("(prefers-reduced-motion: reduce)");
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
}

export function useIsNarrow(breakpoint: number = 640): boolean {
  const store = getStore(`(max-width: ${breakpoint}px)`);
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
}
