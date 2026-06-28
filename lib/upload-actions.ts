"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isDbAvailable } from "@/lib/data/db-available";
import {
  getPresignedUploadUrl,
  getR2Config,
  isR2Configured,
} from "@/lib/r2";
import {
  checkUploadRateLimit,
  recordUpload,
} from "@/lib/upload/rate-limit";

// Server actions for the upload pipeline.
//
//   reserveSimulation   — Zod-validate the form, create a row in
//                          processing_status='pending', return its id + the
//                          presigned R2 URL the client should PUT the
//                          trajectory to. Also returns the PDB upload
//                          target (Supabase Storage pdbs/{id}.pdb).
//   finalizeTrajectory  — client signals "I'm done uploading"; we fill in
//                          the raw_trajectory_url + size, mark status
//                          'processing', and fire-and-forget the Python
//                          compression endpoint.
//
// Both gate on database + R2 availability and on academic verification.

const CATEGORY_MAP: Record<string, string> = {
  protein: "protein",
  dna: "dna",
  rna: "rna",
  membrane: "membrane",
  "drug-complex": "drug-complex",
  enzyme: "enzyme",
  antibody: "antibody",
  receptor: "receptor",
};

const EXPERIMENT_MAP: Record<string, string> = {
  equilibrium: "equilibrium",
  steered: "steered",
  "free-energy": "free-energy",
  binding: "binding",
  folding: "folding",
};

const LICENSE_MAP: Record<string, string> = {
  "cc-by": "cc-by",
  "cc-by-sa": "cc-by-sa",
  cc0: "cc0",
  "all-rights-reserved": "all-rights-reserved",
};

const STRUCTURE_SOURCES = [
  "experimental-xray",
  "experimental-nmr",
  "experimental-cryoem",
  "alphafold2",
  "alphafold-multimer",
  "alphafold3",
  "rosetta",
  "other-prediction",
] as const;

function isPredictionSource(s: string): boolean {
  return (
    s.startsWith("alphafold") || s === "rosetta" || s === "other-prediction"
  );
}

const ReserveSchema = z
  .object({
    title: z.string().trim().min(3).max(200),
    description: z.string().trim().max(2000).default(""),
    pdb_code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9]{4}$/)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    category: z.string().refine((v) => v in CATEGORY_MAP),
    experiment_type: z.string().refine((v) => v in EXPERIMENT_MAP),
    // Provenance
    software: z.string().trim().min(1).max(80),
    software_version: z.string().trim().max(40).optional().default(""),
    force_field_full: z.string().trim().max(120).optional().default(""),
    water_model: z.string().trim().max(40).optional().default(""),
    temperature_k: z.coerce.number().positive().max(2000).optional(),
    pressure_bar: z.coerce.number().positive().max(10_000).optional(),
    ph: z.coerce.number().min(0).max(14).optional(),
    ionic_strength_mm: z.coerce.number().min(0).max(10_000).optional(),
    length_ns: z.coerce.number().min(0).max(1_000_000).optional(),
    simulation_lab: z.string().trim().min(1).max(120),
    simulation_institution: z.string().trim().min(1).max(150),
    corresponding_author: z.string().trim().min(1).max(120),
    corresponding_author_email: z.string().trim().email().max(160),
    data_origin: z.enum([
      "original",
      "reupload_with_permission",
      "public_repository",
    ]),
    original_source_url: z.string().trim().url().max(500).optional(),
    source_doi: z
      .string()
      .trim()
      .regex(/^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    license: z.string().refine((v) => v in LICENSE_MAP),
    visibility: z.enum(["public", "unlisted", "private"]),
    // File metadata so the server can pre-pick a Storage path.
    trajectory_filename: z.string().trim().max(255).optional(),
    trajectory_size_bytes: z.coerce.number().int().min(0).optional(),
    // Structure provenance — experimental sources keep the prediction
    // fields collapsed; the client hides the form fields, and the server
    // ignores them on insert. The .optional()s here are required because
    // empty strings are coerced to undefined upstream.
    structure_source: z.enum(STRUCTURE_SOURCES).default("experimental-xray"),
    uniprot_id: z
      .string()
      .trim()
      .toUpperCase()
      .max(20)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    alphafold_id: z
      .string()
      .trim()
      .max(40)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    prediction_mean_plddt: z.coerce.number().min(0).max(100).optional(),
    prediction_pae_url: z
      .string()
      .trim()
      .url()
      .max(500)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    prediction_pae_max: z.coerce.number().min(0).max(100).optional(),
    requested_by: z.string().trim().max(120).optional().default(""),
    requested_by_affiliation: z.string().trim().max(150).optional().default(""),
    scientifically_reviewed_by: z
      .string()
      .trim()
      .max(120)
      .optional()
      .default(""),
    reviewed_by_affiliation: z.string().trim().max(150).optional().default(""),
  })
  .refine(
    (v) =>
      v.data_origin === "original" ? true : !!v.original_source_url,
    {
      path: ["original_source_url"],
      message: "An original source URL or DOI is required for reuploads.",
    },
  );

