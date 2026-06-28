/**
 * One-shot migration: add three DUX4-family simulation entries to the
 * production database. Idempotent — skips rows that already exist by
 * pdb_code (entry 1) or uniprot_id (entries 2 + 3).
 *
 * Usage:
 *   npx tsx scripts/add-dux4-family-entries.ts            # apply
 *   npx tsx scripts/add-dux4-family-entries.ts --dry-run  # plan, no writes
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (loaded
 * from .env.local by Node's --env-file flag below or by your shell).
 *
 * Note on the "public URL" in the spec: the `pdbs` bucket is private
 * (signed-URL reads), so we store the canonical `storage://pdbs/<id>.pdb`
 * pointer that the rest of the codebase recognises — the simulation
 * detail page's mapper signs it on render via maybeSign() in
 * lib/data/simulations.ts. This matches every other user-uploaded
 * structure on the platform.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";

// ──────────────────────────────────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────────────────────────────────

const DRY_RUN = process.argv.includes("--dry-run");
const SEED_TEAM_USER_ID = "00000000-0000-0000-0000-000000000001";
const SITE_BASE = "https://simedo.work";

// ──────────────────────────────────────────────────────────────────────────
// Entry definitions
// ──────────────────────────────────────────────────────────────────────────

type Entry = {
  label: string;
  // Idempotency key — exactly one of these is set per entry.
  matchBy: { pdb_code: string } | { uniprot_id: string };
  sourceUrl: string;
  // Direct mapping to simulations columns. Tags live separately because
  // they need a join-table dance after the simulation row exists.
  row: {
    title: string;
    description: string;
    pdb_code: string | null;
    category: string;
    protein_family: string;
    organism: string;
    experiment_type: string;
    license: string;
    visibility: string;
    has_trajectory: boolean;
    source_doi: string;
    structure_source: string;
    uniprot_id: string | null;
    alphafold_id: string | null;
    prediction_mean_plddt: number | null;
    prediction_pae_url: string | null;
    prediction_pae_max: number | null;
    requested_by: string;
    requested_by_affiliation: string;
    resolution?: number | null;
  };
  tags: string[];
};

const ENTRIES: Entry[] = [
  {
    label: "ENTRY 1 — DUX4 experimental (5ZFZ)",
    matchBy: { pdb_code: "5ZFZ" },
    sourceUrl: "https://files.rcsb.org/download/5ZFZ.pdb",
    row: {
      title: "DUX4 double homeodomains bound to target DNA",
      description:
        "Crystal structure of the human DUX4 transcription factor's tandem homeodomains in complex with a DNA duplex containing the consensus binding motif. Homeodomain 1 recognizes the TAA element via the canonical helix-in-major-groove contact, while homeodomain 2 reads the TGA element. DUX4 is the master regulator of zygotic genome activation in human embryos and is causally implicated in facioscapulohumeral muscular dystrophy (FSHD).",
      pdb_code: "5ZFZ",
      category: "protein",
      protein_family: "Homeodomains",
      organism: "Homo sapiens",
      experiment_type: "binding",
      license: "cc-by",
      visibility: "public",
      has_trajectory: false,
      source_doi: "10.1093/nar/gky522",
      structure_source: "experimental-xray",
      uniprot_id: null,
      alphafold_id: null,
      prediction_mean_plddt: null,
      prediction_pae_url: null,
      prediction_pae_max: null,
      requested_by: "Juha Kere",
      requested_by_affiliation:
        "Karolinska Institutet / Folkhälsan Research Center",
      resolution: null,
    },
    tags: [
      "transcription-factor",
      "homeodomain",
      "DNA-binding",
      "zygotic-genome-activation",
      "FSHD",
      "embryonic-development",
    ],
  },
  {
    label: "ENTRY 2 — LEUTX AlphaFold (A8MZ59)",
    matchBy: { uniprot_id: "A8MZ59" },
    sourceUrl:
      "https://alphafold.ebi.ac.uk/files/AF-A8MZ59-F1-model_v6.pdb",
    row: {
      title: "LEUTX, paired-like homeodomain transcription factor",
      description:
        "Predicted full-length structure of human LEUTX (198 residues), a paired-like homeodomain transcription factor expressed transiently during the first cleavage divisions of the human embryo. LEUTX is part of the embryonic genome activation network and its expression is rapidly silenced after the eight-cell stage.",
      pdb_code: null,
      category: "protein",
      protein_family: "Homeodomains",
      organism: "Homo sapiens",
      experiment_type: "equilibrium",
      license: "cc-by",
      visibility: "public",
      has_trajectory: false,
      source_doi: "10.1038/s41586-021-03819-2",
      structure_source: "alphafold2",
      uniprot_id: "A8MZ59",
      alphafold_id: "AF-A8MZ59-F1-v6",
      prediction_mean_plddt: 67.5,
      prediction_pae_url:
        "https://alphafold.ebi.ac.uk/files/AF-A8MZ59-F1-predicted_aligned_error_v6.json",
      prediction_pae_max: 31.75,
      requested_by: "Juha Kere",
      requested_by_affiliation:
        "Karolinska Institutet / Folkhälsan Research Center",
    },
    tags: [
      "transcription-factor",
      "homeodomain",
      "embryonic-development",
      "zygotic-genome-activation",
      "alphafold-prediction",
    ],
  },
  {
    label: "ENTRY 3 — ZSCAN4 AlphaFold (Q8NAM6)",
    matchBy: { uniprot_id: "Q8NAM6" },
    sourceUrl:
      "https://alphafold.ebi.ac.uk/files/AF-Q8NAM6-F1-model_v6.pdb",
    row: {
      title: "ZSCAN4, zinc finger and SCAN domain-containing protein 4",
      description:
        "Predicted full-length structure of human ZSCAN4 (433 residues), a zinc finger transcription factor with a SCAN dimerization domain and tandem C2H2 zinc finger array. ZSCAN4 is transiently expressed in two-cell-stage embryos and in a small subpopulation of mouse embryonic stem cells, where it has been implicated in telomere maintenance and genome stability during the totipotent state.",
      pdb_code: null,
      category: "protein",
      protein_family: "Zinc finger proteins",
      organism: "Homo sapiens",
      experiment_type: "equilibrium",
      license: "cc-by",
      visibility: "public",
      has_trajectory: false,
      source_doi: "10.1038/s41586-021-03819-2",
      structure_source: "alphafold2",
      uniprot_id: "Q8NAM6",
      alphafold_id: "AF-Q8NAM6-F1-v6",
      prediction_mean_plddt: 50.03,
      prediction_pae_url:
        "https://alphafold.ebi.ac.uk/files/AF-Q8NAM6-F1-predicted_aligned_error_v6.json",
      prediction_pae_max: 31.75,
      requested_by: "Juha Kere",
      requested_by_affiliation:
        "Karolinska Institutet / Folkhälsan Research Center",
    },
    tags: [
      "transcription-factor",
      "zinc-finger",
      "totipotency",
      "embryonic-development",
      "alphafold-prediction",
    ],
  },
];

// ──────────────────────────────────────────────────────────────────────────
// .env.local loader (cheap KEY=VAL parser; avoids adding dotenv as a dep)
// ──────────────────────────────────────────────────────────────────────────

function loadDotEnvLocal(): void {
  const path = resolve(process.cwd(), ".env.local");
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return; // ok if missing — env may be set in the shell
  }
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    // Strip surrounding quotes if present.
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────

function log(msg: string): void {
  console.log(msg);
}

function logStep(stepNum: number, total: number, msg: string): void {
  console.log(`  [${stepNum}/${total}] ${msg}`);
}

async function ensureTeamUser(supabase: SupabaseClient): Promise<string> {
  log("→ Ensuring Simedo Team user exists");
  const { data: existing, error } = await supabase
    .from("users")
    .select("id, display_name, username")
    .eq("id", SEED_TEAM_USER_ID)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw new Error(`users select failed: ${error.message}`);
  }
  if (existing) {
    log(
      `  ✓ found existing team user (id=${existing.id}, username=${existing.username})`,
    );
    return existing.id;
  }

  // Fall back to lookup by username, then create if neither.
  const { data: byUsername } = await supabase
    .from("users")
    .select("id, username")
    .eq("username", "helix-team")
    .maybeSingle();
  if (byUsername) {
    log(
      `  ✓ found team user by username helix-team (id=${byUsername.id}); using it`,
    );
    return byUsername.id;
  }

  if (DRY_RUN) {
    log("  · DRY-RUN: would create team user via auth.admin.createUser");
    return SEED_TEAM_USER_ID;
  }

  log("  · creating team user via auth.admin.createUser");
  const { data: created, error: authErr } =
    await supabase.auth.admin.createUser({
      email: "team@simedo.work",
      password: randomUUID(),
      email_confirm: true,
      user_metadata: {
        username: "helix-team",
        display_name: "Simedo Team",
        is_seed: true,
      },
    });
  if (authErr || !created?.user) {
    throw new Error(
      `auth.admin.createUser failed: ${authErr?.message ?? "no user returned"}`,
    );
  }
  // The handle_new_auth_user trigger creates the public.users row; bump
  // display_name + avatar so the team profile looks right.
  await supabase
    .from("users")
    .update({
      display_name: "Simedo Team",
      bio: "Reference structures curated by the Simedo team.",
      avatar_url:
        "https://api.dicebear.com/9.x/shapes/svg?seed=helix-team&backgroundColor=0a1437&shape1Color=2563eb&shape2Color=60a5fa&shape3Color=93c5fd",
    })
    .eq("id", created.user.id);
  log(`  ✓ created team user (id=${created.user.id})`);
  return created.user.id;
}

async function findExisting(
  supabase: SupabaseClient,
  entry: Entry,
): Promise<{ id: string } | null> {
  const query =
    "pdb_code" in entry.matchBy
      ? supabase
          .from("simulations")
          .select("id")
          .eq("pdb_code", entry.matchBy.pdb_code)
      : supabase
          .from("simulations")
          .select("id")
          .eq("uniprot_id", entry.matchBy.uniprot_id);
  const { data, error } = await query.limit(1).maybeSingle();
  if (error && error.code !== "PGRST116") {
    throw new Error(`existence check failed: ${error.message}`);
  }
  return data ?? null;
}

async function downloadPdb(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`download ${url}: HTTP ${res.status}`);
  }
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

async function uploadPdb(
  supabase: SupabaseClient,
  simId: string,
  bytes: Uint8Array,
): Promise<string> {
  const objectPath = `${simId}.pdb`;
  const { error } = await supabase.storage
    .from("pdbs")
    .upload(objectPath, bytes, {
      contentType: "chemical/x-pdb",
      upsert: true,
    });
  if (error) {
    throw new Error(`storage upload pdbs/${objectPath}: ${error.message}`);
  }
  // storage:// convention — the simulations.ts mapper signs this on read.
  return `storage://pdbs/${objectPath}`;
}

async function attachTags(
  supabase: SupabaseClient,
  simId: string,
  tags: string[],
): Promise<void> {
  if (tags.length === 0) return;

  // Insert any missing tag rows. on conflict (name) do nothing.
  const { error: tagInsertErr } = await supabase
    .from("tags")
    .upsert(
      tags.map((name) => ({ name })),
      { onConflict: "name", ignoreDuplicates: true },
    );
  if (tagInsertErr) {
    throw new Error(`tags upsert: ${tagInsertErr.message}`);
  }

  // Resolve to IDs.
  const { data: tagRows, error: tagFetchErr } = await supabase
    .from("tags")
    .select("id, name")
    .in("name", tags);
  if (tagFetchErr) {
    throw new Error(`tags fetch: ${tagFetchErr.message}`);
  }
  const tagIds = (tagRows ?? []).map((t) => ({
    simulation_id: simId,
    tag_id: (t as { id: number }).id,
  }));
  if (tagIds.length === 0) return;

  const { error: linkErr } = await supabase
    .from("simulation_tags")
    .upsert(tagIds, {
      onConflict: "simulation_id,tag_id",
      ignoreDuplicates: true,
    });
  if (linkErr) {
    throw new Error(`simulation_tags upsert: ${linkErr.message}`);
  }
}

async function insertEntry(
  supabase: SupabaseClient,
  entry: Entry,
  teamUserId: string,
): Promise<{ id: string; pdb_url: string }> {
  const simId = randomUUID();
  log(`  · new simulation id = ${simId}`);

  logStep(1, 4, `downloading ${entry.sourceUrl}`);
  const bytes = await downloadPdb(entry.sourceUrl);
  log(`        downloaded ${bytes.byteLength.toLocaleString()} bytes`);

  if (DRY_RUN) {
    log("        DRY-RUN: skipping storage upload + DB insert");
    return { id: simId, pdb_url: `storage://pdbs/${simId}.pdb` };
  }

  logStep(2, 4, `uploading to Supabase Storage (pdbs/${simId}.pdb)`);
  const pdbUrl = await uploadPdb(supabase, simId, bytes);

  logStep(3, 4, "inserting simulations row");
  const insertPayload = {
    id: simId,
    user_id: teamUserId,
    ...entry.row,
    pdb_url: pdbUrl,
  };
  const { error: insertErr } = await supabase
    .from("simulations")
    .insert(insertPayload);
  if (insertErr) {
    throw new Error(
      `simulations insert: ${insertErr.message} (code=${(insertErr as { code?: string }).code ?? "?"})`,
    );
  }

  logStep(4, 4, `attaching ${entry.tags.length} tags`);
  await attachTags(supabase, simId, entry.tags);

  return { id: simId, pdb_url: pdbUrl };
}

// ──────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  loadDotEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env (or .env.local).",
    );
  }

  log("═══════════════════════════════════════════════════════════════");
  log("  Adding DUX4-family entries to Simedo");
  log(`  Target: ${url}`);
  log(`  Mode:   ${DRY_RUN ? "DRY-RUN (no writes)" : "LIVE"}`);
  log("═══════════════════════════════════════════════════════════════");

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const teamUserId = await ensureTeamUser(supabase);
  log("");

  const results: {
    label: string;
    action: "inserted" | "skipped";
    id: string;
    url: string;
  }[] = [];

  for (const entry of ENTRIES) {
    log(`→ ${entry.label}`);
    const existing = await findExisting(supabase, entry);
    if (existing) {
      log(`  ⊘ SKIP — already exists (id=${existing.id})`);
      results.push({
        label: entry.label,
        action: "skipped",
        id: existing.id,
        url: `${SITE_BASE}/simulation/${existing.id}`,
      });
      log("");
      continue;
    }
    const { id } = await insertEntry(supabase, entry, teamUserId);
    log(`  ✓ INSERTED — id=${id}`);
    results.push({
      label: entry.label,
      action: "inserted",
      id,
      url: `${SITE_BASE}/simulation/${id}`,
    });
    log("");
  }

  log("═══════════════════════════════════════════════════════════════");
  log("  Results");
  log("═══════════════════════════════════════════════════════════════");
  for (const r of results) {
    log(`  ${r.action.toUpperCase().padEnd(8)} ${r.label}`);
    log(`            ${r.url}`);
  }
  log("");
  if (DRY_RUN) {
    log("DRY-RUN complete — no changes were written.");
  } else {
    const inserted = results.filter((r) => r.action === "inserted").length;
    const skipped = results.filter((r) => r.action === "skipped").length;
    log(`Done — ${inserted} inserted, ${skipped} skipped.`);
  }
}

main().catch((err) => {
  console.error("\n✗ FAILED:", err instanceof Error ? err.message : err);
  process.exit(1);
});
