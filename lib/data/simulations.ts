import { createClient } from "@/lib/supabase/server";
import { mockSimulations } from "@/lib/mock-data";
import type {
  CompressionMethod,
  DataOrigin,
  ExperimentType,
  ProcessingStatus,
  Simulation,
  SimulationCategory,
  StructureSource,
  VerificationLevel,
} from "@/types";
import {
  applyFilters,
  expandSourceBucket,
  type BrowseFilters,
} from "@/lib/browse-filters";
import { isDbAvailable } from "./db-available";

// Server-side data access. Pages import only this file — they never talk to
// Supabase directly. When env vars are missing the fetchers return mock data,
// so the UI stays renderable during local dev.

// --- Shape mapping --------------------------------------------------------

// Every optional field below is "maybe in the row" — Phase 5 migrations
// add them, but the mapper has to work when they're absent so /browse
// keeps rendering on a pre-Phase-5 prod schema.
type DbSimulationRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  pdb_code: string | null;
  pdb_url: string;
  trajectory_url: string | null;
  has_trajectory?: boolean | null;
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
  // Provenance + compression (Phase 5, all optional)
  software?: string | null;
  software_version?: string | null;
  force_field_full?: string | null;
  water_model?: string | null;
  temperature_k?: number | null;
  pressure_bar?: number | null;
  ph?: number | null;
  ionic_strength_mm?: number | null;
  trajectory_duration_ns?: number | null;
  simulation_lab?: string | null;
  simulation_institution?: string | null;
  corresponding_author?: string | null;
  corresponding_author_email?: string | null;
  data_origin?: DataOrigin | null;
  original_source_url?: string | null;
  source_doi?: string | null;
  raw_trajectory_url?: string | null;
  raw_trajectory_size_mb?: number | null;
  compressed_trajectory_url?: string | null;
  compressed_trajectory_size_mb?: number | null;
  frames_original?: number | null;
  frames_streamed?: number | null;
  compression_method?: CompressionMethod | null;
  processing_status?: ProcessingStatus | null;
  processing_error?: string | null;
  // Structure provenance (added 2026-06-23, extended 2026-06-28).
  // Present once the alphafold migrations are applied; defaults
  // handled in mapRow so /browse keeps rendering pre-migration.
  structure_source?: StructureSource | null;
  uniprot_id?: string | null;
  alphafold_id?: string | null;
  prediction_mean_plddt?: number | null;
  // Pre-rename name for prediction_mean_plddt. Kept here so the mapper
  // can fall back to it on a prod DB that hasn't run 20260628000001 yet.
  prediction_confidence?: number | null;
  prediction_pae_url?: string | null;
  prediction_pae_max?: number | null;
  requested_by?: string | null;
  requested_by_affiliation?: string | null;
  scientifically_reviewed_by?: string | null;
  reviewed_by_affiliation?: string | null;
  users: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    verification_level?: VerificationLevel | null;
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
    // Prefer compressed (small JSON) → raw R2 → legacy trajectory column.
    // The viewer chooses by inspecting trajectory.compressedUrl / rawUrl;
    // trajectoryUrl is the legacy single-URL field kept for embed/share.
    trajectoryUrl:
      row.compressed_trajectory_url ??
      row.raw_trajectory_url ??
      row.trajectory_url,
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
    provenance: {
      software: row.software ?? null,
      softwareVersion: row.software_version ?? null,
      forceFieldFull: row.force_field_full ?? null,
      waterModel: row.water_model ?? null,
      temperatureK: row.temperature_k ?? null,
      pressureBar: row.pressure_bar ?? null,
      ph: row.ph ?? null,
      ionicStrengthMm: row.ionic_strength_mm ?? null,
      lengthNs: row.trajectory_duration_ns ?? null,
      simulationLab: row.simulation_lab ?? null,
      simulationInstitution: row.simulation_institution ?? null,
      correspondingAuthor: row.corresponding_author ?? null,
      correspondingAuthorEmail: row.corresponding_author_email ?? null,
      dataOrigin: row.data_origin ?? "original",
      originalSourceUrl: row.original_source_url ?? null,
      sourceDoi: row.source_doi ?? null,
      uploaderVerification: row.users?.verification_level ?? "none",
    },
    trajectory: {
      rawUrl: row.raw_trajectory_url ?? null,
      rawSizeMb: row.raw_trajectory_size_mb ?? null,
      compressedUrl: row.compressed_trajectory_url ?? null,
      compressedSizeMb: row.compressed_trajectory_size_mb ?? null,
      framesOriginal: row.frames_original ?? null,
      framesStreamed: row.frames_streamed ?? null,
      compressionMethod: row.compression_method ?? null,
      processingStatus: row.processing_status ?? "ready",
      processingError: row.processing_error ?? null,
    },
    structureSource: row.structure_source ?? "experimental-xray",
    uniprotId: row.uniprot_id ?? null,
    alphafoldId: row.alphafold_id ?? null,
    predictionMeanPlddt:
      row.prediction_mean_plddt ?? row.prediction_confidence ?? null,
    predictionPaeUrl: row.prediction_pae_url ?? null,
    predictionPaeMax: row.prediction_pae_max ?? null,
    requestedBy: row.requested_by ?? null,
    requestedByAffiliation: row.requested_by_affiliation ?? null,
    scientificallyReviewedBy: row.scientifically_reviewed_by ?? null,
    reviewedByAffiliation: row.reviewed_by_affiliation ?? null,
  };
}

