// Context bundle: the set of authoritative sources we hand to the model.
//
// Sources (each is best-effort — graceful degradation if any fails):
//   - The simulation row itself (Supabase)
//   - PDB header from RCSB (REST API, no auth)
//   - UniProt entry if the PDB has a mapped chain (REST, no auth)
//   - Crossref abstract if a source DOI is linked (REST, no auth)
//
// Caching: keyed by simulation id. In-memory for this phase. Once Phase 4 is
// live in prod, swap _memCache for the ai_context_cache table.

import type { Simulation } from "@/types";

export type ContextBundle = {
  simulation: {
    id: string;
    title: string;
    description: string;
    pdbCode: string;
    category: string;
    proteinFamily?: string;
    organism?: string;
    experimentType: string;
    forceField?: string;
    waterModel?: string;
    temperatureK?: number;
    ph?: number;
    resolution?: number;
  };
  pdb?: PdbHeader;
  uniprot?: UniProtEntry;
  paper?: CrossrefSummary;
  fetchedAt: string;
};

export type PdbHeader = {
  pdbCode: string;
  title?: string;
  experimentalMethod?: string;
  resolution?: number;
  releaseDate?: string;
  authors?: string[];
};

export type UniProtEntry = {
  accession: string;
  recommendedName?: string;
  organism?: string;
  function?: string;
  catalyticActivity?: string;
  diseases?: string[];
  ptms?: string[];
};

export type CrossrefSummary = {
  doi: string;
  title?: string;
  abstract?: string;
  authors?: string[];
  year?: number;
  journal?: string;
};

// ----------------------------------------------------------------------------
// Two-layer cache:
//   1. In-process Map (avoids redundant DB roundtrips within one request)
//   2. ai_context_cache table in Supabase (durable across restarts)
//
// TTL is 30 days. PDB metadata changes rarely; paper/UniProt facts even less.
// ----------------------------------------------------------------------------
const _memCache = new Map<string, { bundle: ContextBundle; ts: number }>();
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export async function getContextBundle(sim: Simulation): Promise<ContextBundle> {
  const now = Date.now();
  const memHit = _memCache.get(sim.id);
  if (memHit && now - memHit.ts < CACHE_TTL_MS) return memHit.bundle;

  const dbHit = await readBundleFromDb(sim.id);
  if (dbHit && now - new Date(dbHit.fetchedAt).getTime() < CACHE_TTL_MS) {
    _memCache.set(sim.id, { bundle: dbHit, ts: now });
    return dbHit;
  }

  const pdb: PdbHeader | null = sim.pdbCode
    ? await fetchPdbHeader(sim.pdbCode).catch(loggedNull<PdbHeader>("pdb"))
    : null;
  const uniprot: UniProtEntry | null = sim.pdbCode
    ? await fetchUniProtForPdb(sim.pdbCode).catch(loggedNull<UniProtEntry>("uniprot"))
    : null;
  // source_doi isn't in the Simulation type yet — populate when wired in Phase 5.
  const paper: CrossrefSummary | null = null;

  const bundle: ContextBundle = {
    simulation: {
      id: sim.id,
      title: sim.title,
      description: sim.description,
      pdbCode: sim.pdbCode,
      category: sim.category,
      proteinFamily: sim.proteinFamily,
      organism: sim.organism,
      experimentType: sim.experimentType,
      resolution: sim.resolution,
    },
    pdb: pdb ?? undefined,
    uniprot: uniprot ?? undefined,
    paper: paper ?? undefined,
    fetchedAt: new Date().toISOString(),
  };

  _memCache.set(sim.id, { bundle, ts: now });
  void writeBundleToDb(sim.id, bundle);
  return bundle;
}

async function readBundleFromDb(simId: string): Promise<ContextBundle | null> {
  try {
    const { isDbAvailable } = await import("@/lib/data/db-available");
    if (!isDbAvailable()) return null;
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase
      .from("ai_context_cache")
      .select("bundle, refreshed_at")
      .eq("simulation_id", simId)
      .maybeSingle();
    if (!data?.bundle) return null;
    return data.bundle as ContextBundle;
  } catch (e) {
    console.warn("[context-bundle] readBundleFromDb failed", e);
    return null;
  }
}

