import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { UploadForm } from "@/components/upload/upload-form";

export const metadata = {
  title: "Upload simulation",
  description:
    "Share a molecular dynamics simulation with the Helix community.",
};

export default function UploadPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:py-20">
      <header className="mb-10 flex flex-col gap-4">
        <Link
          href="/browse"
          className="inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          Back to browse
        </Link>
        <h1 className="text-4xl font-medium tracking-[-0.02em] sm:text-5xl">
          Upload simulation
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          Share a molecular dynamics trajectory with the Helix community.
          Supported formats are XTC, DCD, TRR for trajectories, and PDB, GRO,
          PSF for topologies.
        </p>
      </header>

      <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-200/60 bg-amber-50/60 px-4 py-3 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        <Info className="mt-0.5 size-4 shrink-0" />
        <div className="flex flex-col gap-0.5 text-xs leading-relaxed">
          <span className="font-medium">Preview only</span>
          <span className="text-amber-900/80 dark:text-amber-200/80">
            The upload backend is not connected yet. The form below validates
            and previews your submission, but files are not stored. Public
            uploads open during the closed beta.
          </span>
        </div>
      </div>

      <UploadForm />
    </div>
  );
}
