"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { createSimulationFromUpload } from "@/lib/upload-actions";

const CATEGORIES = [
  { id: "protein", label: "Protein dynamics" },
  { id: "nucleic", label: "Nucleic acid" },
  { id: "ligand", label: "Ligand binding" },
  { id: "membrane", label: "Membrane / lipid" },
  { id: "small", label: "Small molecule" },
  { id: "other", label: "Other" },
] as const;

const LICENSES = [
  { id: "cc-by-4", label: "CC BY 4.0", hint: "Reuse with attribution" },
  { id: "cc0", label: "CC0", hint: "Public domain" },
  { id: "cc-by-nc", label: "CC BY-NC 4.0", hint: "Non-commercial" },
  { id: "custom", label: "Custom", hint: "Specify in description" },
] as const;

const TRAJECTORY_EXTS = [".xtc", ".dcd", ".trr", ".nc", ".lh5"];
const TOPOLOGY_EXTS = [".pdb", ".gro", ".psf", ".prmtop", ".top", ".cif"];

const TRAJECTORY_MAX_BYTES = 100 * 1024 * 1024; // 100 MB
const TOPOLOGY_MAX_BYTES = 25 * 1024 * 1024; // 25 MB

const DRAFT_KEY = "helix-upload-draft-v1";

type Category = (typeof CATEGORIES)[number]["id"];
type License = (typeof LICENSES)[number]["id"];
type Visibility = "public" | "unlisted" | "private";

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

type Draft = {
  name: string;
  description: string;
  category: Category;
  tags: string;
  license: License;
  visibility: Visibility;
  pdbCode: string;
};

const EMPTY_DRAFT: Draft = {
  name: "",
  description: "",
  category: "protein",
  tags: "",
  license: "cc-by-4",
  visibility: "public",
  pdbCode: "",
};

