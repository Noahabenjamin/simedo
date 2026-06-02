import { createClient } from "@/lib/supabase/server";
import { mockSimulations } from "@/lib/mock-data";
import type {
  ExperimentType,
  Simulation,
  SimulationCategory,
} from "@/types";
import {
  applyFilters,
  type BrowseFilters,
} from "@/lib/browse-filters";
import { isDbAvailable } from "./db-available";

// Server-side data access. Pages import only this file — they never talk to
// Supabase directly. When env vars are missing the fetchers return mock data,
// so the UI stays renderable during local dev.

// --- Shape mapping --------------------------------------------------------

type DbSimulationRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  pdb_code: string | null;
  pdb_url: string;
  trajectory_url: string | null;
  has_trajectory: boolean | null;
  thumbnail_url: string | null;
  category: SimulationCategory;
  protein_family: string | null;
  organism: string | null;
  experiment_type: ExperimentType;
  resolution: number | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  users: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  simulation_tags: { tags: { name: string } | null }[] | null;
};

function mapRow(row: DbSimulationRow): Simulation {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    pdbCode: row.pdb_code ?? "",
    pdbUrl: row.pdb_url,
    trajectoryUrl: row.trajectory_url,
    hasTrajectory: row.has_trajectory ?? false,
    thumbnailUrl:
      row.thumbnail_url && !row.thumbnail_url.includes("placehold.co")
        ? row.thumbnail_url
        : `/api/thumbnail/${(row.pdb_code ?? "").toLowerCase()}`,
    category: row.category,
    proteinFamily: row.protein_family ?? undefined,
    organism: row.organism ?? undefined,
    experimentType: row.experiment_type,
    resolution: row.resolution ?? undefined,
    viewCount: row.view_count,
    likeCount: row.like_count,
    commentCount: row.comment_count,
    createdAt: row.created_at,
    author: {
      name: row.users?.display_name ?? row.users?.username ?? "Unknown",
      username: row.users?.username ?? "unknown",
      avatarUrl:
        row.users?.avatar_url ??
        `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
          row.users?.username ?? "U",
        )}&backgroundColor=0F6E56`,
    },
    tags:
      row.simulation_tags
        ?.map((st) => st.tags?.name)
        .filter((n): n is string => !!n) ?? [],
  };
}

const ROW_SELECT = `
  id, user_id, title, description, pdb_code, pdb_url, trajectory_url,
  has_trajectory, thumbnail_url, category, protein_family, organism,
  experiment_type, resolution, view_count, like_count, comment_count,
  created_at,
  users:user_id (username, display_name, avatar_url),
  simulation_tags ( tags ( name ) )
`;

// --- Fetchers -------------------------------------------------------------

export async function getSimulation(id: string): Promise<Simulation | null> {
  if (!isDbAvailable()) {
    return mockSimulations.find((s) => s.id === id) ?? null;
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("simulations")
    .select(ROW_SELECT)
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return mapRow(data as unknown as DbSimulationRow);
}

export async function listSimulations(opts: {
  limit?: number;
  filters?: BrowseFilters;
} = {}): Promise<Simulation[]> {
  if (!isDbAvailable()) {
    const sims = opts.filters ? applyFilters(mockSimulations, opts.filters) : mockSimulations;
    return opts.limit ? sims.slice(0, opts.limit) : sims;
  }

  const supabase = await createClient();
  let query = supabase
    .from("simulations")
    .select(ROW_SELECT)
    .eq("visibility", "public");

  if (opts.filters) {
    const f = opts.filters;
    if (f.q) {
      query = query.textSearch("search_tsv", f.q, { type: "websearch" });
    }
    if (f.categories.length > 0) {
      query = query.in("category", f.categories);
    }
    if (f.families.length > 0) {
      query = query.in("protein_family", f.families);
    }
    if (f.organisms.length > 0) {
      query = query.in("organism", f.organisms);
    }
    if (f.experiments.length > 0) {
      query = query.in("experiment_type", f.experiments);
    }
    if (f.trajectory === "yes") {
      query = query.not("trajectory_url", "is", null);
    } else if (f.trajectory === "no") {
      query = query.is("trajectory_url", null);
    }

    switch (f.sort) {
      case "views":
        query = query.order("view_count", { ascending: false });
        break;
      case "likes":
        query = query.order("like_count", { ascending: false });
        break;
      case "alpha":
        query = query.order("title", { ascending: true });
        break;
      default:
        query = query.order("created_at", { ascending: false });
    }
  } else {
    query = query.order("created_at", { ascending: false });
  }

  if (opts.limit) query = query.limit(opts.limit);

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as unknown as DbSimulationRow[]).map(mapRow);
}

export async function getSimulationsByFamily(
  family: string,
): Promise<Simulation[]> {
  if (!isDbAvailable()) {
    return mockSimulations.filter((s) => s.proteinFamily === family);
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("simulations")
    .select(ROW_SELECT)
    .eq("protein_family", family)
    .eq("visibility", "public")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as unknown as DbSimulationRow[]).map(mapRow);
}

export async function getRelatedSimulations(
  sim: Simulation,
  count = 3,
): Promise<Simulation[]> {
  if (!isDbAvailable()) {
    const all = mockSimulations.filter((s) => s.id !== sim.id);
    if (sim.proteinFamily) {
      const sameFamily = all.filter((s) => s.proteinFamily === sim.proteinFamily);
      if (sameFamily.length >= count) return sameFamily.slice(0, count);
      const sameCat = all.filter(
        (s) => s.category === sim.category && s.proteinFamily !== sim.proteinFamily,
      );
      return [...sameFamily, ...sameCat].slice(0, count);
    }
    return all.filter((s) => s.category === sim.category).slice(0, count);
  }
  const supabase = await createClient();
  let query = supabase
    .from("simulations")
    .select(ROW_SELECT)
    .neq("id", sim.id)
    .eq("visibility", "public")
    .limit(count);
  if (sim.proteinFamily) {
    query = query.eq("protein_family", sim.proteinFamily);
  } else {
    query = query.eq("category", sim.category);
  }
  const { data, error } = await query;
  if (error || !data) return [];
  return (data as unknown as DbSimulationRow[]).map(mapRow);
}

export async function getAllFamilies(): Promise<string[]> {
  if (!isDbAvailable()) {
    return Array.from(
      new Set(
        mockSimulations
          .map((s) => s.proteinFamily)
          .filter((f): f is string => !!f),
      ),
    ).sort();
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("simulations")
    .select("protein_family")
    .eq("visibility", "public")
    .not("protein_family", "is", null);
  if (!data) return [];
  return Array.from(
    new Set((data as { protein_family: string }[]).map((d) => d.protein_family)),
  ).sort();
}

// Fire-and-forget view increment. Errors are swallowed — they don't block render.
export async function incrementViewCount(id: string): Promise<void> {
  if (!isDbAvailable()) return;
  const supabase = await createClient();
  await supabase.rpc("increment_view_count", { sim_id: id });
}