const TRAJECTORY_MAX_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB raw

type ReserveSuccess = {
  ok: true;
  simulationId: string;
  pdbUploadPath: string;
  trajectoryPresign: { url: string; key: string } | null;
};
type ReserveFailure = { ok: false; error: string };

export async function reserveSimulation(
  raw: FormData,
): Promise<ReserveSuccess | ReserveFailure> {
  if (!isDbAvailable()) {
    return { ok: false, error: "Database is not configured." };
  }

  // Zod parse from FormData.
  const obj: Record<string, FormDataEntryValue | undefined> = {};
  raw.forEach((value, key) => {
    if (obj[key] === undefined) obj[key] = value;
  });

  const parsed = ReserveSchema.safeParse(obj);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false,
      error:
        first?.message ??
        "Some required fields are missing or malformed.",
    };
  }
  const v = parsed.data;

  // Trajectory size cap before we hand out a presigned URL.
  if (
    typeof v.trajectory_size_bytes === "number" &&
    v.trajectory_size_bytes > TRAJECTORY_MAX_BYTES
  ) {
    return {
      ok: false,
      error: "Trajectory exceeds the 2 GB raw-upload cap.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?redirect=/upload");

  // Verification check — the proxy already redirects, but defense in depth.
  const { data: profile } = await supabase
    .from("users")
    .select("verification_level")
    .eq("id", user!.id)
    .maybeSingle();
  if (
    !profile ||
    !profile.verification_level ||
    profile.verification_level === "none"
  ) {
    return { ok: false, error: "Your account isn't verified yet." };
  }

  // Rate limit.
  const limit = checkUploadRateLimit(user!.id);
  if (!limit.ok) {
    return { ok: false, error: limit.reason };
  }

  // Generate the row up front so we can name files with the simulation id.
  const simulationId = crypto.randomUUID();

  // Resolve pdb_url. Either RCSB (if pdb_code set) or our Storage path.
  const pdbStoragePath = `pdbs/${simulationId}.pdb`;
  const pdbUrl = v.pdb_code
    ? `https://files.rcsb.org/download/${v.pdb_code}.pdb`
    : `storage://pdbs/${pdbStoragePath}`;

  // Insert the row in processing_status='pending'. Trajectory pointers
  // will be filled in by finalizeTrajectory after the PUT completes.
  const insert = {
    id: simulationId,
    user_id: user!.id,
    title: v.title,
    description: v.description ?? "",
    pdb_code: v.pdb_code ?? null,
    pdb_url: pdbUrl,
    category: CATEGORY_MAP[v.category],
    experiment_type: EXPERIMENT_MAP[v.experiment_type],
    license: LICENSE_MAP[v.license],
    visibility: v.visibility,
    software: v.software,
    software_version: v.software_version || null,
    force_field_full: v.force_field_full || null,
    water_model: v.water_model || null,
    temperature_k: v.temperature_k ?? null,
    pressure_bar: v.pressure_bar ?? null,
    ph: v.ph ?? null,
    ionic_strength_mm: v.ionic_strength_mm ?? null,
    trajectory_duration_ns: v.length_ns ?? null,
    simulation_lab: v.simulation_lab,
    simulation_institution: v.simulation_institution,
    corresponding_author: v.corresponding_author,
    corresponding_author_email: v.corresponding_author_email,
    data_origin: v.data_origin,
    original_source_url: v.original_source_url ?? null,
    source_doi: v.source_doi ?? null,
    has_trajectory: !!v.trajectory_filename,
    processing_status: v.trajectory_filename ? "pending" : "ready",
    structure_source: v.structure_source,
    // Prediction-only fields: only persist when the source is actually
    // a prediction, so an experimental upload doesn't accidentally
    // store stale draft values from a UI section the user never saw.
    uniprot_id: isPredictionSource(v.structure_source)
      ? (v.uniprot_id ?? null)
      : null,
    alphafold_id: isPredictionSource(v.structure_source)
      ? (v.alphafold_id ?? null)
      : null,
    prediction_mean_plddt: isPredictionSource(v.structure_source)
      ? (v.prediction_mean_plddt ?? null)
      : null,
    prediction_pae_url: isPredictionSource(v.structure_source)
      ? (v.prediction_pae_url ?? null)
      : null,
    prediction_pae_max: isPredictionSource(v.structure_source)
      ? (v.prediction_pae_max ?? null)
      : null,
    requested_by: isPredictionSource(v.structure_source)
      ? (v.requested_by || null)
      : null,
    requested_by_affiliation: isPredictionSource(v.structure_source)
      ? (v.requested_by_affiliation || null)
      : null,
    scientifically_reviewed_by: isPredictionSource(v.structure_source)
      ? (v.scientifically_reviewed_by || null)
      : null,
    reviewed_by_affiliation: isPredictionSource(v.structure_source)
      ? (v.reviewed_by_affiliation || null)
      : null,
  };

  const { error: insertErr } = await supabase
    .from("simulations")
    .insert(insert);
  if (insertErr) {
    console.error("[upload] insert failed", insertErr);
    return {
      ok: false,
      error: `Could not create simulation: ${insertErr.message}`,
    };
  }

  // R2 presigned URL for the trajectory (optional — structure-only uploads
  // are valid).
  let trajectoryPresign: ReserveSuccess["trajectoryPresign"] = null;
  if (v.trajectory_filename) {
    if (!isR2Configured()) {
      return {
        ok: false,
        error:
          "Trajectory storage is not configured (R2 env vars missing). Set R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_PUBLIC_URL.",
      };
    }
    const safeName = sanitizeFilename(v.trajectory_filename);
    const key = `trajectories/${simulationId}/raw/${safeName}`;
    const presigned = await getPresignedUploadUrl(
      key,
      "application/octet-stream",
    );
    if (!presigned) {
      return {
        ok: false,
        error: "Could not generate a trajectory upload URL.",
      };
    }
    trajectoryPresign = presigned;
  }

  recordUpload(user!.id);

  return {
    ok: true,
    simulationId,
    pdbUploadPath: pdbStoragePath,
    trajectoryPresign,
  };
}

