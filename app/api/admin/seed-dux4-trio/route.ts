import { NextResponse, type NextRequest } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// One-shot endpoint to add three DUX4-family simulations to prod
// (5ZFZ experimental, LEUTX AlphaFold, ZSCAN4 AlphaFold). Same
// token gate as /api/admin/reseed and /api/admin/cleanup.
//
// Idempotent: skips entry 1 by pdb_code = '5ZFZ', skips entries 2/3
// by uniprot_id = 'A8MZ59' / 'Q8NAM6'.
//
// Schema-tolerant: probes for the uniprot_id column to decide whether
// migration 20260628000001 has been applied. If it hasn't, inserts
// only the columns that exist on the pre-rename schema (using
// prediction_confidence instead of prediction_mean_plddt and omitting
// uniprot_id / alphafold_id / prediction_pae_max / reviewed_by_affiliation).
// Either way the entries show up on /browse; the AF entries just lose a
// little metadata until the migration runs.
//
// Usage: GET https://www.simedo.work/api/admin/seed-dux4-trio?token=<last-16-of-service-role-key>

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SEED_TEAM_USER_ID = "00000000-0000-0000-0000-000000000001";
const REQUESTED_BY = "Juha Kere";
const REQUESTED_BY_AFFILIATION =
  "Karolinska Institutet / Folkhälsan Research Center";

type EntryRow = {
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
};

type Entry = {
  label: string;
  matchBy: { pdb_code: string } | { uniprot_id: string };
  sourceUrl: string;
  row: EntryRow;
  tags: string[];
};

