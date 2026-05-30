import {
  DocCallout,
  DocCode,
  DocH2,
  DocInline,
  DocPage,
} from "@/components/docs/doc-page";

export const metadata = { title: "Embedding" };

export default function Page() {
  return (
    <DocPage
      eyebrow="Exploring simulations"
      title="Embedding"
      lede="Drop a live Helix viewer into a paper, a slide deck, a blog post, or a course page. The embed is a real viewer — interactive, with the same controls as the full page."
      href="/docs/embedding"
    >
      <DocH2>The iframe</DocH2>
      <p>
        Every public simulation exposes an embed URL at{" "}
        <DocInline>/embed/&lt;id&gt;</DocInline>. Drop that into an iframe:
      </p>
      <DocCode>{`<iframe
  src="https://simedo.work/embed/sim_8x4n2"
  width="100%"
  height="500"
  style="border: 0; border-radius: 12px;"
  allowfullscreen
></iframe>`}</DocCode>

      <DocH2>URL parameters</DocH2>
      <p>The embed URL accepts a few options:</p>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          <DocInline>?t=120</DocInline> — start at frame 120.
        </li>
        <li>
          <DocInline>?rep=cartoon</DocInline> — initial representation
          (<DocInline>cartoon</DocInline>, <DocInline>stick</DocInline>,{" "}
          <DocInline>surface</DocInline>, <DocInline>spacefill</DocInline>).
        </li>
        <li>
          <DocInline>?chain=A</DocInline> — focus camera on a specific chain.
        </li>
        <li>
          <DocInline>?ui=minimal</DocInline> — hide the side panels for a
          slide-friendly view.
        </li>
        <li>
          <DocInline>?autoplay=1</DocInline> — start the timeline playing
          on load.
        </li>
      </ul>

      <DocH2>For papers</DocH2>
      <p>
        For figures in a manuscript, render a high-DPI screenshot from the
        view you embed, with a caption that mentions the simulation
        URL. Reviewers can click through to the live viewer if they want
        to see motion; print readers see a clean static figure. The viewer
        page exposes a one-click PNG export from the share menu.
      </p>

      <DocH2>For talks</DocH2>
      <p>
        Use <DocInline>?ui=minimal&amp;autoplay=1</DocInline> so the embed
        starts moving the moment the slide is shown. Most presentation tools
        (Keynote, Google Slides, Notion) let you paste a URL and it&apos;ll
        render as a live frame.
      </p>

      <DocH2>For courses</DocH2>
      <p>
        We&apos;re working on a lightweight assignments layer: an instructor
        creates a question against a simulation, the embed shows the prompt
        next to the viewer, and students submit short written answers
        linked to a specific timestep. Email us if you&apos;d like early
        access.
      </p>

      <DocCallout title="Self-hosting">
        For institutions that need air-gapped hosting, the viewer is
        open-source and runnable behind a firewall. Contact us for
        deployment notes; we&apos;ll publish the open-source repo at GA.
      </DocCallout>
    </DocPage>
  );
}