async function writeBundleToDb(
  simId: string,
  bundle: ContextBundle,
): Promise<void> {
  try {
    const { isDbAvailable } = await import("@/lib/data/db-available");
    if (!isDbAvailable()) return;
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    await supabase.from("ai_context_cache").upsert({
      simulation_id: simId,
      bundle,
      refreshed_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn("[context-bundle] writeBundleToDb failed", e);
  }
}

function loggedNull<T>(source: string): (e: unknown) => T | null {
  return (e) => {
    console.warn(`[context-bundle] ${source} fetch failed`, e);
    return null;
  };
}

// ----------------------------------------------------------------------------
// RCSB — PDB header JSON
// ----------------------------------------------------------------------------
async function fetchPdbHeader(pdbCode: string): Promise<PdbHeader | null> {
  const id = pdbCode.toLowerCase();
  const url = `https://data.rcsb.org/rest/v1/core/entry/${id}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "Simedo/0.1 (simedo.work)" },
    signal: AbortSignal.timeout(4000),
    next: { revalidate: 60 * 60 * 24 * 30 }, // 30 days
  });
  if (!res.ok) return null;
  const json = await res.json();
  return {
    pdbCode: pdbCode.toUpperCase(),
    title: json?.struct?.title,
    experimentalMethod: json?.exptl?.[0]?.method,
    resolution: json?.rcsb_entry_info?.resolution_combined?.[0],
    releaseDate: json?.rcsb_accession_info?.initial_release_date,
    authors: json?.audit_author?.map((a: { name: string }) => a.name).slice(0, 8),
  };
}

// ----------------------------------------------------------------------------
// UniProt — via the SIFTS mappings PDB→UniProt, then a UniProt entry fetch.
// ----------------------------------------------------------------------------
async function fetchUniProtForPdb(pdbCode: string): Promise<UniProtEntry | null> {
  const id = pdbCode.toLowerCase();
  // Step 1: get the UniProt accession from PDBe SIFTS.
  const mapUrl = `https://www.ebi.ac.uk/pdbe/api/mappings/uniprot/${id}`;
  const mapRes = await fetch(mapUrl, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(4000),
    next: { revalidate: 60 * 60 * 24 * 30 },
  });
  if (!mapRes.ok) return null;
  const mapJson = await mapRes.json();
  const accessions = Object.keys(mapJson?.[id]?.UniProt ?? {});
  if (accessions.length === 0) return null;
  const acc = accessions[0]; // primary chain

  // Step 2: fetch the UniProt entry.
  const entryUrl = `https://rest.uniprot.org/uniprotkb/${acc}.json?fields=protein_name,organism_name,cc_function,cc_catalytic_activity,cc_disease,ft_mod_res`;
  const entryRes = await fetch(entryUrl, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(5000),
    next: { revalidate: 60 * 60 * 24 * 30 },
  });
  if (!entryRes.ok) return null;
  const e = await entryRes.json();

  const fnComment = (e?.comments ?? []).find(
    (c: { commentType: string }) => c.commentType === "FUNCTION",
  );
  const catComment = (e?.comments ?? []).find(
    (c: { commentType: string }) => c.commentType === "CATALYTIC ACTIVITY",
  );
  const diseaseComments = (e?.comments ?? []).filter(
    (c: { commentType: string }) => c.commentType === "DISEASE",
  );

  return {
    accession: acc,
    recommendedName: e?.proteinDescription?.recommendedName?.fullName?.value,
    organism: e?.organism?.scientificName,
    function: fnComment?.texts?.[0]?.value,
    catalyticActivity: catComment?.reaction?.name,
    diseases: diseaseComments
      .map((c: { disease?: { diseaseId?: string } }) => c.disease?.diseaseId)
      .filter(Boolean)
      .slice(0, 5),
    ptms: (e?.features ?? [])
      .filter((f: { type: string }) => f.type === "Modified residue")
      .map(
        (f: {
          location: { start: { value: number } };
          description?: string;
        }) => `${f.description ?? "modified"} at ${f.location.start.value}`,
      )
      .slice(0, 5),
  };
}

