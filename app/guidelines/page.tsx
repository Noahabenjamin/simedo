export const metadata = { title: "Community guidelines" };

export default function GuidelinesPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
      <header className="mb-12 flex flex-col gap-4">
        <h1 className="text-4xl font-medium tracking-[-0.02em] sm:text-5xl">
          Community guidelines
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
          Simedo is a place for serious, curious, generous people to share
          science. Here&apos;s what we ask.
        </p>
      </header>

      <article className="flex max-w-none flex-col gap-6 text-base leading-relaxed text-foreground/90">
        <G n="1" title="Be accurate, or say you don't know.">
          When you upload a simulation, fill the metadata honestly. When you
          comment, distinguish what you observe from what you speculate. When
          you cite, link the source.
        </G>

        <G n="2" title="Credit the work behind the data.">
          If a simulation is connected to a paper, link it. If you build on
          someone else&apos;s simulation, acknowledge them. The default
          licence is CC-BY — use the data, credit the author.
        </G>

        <G n="3" title="Discuss the science, not the scientist.">
          Disagreement is welcome. Personal attacks are not.
        </G>

        <G n="4" title="Don't upload what isn't yours to share.">
          Embargoed papers, proprietary force fields, datasets you don&apos;t
          own — don&apos;t upload them. Use the &quot;private&quot; visibility
          setting if you want to share with specific collaborators only.
        </G>

        <G n="5" title="No spam, no self-promotion that isn't useful.">
          Sharing your group&apos;s simulations is great. Spamming the same
          link across every comment thread isn&apos;t.
        </G>

        <G n="6" title="The AI guide is a tool, not a citation.">
          Verify before you cite. The guide draws on public databases — those
          are the sources, not the model.
        </G>

        <G n="7" title="If you see something that breaks these guidelines,">
          use the report button on the offending content. Reports go to a
          moderation queue.
        </G>
      </article>

      <footer className="mt-16 border-t border-border pt-8 text-sm text-muted-foreground">
        Violations may result in content removal or account suspension. We try
        to apply these rules consistently and to err on the side of explaining
        before enforcing.
      </footer>
    </div>
  );
}

function G({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="flex gap-5 border-t border-border pt-6 first:border-t-0 first:pt-0">
      <span className="font-mono text-sm tabular-nums text-muted-foreground">
        {n}
      </span>
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-medium tracking-[-0.01em] text-foreground">
          {title}
        </h2>
        <p>{children}</p>
      </div>
    </section>
  );
}
