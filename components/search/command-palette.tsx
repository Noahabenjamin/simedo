"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Atom, Clock, Search, TrendingUp, UserRound, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/format";

// Cmd-K palette. Opens via keyboard or external `open` event. Searches the
// /api/search endpoint with debouncing, renders sims + users grouped,
// remembers recent queries in localStorage, and shows a trending fallback
// when the input is empty.

type SimHit = {
  type: "simulation";
  id: string;
  title: string;
  pdbCode: string;
  category: string;
  proteinFamily: string | null;
  organism: string | null;
};

type UserHit = {
  type: "user";
  username: string;
  displayName: string;
  institution: string | null;
  avatarUrl: string | null;
};

type SearchResponse = {
  simulations: SimHit[];
  users: UserHit[];
};

const RECENT_KEY = "helix-search-recent-v1";
const RECENT_MAX = 5;

const TRENDING_QUERIES = [
  "hemoglobin",
  "CRISPR",
  "kinase",
  "GPCR",
  "ubiquitin",
];

type PaletteEventDetail = { initialQuery?: string };

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse>({
    simulations: [],
    users: [],
  });
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Open via Cmd-K / Ctrl-K, "/" (when not typing in a form field), or
  // via a custom window event from the header.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isModK =
        (e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey);
      if (isModK) {
        e.preventDefault();
        setOpen(true);
        return;
      }
      if (e.key === "/" && !isTypingTarget(e.target)) {
        e.preventDefault();
        setOpen(true);
        return;
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<PaletteEventDetail>).detail ?? {};
      if (detail.initialQuery) setQuery(detail.initialQuery);
      setOpen(true);
    };
    window.addEventListener("helix:open-palette", onOpen);
    return () => window.removeEventListener("helix:open-palette", onOpen);
  }, []);

  // Hydrate recent searches.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setRecent(arr.filter((x) => typeof x === "string").slice(0, RECENT_MAX));
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Focus the input every time the palette opens.
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      // Reset transient palette state on close.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("");
      setActiveIdx(0);
    }
  }, [open]);

  // Debounced fetch.
  useEffect(() => {
    if (!open) return;
    if (query.trim().length < 2) {
      // Clear stale results when the user erases their query.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults({ simulations: [], users: [] });
      setLoading(false);
      return;
    }
    const handle = setTimeout(() => {
      abortRef.current?.abort();
      const ctl = new AbortController();
      abortRef.current = ctl;
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, {
        signal: ctl.signal,
      })
        .then((r) => (r.ok ? (r.json() as Promise<SearchResponse>) : null))
        .then((data) => {
          if (!data) return;
          setResults(data);
          setActiveIdx(0);
        })
        .catch(() => {
          /* aborted or network — ignore */
        })
        .finally(() => setLoading(false));
    }, 180);
    return () => clearTimeout(handle);
  }, [query, open]);

  const flatItems = useMemo(() => {
    const items: { href: string; label: string }[] = [];
    for (const s of results.simulations) {
      items.push({ href: `/simulation/${s.id}`, label: s.title });
    }
    for (const u of results.users) {
      items.push({ href: `/u/${u.username}`, label: u.displayName });
    }
    return items;
  }, [results]);

  const commitRecent = useCallback(
    (q: string) => {
      if (!q.trim()) return;
      const next = [q.trim(), ...recent.filter((r) => r !== q.trim())].slice(
        0,
        RECENT_MAX,
      );
      setRecent(next);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [recent],
  );

  const close = useCallback(() => setOpen(false), []);

  const onNavigate = useCallback(
    (href: string, queryToCommit?: string) => {
      if (queryToCommit) commitRecent(queryToCommit);
      else if (query.trim()) commitRecent(query);
      close();
      router.push(href);
    },
    [router, close, commitRecent, query],
  );

  const onInputKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(flatItems.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (flatItems[activeIdx]) onNavigate(flatItems[activeIdx].href);
        else if (query.trim()) {
          commitRecent(query);
          router.push(`/browse?q=${encodeURIComponent(query.trim())}`);
          close();
        }
      }
    },
    [activeIdx, flatItems, query, onNavigate, commitRecent, router, close],
  );

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      className="fixed inset-0 z-[60] flex items-start justify-center bg-foreground/30 px-4 pt-[10vh] backdrop-blur-sm"
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="size-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Search simulations, proteins, people"
            className="h-12 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            aria-label="Search query"
          />
          <button
            type="button"
            onClick={close}
            aria-label="Close search"
            className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim().length < 2 ? (
            <EmptyHints
              recent={recent}
              onPickRecent={(q) => {
                setQuery(q);
              }}
              onClearRecent={() => {
                setRecent([]);
                try {
                  localStorage.removeItem(RECENT_KEY);
                } catch {
                  /* ignore */
                }
              }}
            />
          ) : loading && results.simulations.length === 0 && results.users.length === 0 ? (
            <p className="px-5 py-8 text-center text-xs text-muted-foreground">
              Searching…
            </p>
          ) : results.simulations.length === 0 && results.users.length === 0 ? (
            <p className="px-5 py-8 text-center text-xs text-muted-foreground">
              No matches for &quot;{query}&quot;.
            </p>
          ) : (
            <Results
              results={results}
              activeIdx={activeIdx}
              onPick={onNavigate}
            />
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-2 font-mono text-[10px] text-muted-foreground">
          <span>↵ open · ↑↓ navigate · esc close</span>
          <span>Cmd-K to reopen</span>
        </div>
      </div>
    </div>
  );
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

