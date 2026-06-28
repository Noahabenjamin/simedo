"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  Check,
  FileUp,
  Globe,
  Loader2,
  Lock,
  Tag,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { reserveSimulation, finalizeTrajectory } from "@/lib/upload-actions";
import { sniffFile } from "@/lib/upload/magic-bytes";

// Single-page upload form. The two heavy moves happen client-side after
// the server action returns:
//   1. PUT the PDB file directly into Supabase Storage (small enough).
//   2. PUT the trajectory directly into R2 via the presigned URL the
//      server hands back (skips Vercel's 4.5 MB body limit).
// Then we call finalizeTrajectory so the row flips to 'processing' and
// the Python compression endpoint takes over.

type Defaults = {
  email: string;
  institution: string;
  displayName: string;
};

const CATEGORY_OPTIONS = [
  { value: "protein", label: "Protein" },
  { value: "dna", label: "DNA" },
  { value: "rna", label: "RNA" },
  { value: "membrane", label: "Membrane / lipid" },
  { value: "drug-complex", label: "Drug complex" },
  { value: "enzyme", label: "Enzyme" },
  { value: "antibody", label: "Antibody" },
  { value: "receptor", label: "Receptor" },
] as const;

const EXPERIMENT_OPTIONS = [
  { value: "equilibrium", label: "Equilibrium" },
  { value: "steered", label: "Steered MD" },
  { value: "free-energy", label: "Free energy" },
  { value: "binding", label: "Binding" },
  { value: "folding", label: "Folding" },
] as const;

const STRUCTURE_SOURCE_OPTIONS = [
  { value: "experimental-xray", label: "Experimental — X-ray" },
  { value: "experimental-nmr", label: "Experimental — NMR" },
  { value: "experimental-cryoem", label: "Experimental — cryo-EM" },
  { value: "alphafold2", label: "AlphaFold 2 prediction" },
  { value: "alphafold-multimer", label: "AlphaFold Multimer prediction" },
  { value: "alphafold3", label: "AlphaFold 3 prediction" },
  { value: "rosetta", label: "Rosetta prediction" },
  { value: "other-prediction", label: "Other computational prediction" },
] as const;

type StructureSourceValue = (typeof STRUCTURE_SOURCE_OPTIONS)[number]["value"];

function isPredictionSource(s: StructureSourceValue): boolean {
  return (
    s.startsWith("alphafold") || s === "rosetta" || s === "other-prediction"
  );
}

const SOFTWARE_OPTIONS = [
  "GROMACS",
  "AMBER",
  "NAMD",
  "OpenMM",
  "CHARMM",
  "Desmond",
  "LAMMPS",
  "Other",
];

const LICENSES = [
  { id: "cc-by", label: "CC BY 4.0", hint: "Reuse with attribution" },
  { id: "cc-by-sa", label: "CC BY-SA 4.0", hint: "Share-alike" },
  { id: "cc0", label: "CC0", hint: "Public domain" },
  {
    id: "all-rights-reserved",
    label: "All rights reserved",
    hint: "Read-only on Simedo",
  },
] as const;

const TRAJECTORY_EXTS = [".xtc", ".dcd", ".trr", ".nc", ".pdb"];
const TOPOLOGY_EXTS = [".pdb", ".cif", ".gro", ".psf"];

const TRAJECTORY_MAX_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB raw
const PDB_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const DRAFT_KEY = "simedo-upload-draft-v2";