// ----------------------------------------------------------------------------
// Format the bundle into a string that gets handed to the model.
// ----------------------------------------------------------------------------
export function formatBundleForPrompt(bundle: ContextBundle): string {
  const lines: string[] = [];
  lines.push("## Simulation");
  lines.push(`Title: ${bundle.simulation.title}`);
  lines.push(`PDB code: ${bundle.simulation.pdbCode || "(none)"}`);
  lines.push(`Description: ${bundle.simulation.description || "(none)"}`);
  lines.push(`Category: ${bundle.simulation.category}`);
  if (bundle.simulation.proteinFamily)
    lines.push(`Family: ${bundle.simulation.proteinFamily}`);
  if (bundle.simulation.organism)
    lines.push(`Organism: ${bundle.simulation.organism}`);
  lines.push(`Experiment type: ${bundle.simulation.experimentType}`);
  if (bundle.simulation.resolution !== undefined)
    lines.push(`Resolution: ${bundle.simulation.resolution} Å`);

  if (bundle.pdb) {
    lines.push("");
    lines.push("## PDB header (RCSB)");
    if (bundle.pdb.title) lines.push(`Title: ${bundle.pdb.title}`);
    if (bundle.pdb.experimentalMethod)
      lines.push(`Method: ${bundle.pdb.experimentalMethod}`);
    if (bundle.pdb.resolution !== undefined)
      lines.push(`Resolution: ${bundle.pdb.resolution} Å`);
    if (bundle.pdb.releaseDate)
      lines.push(`Released: ${bundle.pdb.releaseDate}`);
    if (bundle.pdb.authors?.length)
      lines.push(`Authors: ${bundle.pdb.authors.join(", ")}`);
  }

  if (bundle.uniprot) {
    lines.push("");
    lines.push(`## UniProt ${bundle.uniprot.accession}`);
    if (bundle.uniprot.recommendedName)
      lines.push(`Name: ${bundle.uniprot.recommendedName}`);
    if (bundle.uniprot.organism)
      lines.push(`Organism: ${bundle.uniprot.organism}`);
    if (bundle.uniprot.function)
      lines.push(`Function: ${bundle.uniprot.function}`);
    if (bundle.uniprot.catalyticActivity)
      lines.push(`Catalytic activity: ${bundle.uniprot.catalyticActivity}`);
    if (bundle.uniprot.diseases?.length)
      lines.push(`Disease associations: ${bundle.uniprot.diseases.join(", ")}`);
    if (bundle.uniprot.ptms?.length)
      lines.push(`PTMs: ${bundle.uniprot.ptms.join("; ")}`);
  }

  if (bundle.paper) {
    lines.push("");
    lines.push("## Source paper");
    if (bundle.paper.title) lines.push(`Title: ${bundle.paper.title}`);
    if (bundle.paper.authors?.length)
      lines.push(`Authors: ${bundle.paper.authors.join(", ")}`);
    if (bundle.paper.journal && bundle.paper.year)
      lines.push(`Journal: ${bundle.paper.journal} (${bundle.paper.year})`);
    if (bundle.paper.abstract)
      lines.push(`Abstract: ${bundle.paper.abstract}`);
  }

  return lines.join("\n");
}

export function bundleSources(bundle: ContextBundle): {
  label: string;
  url: string;
}[] {
  const out: { label: string; url: string }[] = [];
  if (bundle.simulation.pdbCode) {
    out.push({
      label: `RCSB PDB ${bundle.simulation.pdbCode}`,
      url: `https://www.rcsb.org/structure/${bundle.simulation.pdbCode}`,
    });
  }
  if (bundle.uniprot) {
    out.push({
      label: `UniProt ${bundle.uniprot.accession}`,
      url: `https://www.uniprot.org/uniprotkb/${bundle.uniprot.accession}`,
    });
  }
  if (bundle.paper?.doi) {
    out.push({
      label: `DOI ${bundle.paper.doi}`,
      url: `https://doi.org/${bundle.paper.doi}`,
    });
  }
  return out;
}
