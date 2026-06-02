import Link from "next/link";
import { ArrowRight, UserRound } from "lucide-react";

export default function UserNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-start justify-center gap-6 px-4 py-24 sm:px-6 lg:px-8">
      <div className="flex size-12 items-center justify-center rounded-full border border-border text-muted-foreground">
        <UserRound className="size-5" strokeWidth={1.5} />
      </div>
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        404 · profile
      </span>
      <h1 className="text-3xl font-medium tracking-[-0.02em] text-foreground sm:text-4xl">
        No such profile.
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        That username isn&apos;t taken yet — maybe a typo, or the account
        was deleted. Search for someone, or browse the catalog instead.
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
          href="/sign-up"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-foreground/30"
        >
          Create an account
        </Link>
      </div>
    </div>
  );
}
