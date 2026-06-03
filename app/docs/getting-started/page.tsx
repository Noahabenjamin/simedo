import Link from "next/link";
import {
  DocCallout,
  DocH2,
  DocInline,
  DocPage,
} from "@/components/docs/doc-page";

export const metadata = { title: "Getting started" };

export default function Page() {
  return (
    <DocPage
      eyebrow="Start here"
      title="Getting started"
      lede="Simedo lets you watch molecular dynamics simulations in a browser, share them with a link, and ask an AI guide what's going on. Here's the five-minute orientation."
      href="/docs/getting-started"
    >
      <p>
        A <strong>simulation</strong> on Simedo is a 3D animation of atoms
        moving over time — the output of a molecular dynamics run. The minimum
        you need to share one is a trajectory file. With a topology file alongside
        it, you also get atom names, bonds, residues, and chains in the viewer.
      </p>

      <DocH2>What you can do</DocH2>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          <Link href="/browse" className="text-primary underline-offset-4 hover:underline">
            Browse public simulations
          </Link>{" "}
          posted by other researchers, ordered by recency, trending, or
          category.
        </li>
        <li>
          Open any simulation in the viewer, scrub the timeline, change the
          representation (cartoon, ball-and-stick, surface), and isolate
          chains.
        </li>
        <li>
          Ask the <Link href="/docs/ai-guide" className="text-primary underline-offset-4 hover:underline">AI guide</Link>{" "}
          plain-language questions about the system you&apos;re looking at.
        </li>
        <li>
          <Link href="/upload" className="text-primary underline-offset-4 hover:underline">
            Upload your own
          </Link>{" "}
          trajectory and get a shareable URL.
        </li>
        <li>
          <Link href="/docs/embedding" className="text-primary underline-offset-4 hover:underline">
            Embed
          </Link>{" "}
          a live viewer in a paper, slide, or website.
        </li>
      </ul>

      <DocH2>Your first five minutes</DocH2>
      <ol className="list-decimal space-y-1.5 pl-5">
        <li>
          Go to <DocInline>/browse</DocInline> and click any simulation that
          catches your eye.
        </li>
        <li>
          Press the play button on the timeline. The atoms start moving.
        </li>
        <li>
          Open the AI guide panel on the right. Ask:{" "}
          <em>&quot;What protein is this?&quot;</em>
        </li>
        <li>
          Try switching the representation between <em>cartoon</em> and{" "}
          <em>ball-and-stick</em>. Watch how the same atoms look in each.
        </li>
        <li>
          Use the share button at the top right to grab a link that drops the
          recipient at the same timestep and view as you.
        </li>
      </ol>

      <DocCallout title="Heads up">
        Simedo is in closed beta. Uploads are gated to invited researchers
        until the storage and review backend lands. You can still explore
        every public simulation already on the platform.
      </DocCallout>
    </DocPage>
  );
}
