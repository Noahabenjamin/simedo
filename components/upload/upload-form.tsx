"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Check, FileUp, Globe, Loader2, Lock, Tag, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// UI shell for the upload flow. Validates client-side, builds a preview
// of what would be submitted, and shows a "preview only" toast on submit
// because the backend isn't wired up yet.
//
// Replace the `onSubmit` handler with a server action once the Supabase
// storage bucket and parsing pipeline are in place.

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
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function UploadForm() {
  const [trajectoryFile, setTrajectoryFile] = useState<File | null>(null);
  const [topologyFile, setTopologyFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("protein");
  const [tags, setTags] = useState("");
  const [license, setLicense] = useState<License>("cc-by-4");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [submitting, setSubmitting] = useState(false);

  const tagList = useMemo(
    () =>
      tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    [tags],
  );

  const trajectoryValid = !!trajectoryFile && TRAJECTORY_EXTS.includes(fileExt(trajectoryFile.name));
  const topologyValid = !topologyFile || TOPOLOGY_EXTS.includes(fileExt(topologyFile.name));
  const formValid = trajectoryValid && topologyValid && name.trim().length >= 3;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formValid || submitting) return;
      setSubmitting(true);
      // Simulate a network round-trip so the loading state is visible.
      await new Promise((r) => setTimeout(r, 700));
      setSubmitting(false);
      toast.info("Preview only — backend not connected yet", {
        description:
          "We validated your submission but did not store any files. You'll receive an email when public uploads open.",
      });
    },
    [formValid, submitting],
  );

  return (
    <form className="flex flex-col gap-10" onSubmit={handleSubmit}>
      {/* Trajectory drop zone */}
      <Section
        title="Trajectory"
        hint="The motion data. Required."
        valid={trajectoryValid}
        warn={
          trajectoryFile && !trajectoryValid
            ? `Unsupported extension ${fileExt(trajectoryFile.name)}`
            : null
        }
      >
        <FileDrop
          file={trajectoryFile}
          onFile={setTrajectoryFile}
          accept={TRAJECTORY_EXTS}
          label="Drag a trajectory file here"
          sublabel={TRAJECTORY_EXTS.join(" · ")}
        />
      </Section>

      {/* Topology drop zone */}
      <Section
        title="Topology"
        hint="Atom connectivity and metadata. Optional but recommended."
        valid={topologyValid}
        warn={
          topologyFile && !topologyValid
            ? `Unsupported extension ${fileExt(topologyFile.name)}`
            : null
        }
      >
        <FileDrop
          file={topologyFile}
          onFile={setTopologyFile}
          accept={TOPOLOGY_EXTS}
          label="Drag a topology file here"
          sublabel={TOPOLOGY_EXTS.join(" · ")}
          optional
        />
      </Section>

      {/* Name + description */}
      <Section title="Details" hint="What you're sharing.">
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">
              Name
            </span>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Spike protein RBD with ACE2"
              maxLength={120}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">
              Description
            </span>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              onClick={() => setCategory(c.id)}
              className={cn(
                "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                category === c.id
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
          value={tags}
          onChange={(e) => setTags(e.target.value)}
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
                license === l.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50",
              )}
            >
              <input
                type="radio"
                name="license"
                value={l.id}
                checked={license === l.id}
                onChange={() => setLicense(l.id)}
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
            selected={visibility === "public"}
            onSelect={() => setVisibility("public")}
          />
          <VisibilityCard
            icon={<FileUp className="size-4" />}
            label="Unlisted"
            hint="Only people with the link"
            selected={visibility === "unlisted"}
            onSelect={() => setVisibility("unlisted")}
          />
          <VisibilityCard
            icon={<Lock className="size-4" />}
            label="Private"
            hint="Only you and collaborators"
            selected={visibility === "private"}
            onSelect={() => setVisibility("private")}
          />
        </div>
      </Section>

      {/* Submit */}
      <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {formValid ? (
            <span className="inline-flex items-center gap-1.5">
              <Check className="size-3.5 text-emerald-500" />
              Ready to submit
            </span>
          ) : (
            "Add a trajectory file and a name to continue."
          )}
        </p>
        <Button type="submit" disabled={!formValid || submitting} size="lg">
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Preparing
            </>
          ) : (
            <>
              <Upload className="size-4" />
              Submit for review
            </>
          )}
        </Button>
      </div>
    </form>
  );
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
        {hint && (
          <span className="text-xs text-muted-foreground">{hint}</span>
        )}
      </div>
      {children}
      {warn && (
        <p className="text-xs text-destructive">{warn}</p>
      )}
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
}: {
  file: File | null;
  onFile: (f: File | null) => void;
  accept: string[];
  label: string;
  sublabel: string;
  optional?: boolean;
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
