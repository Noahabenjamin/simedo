import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DOC_SECTIONS } from "@/components/docs/docs-config";

export const metadata = {
  title: "Docs",
  description:
    "Documentation for Simedo: uploading, supported formats, the AI guide, embedding, and the API.",
};

export default function DocsOverviewPage() {
  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Simedo documentation
        </span>
        <h1 className="text-4xl font-medium tracking-[-0.02em] sm:text-5xl">
          Everything you need to share simulations.
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          Simedo is a platform for molecular dynamics trajectories — uploading
          one, exploring one someone else uploaded, asking an AI guide what
          you&apos;re looking at, and embedding a viewer anywhere on the web.
          These pages are the reference for all of that.
        </p>
      </header>

      <div className="flex flex-col gap-10">
        {DOC_SECTIONS.map((section) => (
          <section key={section.title} className="flex flex-col gap-4">
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {section.title}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex flex-col gap-2 rounded-xl border border-border bg-card px-4 py-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium tracking-tight text-foreground">
                      {item.title}
                    </span>
                    <ArrowUpRight className="size-3.5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </div>
                  <p className="text-[13px] leading-relaxed text-muted-foreground">
                    {item.blurb}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
