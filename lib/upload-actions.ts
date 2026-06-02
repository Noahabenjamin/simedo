"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isDbAvailable } from "@/lib/data/db-available";

// Maps the upload form's category choices to the simulation_category enum.
// "other" gets parked under "protein" because the enum doesn't have a
// catch-all; expand the enum if a real "other" bucket is needed.
const CATEGORY_MAP: Record<string, string> = {
  protein: "protein",
  nucleic: "dna",
  ligand: "drug-complex",
  membrane: "membrane",
  small: "drug-complex",
  other: "protein",
};

type CreateInput = {
  title: string;
  description: string;
  category: string;
  tags: string[];
  license: string;
  visibility: "public" | "unlisted" | "private";
  pdbCode: string | null;
  trajectoryStoragePath: string | null;
  trajectorySizeBytes: number | null;
  topologyStoragePath: string | null;
};

const LICENSE_MAP: Record<string, string> = {
  "cc-by-4": "cc-by",
  cc0: "cc0",
  "cc-by-nc": "all-rights-reserved",
  custom: "all-rights-reserved",
};

export async function createSimulationFromUpload(
  input: CreateInput,
): Promise<{ id: string } | { error: string }> {
  if (!isDbAvailable()) {
    return { error: "Database is not configured." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?redirect=/upload");
  }

  const category = CATEGORY_MAP[input.category] ?? "protein";
  const license = LICENSE_MAP[input.license] ?? "cc-by";

  // Resolve trajectory_url to a Storage path; the simulation page later
  // turns this into a signed download URL on demand.
  const pdbUrl =
    input.pdbCode && /^[a-z0-9]{4}$/i.test(input.pdbCode)
      ? `https://files.rcsb.org/download/${input.pdbCode.toUpperCase()}.pdb`
      : input.topologyStoragePath
        ? `storage://helix-topologies/${input.topologyStoragePath}`
        : "";

  if (!pdbUrl) {
    return {
      error:
        "Either a PDB code or a topology file (PDB, CIF) is required so the viewer has a structure to render.",
    };
  }

  const hasTrajectory = !!input.trajectoryStoragePath;

  const { data, error } = await supabase
    .from("simulations")
    .insert({
      user_id: user!.id,
      title: input.title.slice(0, 200),
      description: input.description.slice(0, 5000),
      pdb_code: input.pdbCode ? input.pdbCode.toUpperCase() : null,
      pdb_url: pdbUrl,
      trajectory_url: input.trajectoryStoragePath
        ? `storage://helix-trajectories/${input.trajectoryStoragePath}`
        : null,
      trajectory_size_mb: input.trajectorySizeBytes
        ? +(input.trajectorySizeBytes / (1024 * 1024)).toFixed(2)
        : null,
      has_trajectory: hasTrajectory,
      category,
      license,
      visibility: input.visibility,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[upload] insert failed", error);
    return { error: error?.message ?? "Insert failed." };
  }

  // Tags: insert any new ones and link them.
  if (input.tags.length > 0) {
    const cleaned = input.tags
      .map((t) => t.trim().toLowerCase())
      .filter((t) => /^[a-z0-9_-]{1,40}$/.test(t))
      .slice(0, 12);
    if (cleaned.length > 0) {
      const tagRows = cleaned.map((name) => ({ name }));
      await supabase.from("tags").upsert(tagRows, { onConflict: "name" });
      const { data: tagIds } = await supabase
        .from("tags")
        .select("id, name")
        .in("name", cleaned);
      if (tagIds?.length) {
        await supabase.from("simulation_tags").insert(
          tagIds.map((t: { id: string }) => ({
            simulation_id: data.id,
            tag_id: t.id,
          })),
        );
      }
    }
  }

  revalidatePath("/browse");
  return { id: data.id };
}
