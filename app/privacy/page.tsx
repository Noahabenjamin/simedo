// Privacy policy — DRAFT.
// Generated using a standard template. Before launch, run through a real
// generator (Iubenda, Termly) or a lawyer for your jurisdiction (Slovenia /
// EU GDPR).

export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
      <h1 className="mb-2 text-4xl font-medium tracking-[-0.02em] sm:text-5xl">
        Privacy Policy
      </h1>
      <p className="mb-12 text-sm text-muted-foreground">
        Last updated: 2026-05-29
      </p>

      <article className="prose prose-neutral flex max-w-none flex-col gap-5 text-sm leading-relaxed text-foreground/90">
        <p className="rounded-md border border-border bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
          DRAFT — replace with your finalised policy before public launch. The
          text below is a starting point, not legal advice.
        </p>

        <Section title="What we collect">
          <p>
            When you create an account we store your email address, a username,
            a display name, an optional bio, an optional institution, and an
            optional ORCID iD. When you upload a simulation we store the file
            you provide and the metadata you choose to attach. When you ask the
            AI guide a question, the question and its response are sent to our
            language-model provider (Anthropic) for processing.
          </p>
        </Section>

        <Section title="What we don't collect">
          <p>
            We do not use third-party advertising trackers. We do not sell
            data. We do not profile users beyond the analytics needed to make
            the product work (anonymous page views and aggregate event counts).
          </p>
        </Section>

        <Section title="Cookies and storage">
          <p>
            We use first-party cookies to keep you signed in (via Supabase
            Auth) and local-storage entries for UI preferences (theme, whether
            you&apos;ve seen the welcome tour). No third-party tracking
            cookies.
          </p>
        </Section>

        <Section title="Who we share data with">
          <p>
            Operationally we use: Supabase (database, auth, file storage),
            Cloudflare R2 (large file storage), Anthropic (LLM inference), and
            a privacy-friendly analytics provider for aggregate page views.
            Each receives only the data necessary to perform its role.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            Under GDPR you have the right to access, correct, and delete your
            data. Email us at the contact address below to exercise any of
            these. Deletion of your account removes your profile, uploaded
            simulations (subject to a 30-day grace period), comments, and AI
            conversation history.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Privacy questions:{" "}
            <a
              href="/contact"
              className="text-foreground underline-offset-4 hover:text-primary hover:underline"
            >
              contact form
            </a>
            .
          </p>
        </Section>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xl font-medium tracking-[-0.01em] text-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}