// Use `*` for the simulations columns so the query never fails when
// prod is on an older schema. Postgrest fails the ENTIRE query if any
// requested column doesn't exist, and we'd rather silently miss a
// late-added column than have /browse show 0 of 0. The mapper below
// is column-name-tolerant via `?? null` defaults.
//
// History: an earlier version explicitly listed every column. Each
// time we added a migration we had to remember to extend this string,
// and forgetting it (or shipping the code before the migration ran)
// produced the "0 simulations" outage on 2026-06-28.
const ROW_SELECT = `
  *,
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
  if (error) {
    // Errors here used to be silent — making them visible in the server
    // logs so the next "/browse is empty" mystery is one logfetch away.
    console.error("[getSimulation] query error", error);
    return null;
  }
  if (!data) return null;
  // resolveStorageUrls() turns any storage://<bucket>/<path> values into
  // short-lived signed URLs that the viewer can fetch directly. This is
  // the only path that needs them — list/related views never load the
  // actual files into the viewer.
  return await resolveStorageUrls(mapRow(data as unknown as DbSimulationRow));
}

// Lifetime of a signed download URL handed to the viewer. One hour is
// long enough that scrubbing through a trajectory survives, short enough
// that a leaked link won't outlive the session.
const SIGNED_URL_TTL_SECONDS = 60 * 60;

async function resolveStorageUrls(sim: Simulation): Promise<Simulation> {
  const [pdbUrl, trajectoryUrl, rawUrl, compressedUrl] = await Promise.all([
    maybeSign(sim.pdbUrl),
    sim.trajectoryUrl ? maybeSign(sim.trajectoryUrl) : Promise.resolve(null),
    sim.trajectory.rawUrl
      ? maybeSign(sim.trajectory.rawUrl)
      : Promise.resolve(null),
    sim.trajectory.compressedUrl
      ? maybeSign(sim.trajectory.compressedUrl)
      : Promise.resolve(null),
  ]);
  return {
    ...sim,
    pdbUrl,
    trajectoryUrl,
    trajectory: {
      ...sim.trajectory,
      rawUrl,
      compressedUrl,
    },
  };
}

async function maybeSign(url: string): Promise<string> {
  if (url.startsWith("storage://")) {
    // storage://<bucket>/<path> — Supabase Storage, sign for 1h.
    const stripped = url.slice("storage://".length);
    const slash = stripped.indexOf("/");
    if (slash < 0) return url;
    const bucket = stripped.slice(0, slash);
    const path = stripped.slice(slash + 1);
    try {
      const supabase = await createClient();
      const { data } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
      return data?.signedUrl ?? url;
    } catch (e) {
      console.warn("[storage] sign failed", e);
      return url;
    }
  }
  if (url.startsWith("r2://")) {
    // r2://<bucket>/<key> — resolve to a signed R2 download URL so the
    // viewer can fetch it without needing the bucket to be public.
    const { getPresignedDownloadUrl, r2KeyFromUrl } = await import("@/lib/r2");
    const key = r2KeyFromUrl(url);
    if (!key) return url;
    const signed = await getPresignedDownloadUrl(key, SIGNED_URL_TTL_SECONDS);
    return signed ?? url;
  }
  return url;
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
    if (f.sources.length > 0) {
      query = query.in(
        "structure_source",
        f.sources.flatMap(expandSourceBucket),
      );
    }
    if (f.tags.length > 0) {
      // Two-step resolve via the join tables. If no sim has any of the
      // requested tags, the IN clause below collapses to no matches.
      const wanted = f.tags.map((t) => t.toLowerCase());
      const { data: tagRows } = await supabase
        .from("tags")
        .select("id")
        .in("name", wanted);
      const tagIds = (tagRows ?? []).map((t: { id: string }) => t.id);
      if (tagIds.length === 0) return [];
      const { data: stRows } = await supabase
        .from("simulation_tags")
        .select("simulation_id")
        .in("tag_id", tagIds);
      const simIds = Array.from(
        new Set((stRows ?? []).map((s: { simulation_id: string }) => s.simulation_id)),
      );
      if (simIds.length === 0) return [];
      query = query.in("id", simIds);
    }
    if (f.trajectory === "yes") {
      query = query.eq("has_trajectory", true);
    } else if (f.trajectory === "no") {
      query = query.eq("has_trajectory", false);
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
  if (error) {
    console.error("[listSimulations] query error", error);
    return [];
  }
  if (!data) return [];
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

export async function listSimulationsByUser(
  userId: string,
  limit = 24,
): Promise<Simulation[]> {
  if (!isDbAvailable()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("simulations")
    .select(ROW_SELECT)
    .eq("user_id", userId)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as unknown as DbSimulationRow[]).map(mapRow);
}

export async function listSimulationsLikedBy(
  userId: string,
  limit = 24,
): Promise<Simulation[]> {
  if (!isDbAvailable()) return [];
  const supabase = await createClient();
  // Two-step join via the likes table.
  const { data: likes } = await supabase
    .from("likes")
    .select("simulation_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!likes?.length) return [];

  const ids = likes.map((r) => r.simulation_id as string);
  const { data, error } = await supabase
    .from("simulations")
    .select(ROW_SELECT)
    .in("id", ids)
    .eq("visibility", "public");
  if (error || !data) return [];

  // Preserve like-order.
  const order = new Map(ids.map((id, i) => [id, i]));
  return (data as unknown as DbSimulationRow[])
    .map(mapRow)
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

// Fire-and-forget view tracking. Calls the dedup-aware RPC, which inserts
// into simulation_views and only bumps simulations.view_count on a new
// (user, day) row. Errors are swallowed — they don't block render.
export async function incrementViewCount(
  id: string,
  visitorToken: string | null = null,
): Promise<void> {
  if (!isDbAvailable()) return;
  try {
    const supabase = await createClient();
    await supabase.rpc("track_simulation_view", {
      sim_id: id,
      token: visitorToken,
    });
  } catch {
    // Tracking is best-effort; never block the page render.
  }
}

// Trending: most viewed in the last `days` window, weighted by likes and
// comments to surface high-engagement sims over high-traffic empties.
// Returns up to `limit` rows; returns an empty array if no sim has any
// recent views, so the caller can hide the section honestly.
export async function listTrendingSimulations(
  days: number = 7,
  limit: number = 6,
): Promise<Simulation[]> {
  if (!isDbAvailable()) return [];
  const supabase = await createClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // Group views in the window by simulation_id, then weight + sort client-side.
  const { data: views } = await supabase
    .from("simulation_views")
    .select("simulation_id")
    .gte("created_at", since);

  if (!views?.length) return [];

  const viewsBySim = new Map<string, number>();
  for (const row of views as { simulation_id: string }[]) {
    viewsBySim.set(
      row.simulation_id,
      (viewsBySim.get(row.simulation_id) ?? 0) + 1,
    );
  }

  const candidateIds = Array.from(viewsBySim.keys());
  if (candidateIds.length === 0) return [];

  const { data } = await supabase
    .from("simulations")
    .select(ROW_SELECT)
    .in("id", candidateIds)
    .eq("visibility", "public");

  if (!data?.length) return [];

  const score = (row: { id: string; like_count: number; comment_count: number }) => {
    const v = viewsBySim.get(row.id) ?? 0;
    // Likes count for 3 views, comments for 5 — community engagement is a
    // stronger signal than passive traffic.
    return v + (row.like_count ?? 0) * 3 + (row.comment_count ?? 0) * 5;
  };

  return (data as unknown as (DbSimulationRow & { like_count: number; comment_count: number })[])
    .map((row) => ({ row, score: score(row) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => mapRow(x.row));
}
