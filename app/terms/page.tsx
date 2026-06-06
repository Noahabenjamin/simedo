// Terms of Service — DRAFT.

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
      <h1 className="mb-2 text-4xl font-medium tracking-[-0.02em] sm:text-5xl">
        Terms of Service
      </h1>
      <p className="mb-12 text-sm text-muted-foreground">
        Last updated: 2026-05-29
      </p>

      <article className="flex max-w-none flex-col gap-5 text-sm leading-relaxed text-foreground/90">
        <p className="rounded-md border border-border bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
          DRAFT — replace with your finalised terms before public launch.
        </p>

        <S title="Acceptance">
          By using Simedo you agree to these terms. If you don&apos;t agree,
          don&apos;t use Simedo.
        </S>

        <S title="Your account">
          You&apos;re responsible for what happens under your account. Don&apos;t
          share credentials. We reserve the right to suspend accounts that
          violate the community guidelines.
        </S>

        <S title="Your content">
          You retain ownership of simulations and comments you post. By
          uploading you grant Simedo a non-exclusive licence to host, display,
          and distribute your content as part of the platform — including
          allowing other users to view and embed it under the licence you
          select on upload.
        </S>

        <S title="Acceptable use">
          Don&apos;t upload content you don&apos;t have the right to share.
          Don&apos;t use Simedo to harass, defame, or spam. Don&apos;t attempt
          to circumvent the platform&apos;s rate limits or security.
        </S>

        <S title="AI-generated content">
          The AI guide is provided as a learning aid. It draws on public
          databases (RCSB PDB, UniProt, Crossref). It can still be wrong.
          Always verify factual claims against primary sources before citing
          them in academic work.
        </S>

        <S title="Termination">
          You may delete your account at any time via settings. We may suspend
          or terminate accounts that breach these terms. Soft-deleted data is
          retained for 30 days before permanent removal.
        </S>

        <S title="Disclaimers">
          Simedo is provided &quot;as is.&quot; We do not guarantee uninterrupted
          service or that simulations are scientifically accurate — that&apos;s
          a property of the uploader, not the platform.
        </S>

        <S title="Governing law">
          These terms are governed by the laws of Slovenia. Disputes go to the
          competent court in Ljubljana.
        </S>
      </article>
    </div>
  );
}

function S({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xl font-medium tracking-[-0.01em] text-foreground">
        {title}
      </h2>
      <p>{children}</p>
    </section>
  );
}