const ENTRIES: Entry[] = [
  {
    label: "DUX4 experimental (5ZFZ)",
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
      requested_by: REQUESTED_BY,
      requested_by_affiliation: REQUESTED_BY_AFFILIATION,
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
    label: "LEUTX AlphaFold (A8MZ59)",
    matchBy: { uniprot_id: "A8MZ59" },
    sourceUrl: "https://alphafold.ebi.ac.uk/files/AF-A8MZ59-F1-model_v6.pdb",
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
      requested_by: REQUESTED_BY,
      requested_by_affiliation: REQUESTED_BY_AFFILIATION,
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
    label: "ZSCAN4 AlphaFold (Q8NAM6)",
    matchBy: { uniprot_id: "Q8NAM6" },
    sourceUrl: "https://alphafold.ebi.ac.uk/files/AF-Q8NAM6-F1-model_v6.pdb",
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
      requested_by: REQUESTED_BY,
      requested_by_affiliation: REQUESTED_BY_AFFILIATION,
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

function tokenAcceptable(req: NextRequest, serviceKey: string): boolean {
  const supplied =
    req.nextUrl.searchParams.get("token") ??
    req.headers.get("x-admin-token") ??
    "";
  if (!supplied) return false;
  if (supplied === serviceKey) return true;
  if (supplied === serviceKey.slice(-16)) return true;
  if (process.env.RESEED_TOKEN && supplied === process.env.RESEED_TOKEN)
    return true;
  return false;
}

// Probe for the post-rename columns by attempting a 0-row select that
// asks for them. Postgrest fails the query if any requested column is
// missing, so the absence of an error means migration 20260628000001
// has been applied.
async function detectPhase2Schema(supabase: SupabaseClient): Promise<boolean> {
  const { error } = await supabase
    .from("simulations")
    .select("uniprot_id, alphafold_id, prediction_mean_plddt, prediction_pae_max, reviewed_by_affiliation")
    .limit(0);
  return !error;
}

async function ensureTeamUser(supabase: SupabaseClient): Promise<string> {
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("id", SEED_TEAM_USER_ID)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: byUsername } = await supabase
    .from("users")
    .select("id")
    .eq("username", "helix-team")
    .maybeSingle();
  if (byUsername) return byUsername.id;

  const random = crypto.randomUUID();
  const { data: created, error: authErr } =
    await supabase.auth.admin.createUser({
      email: "team@simedo.work",
      password: random,
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
  await supabase
    .from("users")
    .update({
      display_name: "Simedo Team",
      bio: "Reference structures curated by the Simedo team.",
      avatar_url:
        "https://api.dicebear.com/9.x/shapes/svg?seed=helix-team&backgroundColor=0a1437&shape1Color=2563eb&shape2Color=60a5fa&shape3Color=93c5fd",
    })
    .eq("id", created.user.id);
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
  const { data } = await query.limit(1).maybeSingle();
  return data ?? null;
}

async function findExistingPreMigration(
  supabase: SupabaseClient,
  entry: Entry,
): Promise<{ id: string } | null> {
  // Pre-migration schema doesn't have uniprot_id, so AF entries can
  // only be deduped by title (the seeded AF rows from 20260623000002
  // use different titles than ours but are the same protein).
  if ("pdb_code" in entry.matchBy) {
    const { data } = await supabase
      .from("simulations")
      .select("id")
      .eq("pdb_code", entry.matchBy.pdb_code)
      .limit(1)
      .maybeSingle();
    return data ?? null;
  }
  // Match by the AlphaFold model URL — unique per UniProt ID + version.
  const { data } = await supabase
    .from("simulations")
    .select("id")
    .eq("pdb_url", entry.sourceUrl)
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

async function uploadPdb(
  supabase: SupabaseClient,
  simId: string,
  sourceUrl: string,
): Promise<{ pdbUrl: string; bytes: number }> {
  const res = await fetch(sourceUrl);
  if (!res.ok) {
    throw new Error(`download ${sourceUrl}: HTTP ${res.status}`);
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  const objectPath = `${simId}.pdb`;
  const { error } = await supabase.storage
    .from("pdbs")
    .upload(objectPath, buf, {
      contentType: "chemical/x-pdb",
      upsert: true,
    });
  if (error) {
    throw new Error(`storage upload pdbs/${objectPath}: ${error.message}`);
  }
  return { pdbUrl: `storage://pdbs/${objectPath}`, bytes: buf.byteLength };
}

async function attachTags(
  supabase: SupabaseClient,
  simId: string,
  tags: string[],
): Promise<void> {
  if (tags.length === 0) return;
  await supabase
    .from("tags")
    .upsert(
      tags.map((name) => ({ name })),
      { onConflict: "name", ignoreDuplicates: true },
    );
  const { data: tagRows } = await supabase
    .from("tags")
    .select("id, name")
    .in("name", tags);
  const links = (tagRows ?? []).map((t) => ({
    simulation_id: simId,
    tag_id: (t as { id: number }).id,
  }));
  if (links.length === 0) return;
  await supabase
    .from("simulation_tags")
    .upsert(links, {
      onConflict: "simulation_id,tag_id",
      ignoreDuplicates: true,
    });
}

function buildInsertPayload(
  simId: string,
  userId: string,
  pdbUrl: string,
  entry: Entry,
  phase2: boolean,
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    id: simId,
    user_id: userId,
    title: entry.row.title,
    description: entry.row.description,
    pdb_code: entry.row.pdb_code,
    pdb_url: pdbUrl,
    category: entry.row.category,
    protein_family: entry.row.protein_family,
    organism: entry.row.organism,
    experiment_type: entry.row.experiment_type,
    license: entry.row.license,
    visibility: entry.row.visibility,
    has_trajectory: entry.row.has_trajectory,
    source_doi: entry.row.source_doi,
    structure_source: entry.row.structure_source,
    prediction_pae_url: entry.row.prediction_pae_url,
    requested_by: entry.row.requested_by,
    requested_by_affiliation: entry.row.requested_by_affiliation,
  };
  if (phase2) {
    return {
      ...base,
      uniprot_id: entry.row.uniprot_id,
      alphafold_id: entry.row.alphafold_id,
      prediction_mean_plddt: entry.row.prediction_mean_plddt,
      prediction_pae_max: entry.row.prediction_pae_max,
    };
  }
  // Pre-migration: write the score into the old column name.
  return {
    ...base,
    prediction_confidence: entry.row.prediction_mean_plddt,
  };
}

async function seed(req: NextRequest): Promise<NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json(
      { ok: false, error: "Supabase env vars missing." },
      { status: 500 },
    );
  }
  if (!tokenAcceptable(req, serviceKey)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Token missing or wrong. Pass ?token=<SUPABASE_SERVICE_ROLE_KEY> (whole key or last 16 chars).",
      },
      { status: 403 },
    );
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let phase2: boolean;
  try {
    phase2 = await detectPhase2Schema(supabase);
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        stage: "schema-probe",
        error: e instanceof Error ? e.message : String(e),
      },
      { status: 500 },
    );
  }

  let teamUserId: string;
  try {
    teamUserId = await ensureTeamUser(supabase);
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        stage: "team-user",
        error: e instanceof Error ? e.message : String(e),
      },
      { status: 500 },
    );
  }

  const results: {
    label: string;
    action: "inserted" | "skipped";
    id: string;
    url: string;
    bytes?: number;
  }[] = [];

  const origin = req.nextUrl.origin;

  for (const entry of ENTRIES) {
    try {
      const existing = phase2
        ? await findExisting(supabase, entry)
        : await findExistingPreMigration(supabase, entry);
      if (existing) {
        results.push({
          label: entry.label,
          action: "skipped",
          id: existing.id,
          url: `${origin}/simulation/${existing.id}`,
        });
        continue;
      }

      const simId = crypto.randomUUID();
      const { pdbUrl, bytes } = await uploadPdb(
        supabase,
        simId,
        entry.sourceUrl,
      );
      const payload = buildInsertPayload(
        simId,
        teamUserId,
        pdbUrl,
        entry,
        phase2,
      );
      const { error: insertErr } = await supabase
        .from("simulations")
        .insert(payload);
      if (insertErr) {
        return NextResponse.json(
          {
            ok: false,
            stage: "simulations-insert",
            label: entry.label,
            error: insertErr.message,
            code: (insertErr as { code?: string }).code,
            phase2_schema: phase2,
            partial_results: results,
          },
          { status: 500 },
        );
      }
      await attachTags(supabase, simId, entry.tags);
      results.push({
        label: entry.label,
        action: "inserted",
        id: simId,
        url: `${origin}/simulation/${simId}`,
        bytes,
      });
    } catch (e) {
      return NextResponse.json(
        {
          ok: false,
          stage: "entry-loop",
          label: entry.label,
          error: e instanceof Error ? e.message : String(e),
          partial_results: results,
        },
        { status: 500 },
      );
    }
  }

  const { count: totalSims } = await supabase
    .from("simulations")
    .select("id", { count: "exact", head: true });

  return NextResponse.json({
    ok: true,
    phase2_schema: phase2,
    team_user_id: teamUserId,
    sims_in_db_now: totalSims ?? null,
    results,
  });
}

export async function GET(req: NextRequest) {
  return seed(req);
}

export async function POST(req: NextRequest) {
  return seed(req);
}
