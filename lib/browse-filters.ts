import type {
  ExperimentType,
  Simulation,
  SimulationCategory,
} from "@/types";
import { mockSimulations } from "./mock-data";

export const CATEGORIES: { value: SimulationCategory; label: string }[] = [
  { value: "protein", label: "Protein" },
  { value: "dna", label: "DNA" },
  { value: "rna", label: "RNA" },
  { value: "membrane", label: "Membrane" },
  { value: "drug-complex", label: "Drug complex" },
  { value: "enzyme", label: "Enzyme" },
  { value: "antibody", label: "Antibody" },
  { value: "receptor", label: "Receptor" },
];

export const CATEGORY_LABEL: Record<SimulationCategory, string> =
  Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label])) as Record<
    SimulationCategory,
    string
  >;

export const EXPERIMENT_TYPES: { value: ExperimentType; label: string }[] = [
  { value: "equilibrium MD", label: "Equilibrium MD" },
  { value: "steered MD", label: "Steered MD" },
  { value: "free energy", label: "Free energy" },
  { value: "binding", label: "Binding" },
  { value: "folding", label: "Folding" },
];

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "views", label: "Most viewed" },
  { value: "likes", label: "Most liked" },
  { value: "alpha", label: "Alphabetical" },
] as const;
export type SortKey = (typeof SORT_OPTIONS)[number]["value"];

// All distinct families present in the data, sorted.
export function getAllFamilies(): string[] {
  return Array.from(
    new Set(
      mockSimulations
        .map((s) => s.proteinFamily)
        .filter((f): f is string => !!f),
    ),
  ).sort();
}

// All distinct organisms present in the data, sorted.
export function getAllOrganisms(): string[] {
  return Array.from(
    new Set(
      mockSimulations
        .map((s) => s.organism)
        .filter((o): o is string => !!o),
    ),
  ).sort();
}

// Stable, URL-safe slug for a family name. Round-trips via findFamilyBySlug.
export function familySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function findFamilyBySlug(slug: string): string | undefined {
  return getAllFamilies().find((f) => familySlug(f) === slug);
}

// Parse a comma-separated query param into an array of values.
export function parseMulti(value: string | string[] | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap((v) => v.split(",")).filter(Boolean);
  return value.split(",").filter(Boolean);
}

export type BrowseFilters = {
  q?: string;
  categories: string[];
  families: string[];
  organisms: string[];
  experiments: string[];
  trajectory?: "yes" | "no";
  sort: SortKey;
};

export function parseFilters(
  searchParams: Record<string, string | string[] | undefined>,
): BrowseFilters {
  const sortRaw = typeof searchParams.sort === "string" ? searchParams.sort : "";
  const sort = (SORT_OPTIONS.find((s) => s.value === sortRaw)?.value ??
    "newest") as SortKey;
  const trajectoryRaw =
    typeof searchParams.trajectory === "string" ? searchParams.trajectory : "";
  const trajectory: "yes" | "no" | undefined =
    trajectoryRaw === "yes" || trajectoryRaw === "no" ? trajectoryRaw : undefined;

  return {
    q: typeof searchParams.q === "string" ? searchParams.q : undefined,
    categories: parseMulti(searchParams.category),
    families: parseMulti(searchParams.family),
    organisms: parseMulti(searchParams.organism),
    experiments: parseMulti(searchParams.experiment),
    trajectory,
    sort,
  };
}

export function applyFilters(
  sims: Simulation[],
  f: BrowseFilters,
): Simulation[] {
  let result = sims;

  if (f.q && f.q.trim()) {
    const q = f.q.trim().toLowerCase();
    result = result.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.pdbCode.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }
  if (f.categories.length > 0) {
    result = result.filter((s) => f.categories.includes(s.category));
  }
  if (f.families.length > 0) {
    result = result.filter(
      (s) => s.proteinFamily && f.families.includes(s.proteinFamily),
    );
  }
  if (f.organisms.length > 0) {
    result = result.filter(
      (s) => s.organism && f.organisms.includes(s.organism),
    );
  }
  if (f.experiments.length > 0) {
    result = result.filter((s) => f.experiments.includes(s.experimentType));
  }
  if (f.trajectory === "yes") {
    result = result.filter((s) => s.hasTrajectory);
  } else if (f.trajectory === "no") {
    result = result.filter((s) => !s.hasTrajectory);
  }

  return applySort(result, f.sort);
}

export function applySort(sims: Simulation[], sort: SortKey): Simulation[] {
  const copy = [...sims];
  switch (sort) {
    case "views":
      return copy.sort((a, b) => b.viewCount - a.viewCount);
    case "likes":
      return copy.sort((a, b) => b.likeCount - a.likeCount);
    case "alpha":
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case "newest":
    default:
      return copy.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }
}

export function hasActiveFilters(f: BrowseFilters): boolean {
  return (
    !!f.q?.trim() ||
    f.categories.length > 0 ||
    f.families.length > 0 ||
    f.organisms.length > 0 ||
    f.experiments.length > 0 ||
    !!f.trajectory
  );
}

// Count sims that satisfy *every other filter* — used to show "(n)" counts next
// to each option in the sidebar.
export function countForOption(
  base: Simulation[],
  f: BrowseFilters,
  except: keyof BrowseFilters,
  optionValue: string,
): number {
  const stripped: BrowseFilters = { ...f, [except]: [] };
  switch (except) {
    case "categories":
      return applyFilters(base, { ...stripped, categories: [optionValue] }).length;
    case "families":
      return applyFilters(base, { ...stripped, families: [optionValue] }).length;
    case "organisms":
      return applyFilters(base, { ...stripped, organisms: [optionValue] }).length;
    case "experiments":
      return applyFilters(base, { ...stripped, experiments: [optionValue] })
        .length;
    default:
      return 0;
  }
}
