import Link from "next/link";
import { ArrowRight, Atom } from "lucide-react";

export default function SimulationNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-start justify-center gap-6 px-4 py-24 sm:px-6 lg:px-8">
      <div className="flex size-12 items-center justify-center rounded-full border border-border text-muted-foreground">
        <Atom className="size-5" strokeWidth={1.5} />
      </div>
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        404 · simulation
      </span>
      <h1 className="text-3xl font-medium tracking-[-0.02em] text-foreground sm:text-4xl">
        That simulation doesn&apos;t exist.
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        It may have been deleted by its author, made private, or never
        existed in the first place. Browse the catalog for active
        simulations or search by PDB code.
      </p>
      <Link
        href="/browse"
        className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
      >
        Browse simulations
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}