function EmptyHints({
  recent,
  onPickRecent,
  onClearRecent,
}: {
  recent: string[];
  onPickRecent: (q: string) => void;
  onClearRecent: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 px-3 py-4">
      {recent.length > 0 && (
        <section>
          <div className="flex items-center justify-between px-2 pb-1">
            <SectionTitle icon={<Clock className="size-3" />}>
              Recent
            </SectionTitle>
            <button
              type="button"
              onClick={onClearRecent}
              className="text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear
            </button>
          </div>
          <ul>
            {recent.map((q) => (
              <li key={q}>
                <button
                  type="button"
                  onClick={() => onPickRecent(q)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-muted"
                >
                  <Search className="size-3 text-muted-foreground" />
                  {q}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <SectionTitle icon={<TrendingUp className="size-3" />}>
          Try
        </SectionTitle>
        <ul>
          {TRENDING_QUERIES.map((q) => (
            <li key={q}>
              <button
                type="button"
                onClick={() => onPickRecent(q)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-muted"
              >
                <TrendingUp className="size-3 text-muted-foreground" />
                {q}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Results({
  results,
  activeIdx,
  onPick,
}: {
  results: SearchResponse;
  activeIdx: number;
  onPick: (href: string) => void;
}) {
  let i = 0;
  return (
    <div className="flex flex-col gap-1 px-3 py-2">
      {results.simulations.length > 0 && (
        <section>
          <SectionTitle icon={<Atom className="size-3" />}>
            Simulations
          </SectionTitle>
          <ul>
            {results.simulations.map((s) => {
              const idx = i++;
              const active = idx === activeIdx;
              return (
                <li key={s.id}>
                  <Link
                    href={`/simulation/${s.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onPick(`/simulation/${s.id}`);
                    }}
                    className={`flex items-center gap-3 rounded-md px-2 py-2 transition-colors ${
                      active ? "bg-muted" : "hover:bg-muted/60"
                    }`}
                  >
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {s.pdbCode || "PDB"}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm text-foreground">
                        {s.title}
                      </span>
                      <span className="truncate text-[11px] text-muted-foreground">
                        {[s.proteinFamily, s.organism].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {results.users.length > 0 && (
        <section>
          <SectionTitle icon={<UserRound className="size-3" />}>
            People
          </SectionTitle>
          <ul>
            {results.users.map((u) => {
              const idx = i++;
              const active = idx === activeIdx;
              return (
                <li key={u.username}>
                  <Link
                    href={`/u/${u.username}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onPick(`/u/${u.username}`);
                    }}
                    className={`flex items-center gap-3 rounded-md px-2 py-2 transition-colors ${
                      active ? "bg-muted" : "hover:bg-muted/60"
                    }`}
                  >
                    <Avatar className="size-6">
                      <AvatarImage src={u.avatarUrl ?? undefined} alt="" />
                      <AvatarFallback className="bg-muted text-[10px] text-muted-foreground">
                        {initials(u.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm text-foreground">
                        {u.displayName}
                      </span>
                      <span className="truncate text-[11px] text-muted-foreground">
                        @{u.username}
                        {u.institution ? ` · ${u.institution}` : ""}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function SectionTitle({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 px-2 pb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
      {icon}
      {children}
    </div>
  );
}
