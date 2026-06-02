import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Not found — Helix",
};

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-start justify-center gap-6 px-4 py-24 sm:px-6 lg:px-8">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        404 · not found
      </span>
      <h1 className="text-3xl font-medium tracking-[-0.02em] text-foreground sm:text-4xl">
        Nothing here.
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist — maybe it was
        a simulation that was removed, or a typo in the URL. Try browsing
        the catalog or jumping back home.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Link
          href="/browse"
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
        >
          Browse simulations
          <ArrowRight className="size-3.5" />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-foreground/30"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
