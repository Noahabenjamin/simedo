"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

// Root error boundary. Renders when any uncaught error escapes the
// segment-level boundaries. Logs to the console (Vercel picks it up)
// then offers a way back.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[helix] unhandled error", error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-start justify-center gap-6 px-4 py-24 sm:px-6 lg:px-8">
      <div className="flex size-12 items-center justify-center rounded-full border border-border text-muted-foreground">
        <AlertTriangle className="size-5" strokeWidth={1.5} />
      </div>
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        500 · something broke
      </span>
      <h1 className="text-3xl font-medium tracking-[-0.02em] text-foreground sm:text-4xl">
        Simedo hit an error.
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        We logged it. Try again, or head somewhere else. If this keeps
        happening, drop a note via the contact page with the digest below.
      </p>
      {error.digest && (
        <code className="rounded-md border border-border bg-muted px-2 py-1 font-mono text-[11px] text-muted-foreground">
          {error.digest}
        </code>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
        >
          Try again
          <ArrowRight className="size-3.5" />
        </button>
        <Link
          href="/browse"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-foreground/30"
        >
          Browse simulations
        </Link>
      </div>
    </div>
  );
}
