import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UploadForm } from "@/components/upload/upload-form";
import { isDbAvailable } from "@/lib/data/db-available";

export const metadata = {
  title: "Upload simulation",
  description:
    "Share a molecular dynamics simulation with the Simedo community.",
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
          Share a molecular dynamics trajectory with the Simedo community.
          Supported formats are XTC, DCD, TRR for trajectories, and PDB, GRO,
          PSF for topologies.
        </p>
      </header>

      {isDbAvailable() ? (
        <UploadForm />
      ) : (
        <div className="rounded-2xl border border-border bg-card px-6 py-16 text-center">
          <p className="text-sm font-medium text-foreground">
            Upload backend is not configured
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Set Supabase URL + anon key and run the storage-buckets migration
            to enable uploads.
          </p>
        </div>
      )}
    </div>
  );
}
