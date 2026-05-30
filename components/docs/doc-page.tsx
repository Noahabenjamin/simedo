import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DOC_SECTIONS } from "./docs-config";

// Shared content scaffolding for a single docs page: title, lede, body,
// and a "next" / "previous" pager based on the flattened sidebar order.

type Props = {
  eyebrow?: string;
  title: string;
  lede: string;
  href: string;
  children: React.ReactNode;
};

function flatList() {
  const flat: { title: string; href: string }[] = [];
  for (const s of DOC_SECTIONS) for (const i of s.items) flat.push(i);
  return flat;
}

export function DocPage({ eyebrow, title, lede, href, children }: Props) {
  const flat = flatList();
  const idx = flat.findIndex((i) => i.href === href);
  const prev = idx > 0 ? flat[idx - 1] : null;
  const next = idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null;

  return (
    <article className="flex max-w-2xl flex-col gap-10">
      <header className="flex flex-col gap-3">
        {eyebrow && (
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </span>
        )}
        <h1 className="text-3xl font-medium tracking-[-0.02em] sm:text-4xl">
          {title}
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">{lede}</p>
      </header>

      <div className="prose prose-neutral dark:prose-invert flex max-w-none flex-col gap-5 text-[15px] leading-relaxed text-foreground/90">
        {children}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-6 sm:grid-cols-2">
        {prev ? (
          <Link
            href={prev.href}
            className="group flex flex-col gap-1 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/40"
          >
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Previous
            </span>
            <span className="text-sm font-medium text-foreground">
              {prev.title}
            </span>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={next.href}
            className="group flex flex-col items-end gap-1 rounded-xl border border-border bg-card px-4 py-3 text-right transition-colors hover:bg-muted/40"
          >
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Next
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
              {next.title}
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ) : null}
      </div>
    </article>
  );
}

export function DocH2({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2
      id={id}
      className="mt-6 text-xl font-medium tracking-tight text-foreground"
    >
      {children}
    </h2>
  );
}

export function DocH3({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h3
      id={id}
      className="mt-4 text-base font-medium tracking-tight text-foreground"
    >
      {children}
    </h3>
  );
}

export function DocCode({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-border bg-muted/40 p-4 font-mono text-[12.5px] leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

export function DocInline({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px]">
      {children}
    </code>
  );
}

export function DocCallout({
  title,
  children,
  tone = "info",
}: {
  title: string;
  children: React.ReactNode;
  tone?: "info" | "warn";
}) {
  const tones = {
    info: "border-sky-200/60 bg-sky-50/60 text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200",
    warn: "border-amber-200/60 bg-amber-50/60 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
  } as const;
  return (
    <div className={`my-2 rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}>
      <p className="mb-1 text-xs font-medium uppercase tracking-[0.16em] opacity-80">
        {title}
      </p>
      <div className="text-[13.5px] leading-relaxed opacity-95">{children}</div>
    </div>
  );
}