type Draft = {
  title: string;
  description: string;
  pdb_code: string;
  category: (typeof CATEGORY_OPTIONS)[number]["value"];
  experiment_type: (typeof EXPERIMENT_OPTIONS)[number]["value"];
  software: string;
  software_version: string;
  force_field_full: string;
  water_model: string;
  temperature_k: string;
  pressure_bar: string;
  ph: string;
  ionic_strength_mm: string;
  length_ns: string;
  simulation_lab: string;
  simulation_institution: string;
  corresponding_author: string;
  corresponding_author_email: string;
  data_origin: "original" | "reupload_with_permission" | "public_repository";
  original_source_url: string;
  source_doi: string;
  license: string;
  visibility: "public" | "unlisted" | "private";
  // Structure provenance — experimental by default. The prediction-only
  // fields below are ignored on submit unless structure_source is a
  // predicted source.
  structure_source: StructureSourceValue;
  uniprot_id: string;
  alphafold_id: string;
  prediction_mean_plddt: string;
  prediction_pae_url: string;
  prediction_pae_max: string;
  requested_by: string;
  requested_by_affiliation: string;
  scientifically_reviewed_by: string;
  reviewed_by_affiliation: string;
};

function emptyDraft(d: Defaults): Draft {
  return {
    title: "",
    description: "",
    pdb_code: "",
    category: "protein",
    experiment_type: "equilibrium",
    software: "GROMACS",
    software_version: "",
    force_field_full: "",
    water_model: "",
    temperature_k: "",
    pressure_bar: "",
    ph: "",
    ionic_strength_mm: "",
    length_ns: "",
    simulation_lab: "",
    simulation_institution: d.institution,
    corresponding_author: d.displayName,
    corresponding_author_email: d.email,
    data_origin: "original",
    original_source_url: "",
    source_doi: "",
    license: "cc-by",
    visibility: "public",
    structure_source: "experimental-xray",
    uniprot_id: "",
    alphafold_id: "",
    prediction_mean_plddt: "",
    prediction_pae_url: "",
    prediction_pae_max: "",
    requested_by: "",
    requested_by_affiliation: "",
    scientifically_reviewed_by: "",
    reviewed_by_affiliation: "",
  };
}

