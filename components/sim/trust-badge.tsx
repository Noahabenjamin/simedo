"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Globe2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { Simulation } from "@/types";

type Props = {
  simulation: Simulation;
};

// Trust badge: a compact pill showing who stands behind this simulation,
// expandable into the full provenance grid. Three states:
//   - Verified academic upload (green) — uploader is verified AND origin
//     is 'original'.
//   - Reupload (gray) — sourced from a public repo or reuploaded with
//     permission; the source link is part of the badge.
//   - Unverified (amber) — shouldn't happen given RLS, but handled.

function originHost(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function badgeState(sim: Simulation) {
  const { dataOrigin, uploaderVerification } = sim.provenance;
  if (uploaderVerification === "none") return "unverified" as const;
  if (dataOrigin === "original") return "verified" as const;
  return "reupload" as const;
}

export function TrustBadge({ simulation }: Props) {
  const [open, setOpen] = useState(false);
  const state = badgeState(simulation);
  const { provenance, trajectory } = simulation;
  const sourceHost = originHost(provenance.originalSourceUrl);

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-muted/40"
      >
        <div className="flex flex-wrap items-center gap-3">
          {state === "verified" && (
            <Pill icon={<ShieldCheck className="size-3.5" />} tone="green">
              Verified academic upload
            </Pill>
          )}
          {state === "reupload" && (
            <Pill icon={<Globe2 className="size-3.5" />} tone="muted">
              Reupload{sourceHost ? ` from ${sourceHost}` : ""}
            </Pill>
          )}
          {state === "unverified" && (
            <Pill icon={<AlertTriangle className="size-3.5" />} tone="amber">
              Unverified
            </Pill>
          )}
          {provenance.simulationInstitution && (
            <span className="text-xs text-muted-foreground">
              {provenance.simulationInstitution}
            </span>
          )}
          {provenance.software && (
            <span className="font-mono text-[11px] text-muted-foreground">
              {provenance.software}
              {provenance.softwareVersion ? ` ${provenance.softwareVersion}` : ""}
            </span>
          )}
        </div>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          Provenance
          {open ? (
            <ChevronUp className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
        </span>
      </button>

      {open && (
        <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 border-t border-border px-4 py-4 text-sm">
          {provenance.simulationLab && (
            <Row k="Lab" v={provenance.simulationLab} />
          )}
          {provenance.simulationInstitution && (
            <Row k="Institution" v={provenance.simulationInstitution} />
          )}
          {provenance.correspondingAuthor && (
            <Row k="Corresponding author" v={provenance.correspondingAuthor} />
          )}
          {provenance.correspondingAuthorEmail && (
            <Row
              k="Author email"
              v={
                <a
                  href={`mailto:${provenance.correspondingAuthorEmail}`}
                  className="underline-offset-2 hover:underline"
                >
                  {provenance.correspondingAuthorEmail}
                </a>
              }
            />
          )}
          {provenance.software && (
            <Row
              k="Software"
              v={
                provenance.softwareVersion
                  ? `${provenance.software} ${provenance.softwareVersion}`
                  : provenance.software
              }
            />
          )}
          {provenance.forceFieldFull && (
            <Row k="Force field" v={provenance.forceFieldFull} />
          )}
          {provenance.waterModel && (
            <Row k="Water model" v={provenance.waterModel} />
          )}
          {provenance.temperatureK != null && (
            <Row k="Temperature" v={`${provenance.temperatureK} K`} />
          )}
          {provenance.pressureBar != null && (
            <Row k="Pressure" v={`${provenance.pressureBar} bar`} />
          )}
          {provenance.ph != null && (
            <Row k="pH" v={provenance.ph.toString()} />
          )}
          {provenance.ionicStrengthMm != null && (
            <Row k="Ionic strength" v={`${provenance.ionicStrengthMm} mM`} />
          )}
          {provenance.lengthNs != null && (
            <Row k="Length" v={`${provenance.lengthNs} ns`} />
          )}
          <Row
            k="Origin"
            v={
              provenance.dataOrigin === "original"
                ? "Original"
                : provenance.dataOrigin === "reupload_with_permission"
                  ? "Reupload with permission"
                  : "Public repository"
            }
          />
          {provenance.originalSourceUrl && (
            <Row
              k="Source"
              v={
                <a
                  href={provenance.originalSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-2 hover:underline"
                >
                  {sourceHost ?? provenance.originalSourceUrl}
                </a>
              }
            />
          )}
          {provenance.sourceDoi && (
            <Row
              k="DOI"
              v={
                <a
                  href={`https://doi.org/${provenance.sourceDoi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono underline-offset-2 hover:underline"
                >
                  {provenance.sourceDoi}
                </a>
              }
            />
          )}
          {trajectory.framesOriginal != null && (
            <Row
              k="Frames"
              v={
                trajectory.framesStreamed &&
                trajectory.framesStreamed !== trajectory.framesOriginal
                  ? `${trajectory.framesOriginal.toLocaleString()} raw · ${trajectory.framesStreamed.toLocaleString()} streamed`
                  : trajectory.framesOriginal.toLocaleString()
              }
            />
          )}
          {trajectory.compressionMethod &&
            trajectory.compressionMethod !== "none" && (
              <Row
                k="Compression"
                v={
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="size-3 text-primary" />
                    {trajectory.compressionMethod.replace(/_/g, " ")}
                  </span>
                }
              />
            )}
          {trajectory.processingStatus !== "ready" && (
            <Row
              k="Status"
              v={
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase text-muted-foreground">
                  {trajectory.processingStatus}
                  {trajectory.processingError && (
                    <span className="text-destructive">
                      · {trajectory.processingError}
                    </span>
                  )}
                </span>
              }
            />
          )}
        </dl>
      )}
    </section>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <>
      <dt className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        {k}
      </dt>
      <dd className="text-foreground">{v}</dd>
    </>
  );
}

function Pill({
  icon,
  tone,
  children,
}: {
  icon: React.ReactNode;
  tone: "green" | "muted" | "amber";
  children: React.ReactNode;
}) {
  const cls =
    tone === "green"
      ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
      : tone === "amber"
        ? "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300"
        : "border-border bg-background text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}
    >
      {icon}
      {children}
    </span>
  );
}