export function UploadForm() {
  const router = useRouter();
  const [trajectoryFile, setTrajectoryFile] = useState<File | null>(null);
  const [topologyFile, setTopologyFile] = useState<File | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<{ uploaded: number; total: number } | null>(
    null,
  );
  const hydratedRef = useRef(false);

  // Hydrate from localStorage on mount.
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Draft>;
        setDraft((d) => ({ ...d, ...parsed }));
      }
    } catch {
      /* draft corrupt — ignore */
    }
  }, []);

  // Persist draft on every change (text-only; files aren't serializable).
  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* quota / private mode — best effort */
    }
  }, [draft]);

  const set = useCallback(
    <K extends keyof Draft>(key: K, value: Draft[K]) =>
      setDraft((d) => ({ ...d, [key]: value })),
    [],
  );

  const tagList = useMemo(
    () =>
      draft.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    [draft.tags],
  );

  const trajectoryValid =
    !!trajectoryFile &&
    TRAJECTORY_EXTS.includes(fileExt(trajectoryFile.name)) &&
    trajectoryFile.size <= TRAJECTORY_MAX_BYTES;
  const topologyValid =
    !topologyFile ||
    (TOPOLOGY_EXTS.includes(fileExt(topologyFile.name)) &&
      topologyFile.size <= TOPOLOGY_MAX_BYTES);
  const hasStructure =
    /^[a-z0-9]{4}$/i.test(draft.pdbCode.trim()) || !!topologyFile;
  const formValid =
    hasStructure && draft.name.trim().length >= 3 && topologyValid;

  const trajectoryWarn = (() => {
    if (!trajectoryFile) return null;
    if (!TRAJECTORY_EXTS.includes(fileExt(trajectoryFile.name)))
      return `Unsupported extension ${fileExt(trajectoryFile.name)}`;
    if (trajectoryFile.size > TRAJECTORY_MAX_BYTES)
      return `${humanSize(trajectoryFile.size)} exceeds the 100 MB cap`;
    return null;
  })();

  const topologyWarn = (() => {
    if (!topologyFile) return null;
    if (!TOPOLOGY_EXTS.includes(fileExt(topologyFile.name)))
      return `Unsupported extension ${fileExt(topologyFile.name)}`;
    if (topologyFile.size > TOPOLOGY_MAX_BYTES)
      return `${humanSize(topologyFile.size)} exceeds the 25 MB cap`;
    return null;
  })();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formValid || submitting) return;
      setSubmitting(true);
      setProgress(null);

      const sb = getBrowserSupabase();
      if (!sb) {
        toast.error("Upload backend not configured", {
          description:
            "Set NEXT_PUBLIC_SUPABASE_URL and the matching anon key, then run the storage-buckets migration.",
        });
        setSubmitting(false);
        return;
      }

      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) {
        toast.error("Sign in to upload");
        setSubmitting(false);
        router.push("/sign-in?redirect=/upload");
        return;
      }

      try {
        let trajectoryStoragePath: string | null = null;
        let topologyStoragePath: string | null = null;

        if (trajectoryFile) {
          setProgress({ uploaded: 0, total: trajectoryFile.size });
          const name = `${Date.now()}-${sanitizeFileName(trajectoryFile.name)}`;
          const path = `${user.id}/${name}`;
          const { error } = await sb.storage
            .from("helix-trajectories")
            .upload(path, trajectoryFile, {
              contentType: trajectoryFile.type || "application/octet-stream",
              upsert: false,
            });
          if (error) throw error;
          trajectoryStoragePath = path;
          setProgress({
            uploaded: trajectoryFile.size,
            total: trajectoryFile.size,
          });
        }

        if (topologyFile) {
          const name = `${Date.now()}-${sanitizeFileName(topologyFile.name)}`;
          const path = `${user.id}/${name}`;
          const { error } = await sb.storage
            .from("helix-topologies")
            .upload(path, topologyFile, {
              contentType: topologyFile.type || "application/octet-stream",
              upsert: false,
            });
          if (error) throw error;
          topologyStoragePath = path;
        }

        const result = await createSimulationFromUpload({
          title: draft.name.trim(),
          description: draft.description.trim(),
          category: draft.category,
          tags: tagList,
          license: draft.license,
          visibility: draft.visibility,
          pdbCode: draft.pdbCode.trim() || null,
          trajectoryStoragePath,
          trajectorySizeBytes: trajectoryFile?.size ?? null,
          topologyStoragePath,
        });

        if ("error" in result) {
          toast.error("Couldn't create the simulation", {
            description: result.error,
          });
          return;
        }

        // Clear the draft and route to the new simulation page.
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {
          /* ignore */
        }
        toast.success("Simulation uploaded");
        router.push(`/simulation/${result.id}`);
      } catch (err) {
        toast.error("Upload failed", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        setSubmitting(false);
        setProgress(null);
      }
    },
    [
      formValid,
      submitting,
      trajectoryFile,
      topologyFile,
      draft,
      tagList,
      router,
    ],
  );

  return (
    <form className="flex flex-col gap-10" onSubmit={handleSubmit}>
      {/* PDB code or topology */}
      <Section
        title="Structure"
        hint="Reference structure for the viewer. PDB code or a topology file."
        valid={hasStructure}
      >
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">PDB code</span>
            <Input
              value={draft.pdbCode}
              onChange={(e) => set("pdbCode", e.target.value.trim())}
              placeholder="e.g. 1HHO"
              maxLength={4}
              className="font-mono uppercase"
            />
            <span className="text-[10px] text-muted-foreground">
              We&apos;ll fetch the PDB from RCSB automatically.
            </span>
          </label>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            <span>or attach a topology file</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <FileDrop
            file={topologyFile}
            onFile={setTopologyFile}
            accept={TOPOLOGY_EXTS}
            label="Drag a topology file here"
            sublabel={TOPOLOGY_EXTS.join(" · ")}
            optional
            warn={topologyWarn}
          />
        </div>
      </Section>

      {/* Trajectory drop zone */}
      <Section
        title="Trajectory"
        hint="The motion data. Optional — structure-only uploads are fine."
        valid={!trajectoryFile || trajectoryValid}
        warn={trajectoryWarn}
      >
        <FileDrop
          file={trajectoryFile}
          onFile={setTrajectoryFile}
          accept={TRAJECTORY_EXTS}
          label="Drag a trajectory file here"
          sublabel={`${TRAJECTORY_EXTS.join(" · ")} · up to 100 MB`}
          optional
          warn={trajectoryWarn}
        />
      </Section>

      {/* Name + description */}
      <Section title="Details" hint="What you're sharing.">
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Name</span>
            <Input
              required
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Spike protein RBD with ACE2"
              maxLength={120}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Description</span>
            <Textarea
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Force field, integrator, conditions, simulation length, citations…"
              rows={5}
            />
          </label>
        </div>
      </Section>

      {/* Category */}
      <Section title="Category" hint="Helps the right people find it.">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => set("category", c.id)}
              className={cn(
                "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                draft.category === c.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Tags */}
      <Section title="Tags" hint="Comma separated.">
        <Input
          value={draft.tags}
          onChange={(e) => set("tags", e.target.value)}
          placeholder="charmm36, gromacs, 500ns"
        />
        {tagList.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tagList.map((t, i) => (
              <span
                key={`${t}-${i}`}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
              >
                <Tag className="size-3" />
                {t}
              </span>
            ))}
          </div>
        )}
      </Section>

      {/* License */}
      <Section title="License">
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
                value={l.id}
                checked={draft.license === l.id}
                onChange={() => set("license", l.id)}
                className="mt-1 size-3.5 accent-primary"
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  {l.label}
                </span>
                <span className="text-xs text-muted-foreground">{l.hint}</span>
              </div>
            </label>
          ))}
        </div>
      </Section>

      {/* Visibility */}
      <Section title="Visibility">
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
      </Section>

      {/* Submit + progress */}
      <div className="flex flex-col gap-3 border-t border-border pt-6">
        {progress && (
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Uploading trajectory</span>
              <span className="font-mono">
                {humanSize(progress.uploaded)} / {humanSize(progress.total)}
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-foreground transition-all duration-200"
                style={{
                  width:
                    progress.total === 0
                      ? "100%"
                      : `${Math.min(100, (progress.uploaded / progress.total) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {formValid ? (
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-emerald-500" />
                Ready to upload
              </span>
            ) : (
              "Add a PDB code or topology, plus a name (3+ characters)."
            )}
          </p>
          <Button type="submit" disabled={!formValid || submitting} size="lg">
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Uploading
              </>
            ) : (
              <>
                <Upload className="size-4" />
                Upload
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

function sanitizeFileName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .slice(0, 200);
}

// ---------- Section wrapper -----------------------------------------------

function Section({
  title,
  hint,
  valid,
  warn,
  children,
}: {
  title: string;
  hint?: string;
  valid?: boolean;
  warn?: string | null;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium tracking-tight text-foreground">
          {title}
          {valid && (
            <Check className="ml-2 inline-block size-3.5 -translate-y-px text-emerald-500" />
          )}
        </h2>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
      {warn && <p className="text-xs text-destructive">{warn}</p>}
    </section>
  );
}

// ---------- File drop zone ------------------------------------------------

function FileDrop({
  file,
  onFile,
  accept,
  label,
  sublabel,
  optional,
  warn,
}: {
  file: File | null;
  onFile: (f: File | null) => void;
  accept: string[];
  label: string;
  sublabel: string;
  optional?: boolean;
  warn?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);

  const onChooseClick = () => inputRef.current?.click();

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setHover(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={onDrop}
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-6 py-10 text-center transition-colors",
        hover
          ? "border-primary bg-primary/5"
          : warn
            ? "border-destructive/50 bg-destructive/5"
            : "border-border bg-card hover:bg-muted/30",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept.join(",")}
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />

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
            onClick={() => onFile(null)}
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
          <button
            type="button"
            onClick={onChooseClick}
            className="mt-2 text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            Or choose a file
          </button>
          {optional && (
            <span className="absolute right-3 top-3 rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Optional
            </span>
          )}
        </>
      )}
    </div>
  );
}

// ---------- Visibility card -----------------------------------------------

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