function fileExt(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

type Props = {
  defaults: Defaults;
};

export function UploadForm({ defaults }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(defaults));
  const [topologyFile, setTopologyFile] = useState<File | null>(null);
  const [trajectoryFile, setTrajectoryFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<{
    label: string;
    uploaded: number;
    total: number;
    bps: number;
  } | null>(null);
  const hydratedRef = useRef(false);

  // Hydrate from sessionStorage so a failed upload doesn't lose progress.
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Draft>;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDraft((d) => ({ ...d, ...parsed }));
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* quota / private mode — best effort */
    }
  }, [draft]);

  const set = useCallback(
    <K extends keyof Draft>(key: K, value: Draft[K]) =>
      setDraft((d) => ({ ...d, [key]: value })),
    [],
  );

  const trajectoryWarn = (() => {
    if (!trajectoryFile) return null;
    if (!TRAJECTORY_EXTS.includes(fileExt(trajectoryFile.name)))
      return `Unsupported extension ${fileExt(trajectoryFile.name)}`;
    if (trajectoryFile.size > TRAJECTORY_MAX_BYTES)
      return `${humanSize(trajectoryFile.size)} exceeds the 2 GB cap`;
    return null;
  })();

  const topologyWarn = (() => {
    if (!topologyFile) return null;
    if (!TOPOLOGY_EXTS.includes(fileExt(topologyFile.name)))
      return `Unsupported extension ${fileExt(topologyFile.name)}`;
    if (topologyFile.size > PDB_MAX_BYTES)
      return `${humanSize(topologyFile.size)} exceeds the 10 MB cap`;
    return null;
  })();

  const hasStructure =
    /^[a-z0-9]{4}$/i.test(draft.pdb_code.trim()) || !!topologyFile;
  const reuploadRequiresUrl =
    draft.data_origin === "original" || !!draft.original_source_url.trim();
  const formValid =
    hasStructure &&
    !trajectoryWarn &&
    !topologyWarn &&
    draft.title.trim().length >= 3 &&
    draft.simulation_lab.trim().length > 0 &&
    draft.simulation_institution.trim().length > 0 &&
    draft.corresponding_author.trim().length > 0 &&
    /\S+@\S+\.\S+/.test(draft.corresponding_author_email) &&
    reuploadRequiresUrl;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formValid || submitting) return;
      setSubmitting(true);
      setProgress(null);

      const sb = getBrowserSupabase();
      if (!sb) {
        toast.error("Upload backend not configured");
        setSubmitting(false);
        return;
      }

      try {
        // Magic-byte sniff up front so we never burn an R2 PUT on garbage.
        if (topologyFile) {
          const sniff = await sniffFile(topologyFile, "structure");
          if (sniff.verdict === "wrong-format") {
            toast.error("Topology file looks wrong", {
              description: sniff.reason,
            });
            setSubmitting(false);
            return;
          }
        }
        if (trajectoryFile) {
          const sniff = await sniffFile(trajectoryFile, "trajectory");
          if (sniff.verdict === "wrong-format") {
            toast.error("Trajectory file looks wrong", {
              description: sniff.reason,
            });
            setSubmitting(false);
            return;
          }
        }

        // Build the FormData for the reserveSimulation action.
        const fd = new FormData();
        for (const [k, v] of Object.entries(draft)) {
          if (v != null) fd.set(k, String(v));
        }
        if (trajectoryFile) {
          fd.set("trajectory_filename", trajectoryFile.name);
          fd.set("trajectory_size_bytes", String(trajectoryFile.size));
        }

        const reserved = await reserveSimulation(fd);
        if (!reserved.ok) {
          toast.error("Couldn't reserve simulation", {
            description: reserved.error,
          });
          setSubmitting(false);
          return;
        }

        // Topology → Supabase Storage (10 MB cap, well under Vercel's
        // 4.5 MB body limit if proxied, but we go direct anyway).
        if (topologyFile) {
          setProgress({
            label: "Uploading structure",
            uploaded: 0,
            total: topologyFile.size,
            bps: 0,
          });
          const { error } = await sb.storage
            .from("pdbs")
            .upload(`${reserved.simulationId}.pdb`, topologyFile, {
              contentType: "chemical/x-pdb",
              upsert: false,
            });
          if (error) throw new Error(`Topology upload: ${error.message}`);
          setProgress({
            label: "Uploading structure",
            uploaded: topologyFile.size,
            total: topologyFile.size,
            bps: 0,
          });
        }

        // Trajectory → R2 via presigned PUT, with progress + speed.
        if (trajectoryFile && reserved.trajectoryPresign) {
          await putWithProgress(
            reserved.trajectoryPresign.url,
            trajectoryFile,
            (uploaded, total, bps) => {
              setProgress({
                label: "Uploading trajectory",
                uploaded,
                total,
                bps,
              });
            },
          );
        }

        // Tell the server the bytes are in place.
        const finalRes = await finalizeTrajectory({
          simulationId: reserved.simulationId,
          trajectoryKey: reserved.trajectoryPresign?.key ?? null,
          trajectorySizeBytes: trajectoryFile?.size ?? null,
        });
        if (!finalRes.ok) {
          toast.error("Couldn't finalize", {
            description: finalRes.error,
          });
          setSubmitting(false);
          return;
        }

        try {
          sessionStorage.removeItem(DRAFT_KEY);
        } catch {
          /* ignore */
        }
        toast.success("Simulation published");
        router.push(`/simulation/${reserved.simulationId}`);
      } catch (err) {
        toast.error("Upload failed", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        setSubmitting(false);
        setProgress(null);
      }
    },
    [draft, formValid, submitting, topologyFile, trajectoryFile, router],
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-10">
      <Section
        title="Basic info"
        hint="Title + a short description so people can find it."
      >
        <div className="flex flex-col gap-4">
          <Label label="Title" required>
            <Input
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
              maxLength={200}
              placeholder="e.g. β2 adrenergic receptor 1 μs at 310 K"
              required
              className="h-11"
            />
          </Label>
          <Label
            label="PDB code"
            hint="Optional. If filled, we'll fetch the structure from RCSB automatically."
          >
            <Input
              value={draft.pdb_code}
              onChange={(e) => set("pdb_code", e.target.value.trim())}
              maxLength={4}
              className="h-11 font-mono uppercase"
              placeholder="3SN6"
            />
          </Label>
          <Label
            label="Description"
            hint="Markdown supported. What's interesting about this sim?"
          >
            <Textarea
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Force field, conditions, what the trajectory shows…"
              className="resize-y"
            />
          </Label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Label label="Category" required>
              <Select
                value={draft.category}
                onChange={(v) =>
                  set("category", v as Draft["category"])
                }
                options={CATEGORY_OPTIONS}
              />
            </Label>
            <Label label="Experiment type" required>
              <Select
                value={draft.experiment_type}
                onChange={(v) =>
                  set("experiment_type", v as Draft["experiment_type"])
                }
                options={EXPERIMENT_OPTIONS}
              />
            </Label>
          </div>
        </div>
      </Section>

      <Section title="Files">
        <div className="flex flex-col gap-4">
          <FileDrop
            label="Structure (.pdb or .cif)"
            sublabel={`Up to 10 MB · ${TOPOLOGY_EXTS.join(" · ")}`}
            accept={TOPOLOGY_EXTS}
            file={topologyFile}
            onFile={setTopologyFile}
            warn={topologyWarn}
            optional={!!draft.pdb_code.trim()}
            optionalHint="Optional when a PDB code is set."
          />
          <FileDrop
            label="Trajectory"
            sublabel={`Up to 2 GB · ${TRAJECTORY_EXTS.join(" · ")} · streams directly to R2`}
            accept={TRAJECTORY_EXTS}
            file={trajectoryFile}
            onFile={setTrajectoryFile}
            warn={trajectoryWarn}
            optional
            optionalHint="Optional. Without a trajectory, the page renders the static structure."
          />
        </div>
      </Section>

      <Section
        title="Structure source"
        hint="Experimental or computational. Predicted structures get a badge + pLDDT + PAE plot on the detail page."
      >
        <div className="flex flex-col gap-4">
          <Label label="Source" required>
            <Select
              value={draft.structure_source}
              onChange={(v) =>
                set("structure_source", v as StructureSourceValue)
              }
              options={STRUCTURE_SOURCE_OPTIONS}
            />
          </Label>

          {isPredictionSource(draft.structure_source) && (
            <div className="flex flex-col gap-4 rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">
                Prediction metadata. The pLDDT score drives the confidence
                badge and the per-residue viewer coloring. The PAE URL
                drives the heatmap below the viewer.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Label
                  label="UniProt ID"
                  hint="e.g. Q9UBX2 — the source protein accession."
                >
                  <Input
                    value={draft.uniprot_id}
                    onChange={(e) =>
                      set("uniprot_id", e.target.value.trim().toUpperCase())
                    }
                    placeholder="Q9UBX2"
                    maxLength={20}
                    className="h-11 font-mono"
                  />
                </Label>
                <Label
                  label="AlphaFold ID"
                  hint="e.g. AF-Q9UBX2-F1-v6 — pin the exact AF model."
                >
                  <Input
                    value={draft.alphafold_id}
                    onChange={(e) => set("alphafold_id", e.target.value.trim())}
                    placeholder="AF-Q9UBX2-F1-v6"
                    maxLength={40}
                    className="h-11 font-mono"
                  />
                </Label>
                <Label
                  label="Mean pLDDT"
                  hint="0-100. Above 90 is very high; below 50 is very low."
                >
                  <Input
                    type="number"
                    step="any"
                    min={0}
                    max={100}
                    value={draft.prediction_mean_plddt}
                    onChange={(e) =>
                      set("prediction_mean_plddt", e.target.value)
                    }
                    placeholder="61.4"
                    className="h-11"
                  />
                </Label>
                <Label
                  label="PAE max (Å)"
                  hint="AlphaFold DB caps at 31.75. Leave blank to auto-detect."
                >
                  <Input
                    type="number"
                    step="any"
                    min={0}
                    value={draft.prediction_pae_max}
                    onChange={(e) =>
                      set("prediction_pae_max", e.target.value)
                    }
                    placeholder="31.75"
                    className="h-11"
                  />
                </Label>
              </div>
              <Label
                label="PAE JSON URL"
                hint="Public URL to the PAE matrix JSON. Host it in Supabase Storage or paste the AlphaFold DB URL."
              >
                <Input
                  type="url"
                  value={draft.prediction_pae_url}
                  onChange={(e) =>
                    set("prediction_pae_url", e.target.value.trim())
                  }
                  placeholder="https://…predicted_aligned_error.json"
                  maxLength={500}
                  className="h-11"
                />
              </Label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Label
                  label="Requested by"
                  hint="Researcher who asked for this entry. Optional."
                >
                  <Input
                    value={draft.requested_by}
                    onChange={(e) => set("requested_by", e.target.value)}
                    maxLength={120}
                    className="h-11"
                  />
                </Label>
                <Label label="Requester affiliation">
                  <Input
                    value={draft.requested_by_affiliation}
                    onChange={(e) =>
                      set("requested_by_affiliation", e.target.value)
                    }
                    maxLength={150}
                    className="h-11"
                  />
                </Label>
                <Label
                  label="Scientifically reviewed by"
                  hint="Expert who vetted this prediction. Optional."
                >
                  <Input
                    value={draft.scientifically_reviewed_by}
                    onChange={(e) =>
                      set("scientifically_reviewed_by", e.target.value)
                    }
                    maxLength={120}
                    className="h-11"
                  />
                </Label>
                <Label label="Reviewer affiliation">
                  <Input
                    value={draft.reviewed_by_affiliation}
                    onChange={(e) =>
                      set("reviewed_by_affiliation", e.target.value)
                    }
                    maxLength={150}
                    className="h-11"
                  />
                </Label>
              </div>
            </div>
          )}
        </div>
      </Section>

      <Section
        title="Provenance"
        hint="Where this came from. Shown on the simulation page as a transparency signal."
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Label label="Software" required>
              <Select
                value={draft.software}
                onChange={(v) => set("software", v)}
                options={SOFTWARE_OPTIONS.map((s) => ({ value: s, label: s }))}
              />
            </Label>
            <Label label="Version">
              <Input
                value={draft.software_version}
                onChange={(e) => set("software_version", e.target.value)}
                placeholder="e.g. 2023.5"
                className="h-11"
              />
            </Label>
            <Label label="Force field">
              <Input
                value={draft.force_field_full}
                onChange={(e) => set("force_field_full", e.target.value)}
                placeholder="e.g. AMBER ff14SB"
                className="h-11"
              />
            </Label>
            <Label label="Water model">
              <Input
                value={draft.water_model}
                onChange={(e) => set("water_model", e.target.value)}
                placeholder="e.g. TIP3P"
                className="h-11"
              />
            </Label>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <Label label="Temperature (K)">
              <Input
                type="number"
                step="any"
                value={draft.temperature_k}
                onChange={(e) => set("temperature_k", e.target.value)}
                className="h-11"
              />
            </Label>
            <Label label="Pressure (bar)">
              <Input
                type="number"
                step="any"
                value={draft.pressure_bar}
                onChange={(e) => set("pressure_bar", e.target.value)}
                className="h-11"
              />
            </Label>
            <Label label="pH">
              <Input
                type="number"
                step="any"
                value={draft.ph}
                onChange={(e) => set("ph", e.target.value)}
                className="h-11"
              />
            </Label>
            <Label label="Ionic (mM)">
              <Input
                type="number"
                step="any"
                value={draft.ionic_strength_mm}
                onChange={(e) =>
                  set("ionic_strength_mm", e.target.value)
                }
                className="h-11"
              />
            </Label>
            <Label label="Length (ns)">
              <Input
                type="number"
                step="any"
                value={draft.length_ns}
                onChange={(e) => set("length_ns", e.target.value)}
                className="h-11"
              />
            </Label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Label label="Lab / group" required>
              <Input
                value={draft.simulation_lab}
                onChange={(e) => set("simulation_lab", e.target.value)}
                placeholder="e.g. Shaw Lab"
                className="h-11"
                required
              />
            </Label>
            <Label label="Institution" required>
              <Input
                value={draft.simulation_institution}
                onChange={(e) =>
                  set("simulation_institution", e.target.value)
                }
                className="h-11"
                required
              />
            </Label>
            <Label label="Corresponding author" required>
              <Input
                value={draft.corresponding_author}
                onChange={(e) =>
                  set("corresponding_author", e.target.value)
                }
                className="h-11"
                required
              />
            </Label>
            <Label label="Corresponding author email" required>
              <Input
                type="email"
                value={draft.corresponding_author_email}
                onChange={(e) =>
                  set("corresponding_author_email", e.target.value)
                }
                className="h-11"
                required
              />
            </Label>
          </div>

          <Label label="Data origin" required>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              {(
                [
                  ["original", "Original — I ran this simulation"],
                  ["reupload_with_permission", "Reupload with permission"],
                  ["public_repository", "From a public repository"],
                ] as const
              ).map(([v, label]) => (
                <label
                  key={v}
                  className={cn(
                    "flex flex-1 cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 text-sm transition-colors",
                    draft.data_origin === v
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border hover:bg-muted/40",
                  )}
                >
                  <input
                    type="radio"
                    name="data_origin"
                    checked={draft.data_origin === v}
                    onChange={() => set("data_origin", v)}
                    className="mt-1 size-3.5 accent-primary"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </Label>

          {draft.data_origin !== "original" && (
            <Label
              label="Original source URL"
              hint="DOI, paper page, or repository link. Required for reuploads."
              required
            >
              <Input
                value={draft.original_source_url}
                onChange={(e) => set("original_source_url", e.target.value)}
                placeholder="https://doi.org/…"
                className="h-11"
                required
              />
            </Label>
          )}

          <Label
            label="Source DOI"
            hint="If a paper or dataset goes with this simulation."
          >
            <Input
              value={draft.source_doi}
              onChange={(e) => set("source_doi", e.target.value)}
              placeholder="10.1234/abc"
              className="h-11 font-mono"
            />
          </Label>
        </div>
      </Section>

      <Section title="License + visibility">
        <div className="flex flex-col gap-4">
          <Label label="License">
            <div className="flex flex-col gap-1.5">
              {LICENSES.map((l) => (
                <label
                  key={l.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                    draft.license === l.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50",
                  )}
                >
                  <input
                    type="radio"
                    name="license"
                    checked={draft.license === l.id}
                    onChange={() => set("license", l.id)}
                    className="mt-1 size-3.5 accent-primary"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {l.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {l.hint}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </Label>
          <Label label="Visibility">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <VisibilityCard
                icon={<Globe className="size-4" />}
                label="Public"
                hint="Anyone can find and view"
                selected={draft.visibility === "public"}
                onSelect={() => set("visibility", "public")}
              />
              <VisibilityCard
                icon={<FileUp className="size-4" />}
                label="Unlisted"
                hint="Only people with the link"
                selected={draft.visibility === "unlisted"}
                onSelect={() => set("visibility", "unlisted")}
              />
              <VisibilityCard
                icon={<Lock className="size-4" />}
                label="Private"
                hint="Only you and collaborators"
                selected={draft.visibility === "private"}
                onSelect={() => set("visibility", "private")}
              />
            </div>
          </Label>
        </div>
      </Section>

      <div className="flex flex-col gap-3 border-t border-border pt-6">
        {progress && (
          <UploadProgress
            label={progress.label}
            uploaded={progress.uploaded}
            total={progress.total}
            bps={progress.bps}
          />
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {formValid ? (
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-emerald-500" />
                Ready to publish
              </span>
            ) : (
              "Fill in title, structure (PDB code or .pdb), lab, institution, author + email."
            )}
          </p>
          <Button type="submit" disabled={!formValid || submitting} size="lg">
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Publishing
              </>
            ) : (
              <>
                <Upload className="size-4" />
                Publish simulation
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

// ----- field helpers --------------------------------------------------------

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium tracking-tight text-foreground">
          {title}
        </h2>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function Label({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-foreground">*</span>}
      </span>
      {children}
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly { value: T; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-foreground/30"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function FileDrop({
  file,
  onFile,
  accept,
  label,
  sublabel,
  optional,
  optionalHint,
  warn,
}: {
  file: File | null;
  onFile: (f: File | null) => void;
  accept: string[];
  label: string;
  sublabel: string;
  optional?: boolean;
  optionalHint?: string;
  warn?: string | null;
}) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) onFile(accepted[0]);
    },
    [onFile],
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: Object.fromEntries(accept.map((ext) => [`application/octet-stream`, [ext]])),
  });

  return (
    <div
      {...getRootProps({
        className: cn(
          "relative flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-6 py-10 text-center transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : warn
              ? "border-destructive/50 bg-destructive/5"
              : "border-border bg-card hover:bg-muted/30",
        ),
      })}
    >
      <input {...getInputProps()} />
      {file ? (
        <div className="flex w-full max-w-md flex-col items-center gap-1.5">
          <div className="flex items-center gap-2 font-mono text-sm text-foreground">
            <FileUp className="size-3.5 text-primary" />
            {file.name}
          </div>
          <div className="text-xs text-muted-foreground">
            {humanSize(file.size)}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFile(null);
            }}
            className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-3" />
            Remove
          </button>
        </div>
      ) : (
        <>
          <Upload className="size-5 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{sublabel}</p>
          {optionalHint && (
            <p className="text-[11px] italic text-muted-foreground">{optionalHint}</p>
          )}
          {optional && (
            <span className="absolute right-3 top-3 rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Optional
            </span>
          )}
          {warn && <p className="text-xs text-destructive">{warn}</p>}
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline">
            Or click to choose a file
            <Tag className="size-3" />
          </p>
        </>
      )}
    </div>
  );
}

function VisibilityCard({
  icon,
  label,
  hint,
  selected,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex flex-col items-start gap-1 rounded-lg border px-3 py-3 text-left transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:bg-muted/50",
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        {icon}
        {label}
      </div>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </button>
  );
}

function UploadProgress({
  label,
  uploaded,
  total,
  bps,
}: {
  label: string;
  uploaded: number;
  total: number;
  bps: number;
}) {
  const pct = total === 0 ? 100 : Math.min(100, (uploaded / total) * 100);
  const etaSeconds = bps > 0 && uploaded < total ? Math.ceil((total - uploaded) / bps) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="font-mono tabular-nums">
          {humanSize(uploaded)} / {humanSize(total)}
          {bps > 0 && ` · ${humanSize(bps)}/s`}
          {etaSeconds > 0 && ` · ${formatEta(etaSeconds)} left`}
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-foreground transition-all duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function formatEta(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

// ----- XHR-based PUT so we get real progress, unlike fetch -----------------

function putWithProgress(
  url: string,
  file: File,
  onProgress: (uploaded: number, total: number, bps: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    const started = Date.now();
    xhr.upload.onprogress = (e) => {
      const uploaded = e.loaded;
      const total = e.total || file.size;
      const elapsed = Math.max(0.001, (Date.now() - started) / 1000);
      onProgress(uploaded, total, uploaded / elapsed);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Trajectory PUT failed (${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error("Trajectory PUT network error."));
    xhr.send(file);
  });
}
