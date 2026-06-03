// PLACEHOLDER — replace the body with Noah's real story before launch.

export const metadata = {
  title: "About Simedo",
  description:
    "Simedo is an open platform for sharing molecular dynamics simulations.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
      <header className="mb-12 flex flex-col gap-4">
        <h1 className="text-4xl font-medium tracking-[-0.02em] text-foreground sm:text-5xl">
          About Simedo
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
          A home for molecular dynamics simulations. Built for scientists,
          students, and the curious.
        </p>
      </header>

      <article className="prose prose-neutral flex max-w-none flex-col gap-6 text-base leading-relaxed text-foreground/90">
        <p>
          {/* TODO(noah): replace this paragraph with your real founder story. */}
          Simedo started from a simple frustration: the most beautiful science
          of our time — the atomic motions of proteins, DNA, drugs binding to
          their targets — sits locked inside academic supercomputers,
          impossible for most people to see. Existing tools are powerful but
          ugly, command-line only, and isolated from any kind of community.
        </p>

        <p>
          We wanted a place where a high-school student can watch a real spike
          protein move, a grad student can share their thesis simulation with
          their advisor in a single link, and a senior researcher can browse
          what other groups around the world are doing this week.
        </p>

        <p>That place is Simedo.</p>

        <h2 className="mt-8 text-2xl font-medium tracking-[-0.02em] text-foreground">
          The vision
        </h2>
        <p>
          Make molecular dynamics legible to anyone curious enough to look. Pair
          beautiful 3D rendering with an AI guide that explains what you&apos;re
          looking at, sourced from public databases — not made up. Build the
          social layer scientific platforms have always lacked.
        </p>

        <h2 className="mt-8 text-2xl font-medium tracking-[-0.02em] text-foreground">
          Who we are
        </h2>
        <p>
          {/* TODO(noah): a paragraph about you, what brings you to this problem. */}
          Simedo is built by a small team that cares about the intersection of
          science and design. We&apos;re based in Europe and we&apos;re open to
          collaborators.
        </p>

        <h2 className="mt-8 text-2xl font-medium tracking-[-0.02em] text-foreground">
          Get in touch
        </h2>
        <p>
          Drop us a line via the{" "}
          <a
            href="/contact"
            className="text-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            contact form
          </a>
          .
        </p>
      </article>
    </div>
  );
}