type FinalizeInput = {
  simulationId: string;
  trajectoryKey: string | null;
  trajectorySizeBytes: number | null;
};

export async function finalizeTrajectory(
  input: FinalizeInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isDbAvailable())
    return { ok: false, error: "Database is not configured." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  // Only the uploader can finalize.
  const { data: sim } = await supabase
    .from("simulations")
    .select("id, user_id, pdb_url")
    .eq("id", input.simulationId)
    .maybeSingle();
  if (!sim) return { ok: false, error: "Simulation not found." };
  if (sim.user_id !== user.id) return { ok: false, error: "Not your simulation." };

  // No trajectory → just mark ready.
  if (!input.trajectoryKey) {
    await supabase
      .from("simulations")
      .update({ processing_status: "ready" })
      .eq("id", input.simulationId);
    revalidatePath("/browse");
    revalidatePath(`/simulation/${input.simulationId}`);
    return { ok: true };
  }

  const cfg = getR2Config();
  // Prefer the public URL (cheap, browser-fetchable). When R2 isn't
  // configured we couldn't have generated a presigned PUT in the first
  // place, so this branch shouldn't fire — but if it does, store the
  // r2://<bucket>/<key> form so the resolver can sign on read.
  const rawUrl = cfg
    ? `${cfg.publicUrl.replace(/\/+$/, "")}/${input.trajectoryKey}`
    : `r2://helix-trajectories/${input.trajectoryKey}`;

  await supabase
    .from("simulations")
    .update({
      raw_trajectory_url: rawUrl,
      raw_trajectory_size_mb:
        input.trajectorySizeBytes !== null
          ? +(input.trajectorySizeBytes / (1024 * 1024)).toFixed(2)
          : null,
      has_trajectory: true,
      processing_status: "processing",
    })
    .eq("id", input.simulationId);

  // Fire-and-forget the Python compressor. We don't await; the page will
  // show the "processing" state and refresh once the row flips to 'ready'.
  void triggerCompression(input.simulationId, input.trajectoryKey, sim.pdb_url);

  revalidatePath(`/simulation/${input.simulationId}`);
  return { ok: true };
}

async function triggerCompression(
  simulationId: string,
  trajectoryKey: string,
  structureUrl: string,
): Promise<void> {
  try {
    const rh = await headers();
    const origin =
      rh.get("origin") ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000";
    await fetch(`${origin}/api/python/compress-trajectory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        simulation_id: simulationId,
        r2_key: trajectoryKey,
        structure_url: structureUrl,
      }),
      // Don't block the user-facing action on the compressor's response.
      // The Python function updates the row itself when done.
      signal: AbortSignal.timeout(5000),
    }).catch(() => {});
  } catch {
    // Compression is best-effort here; the viewer falls back to streaming
    // the raw file when compressed_trajectory_url is missing.
  }
}

function sanitizeFilename(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .slice(0, 200);
}
