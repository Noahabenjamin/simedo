import Link from "next/link";
import {
  DocCallout,
  DocH2,
  DocInline,
  DocPage,
} from "@/components/docs/doc-page";

export const metadata = { title: "Uploading a simulation" };

export default function Page() {
  return (
    <DocPage
      eyebrow="Sharing your work"
      title="Uploading a simulation"
      lede="The upload form is one page. This walkthrough explains every field, what gets parsed automatically, and what reviewers look for."
      href="/docs/uploading"
    >
      <DocH2>What you&apos;ll need</DocH2>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          A <strong>trajectory file</strong> in one of the supported formats
          (see <Link href="/docs/formats" className="text-primary underline-offset-4 hover:underline">Supported formats</Link>).
        </li>
        <li>
          A <strong>topology file</strong> with atom names, residues, and
          bonds. Optional but strongly recommended — without it the viewer
          falls back to a generic stick representation with no chain
          colouring.
        </li>
        <li>
          A short <strong>description</strong>: force field, integrator,
          conditions, total simulated time, any citations.
        </li>
      </ul>

      <DocH2>Walking through the form</DocH2>
      <p>
        Open <Link href="/upload" className="text-primary underline-offset-4 hover:underline">/upload</Link>{" "}
        and drag your trajectory file onto the top drop zone. The form will
        check the extension and refuse anything it can&apos;t read. Drop your
        topology in the second zone.
      </p>
      <p>
        <strong>Name</strong> — a short title that helps people find your work
        when searching. We recommend starting with the system itself
        (&quot;Spike protein RBD with ACE2&quot;) rather than the lab name or
        run number.
      </p>
      <p>
        <strong>Description</strong> — this is where reviewers and the AI
        guide get their context. Include the force field, water model, ensemble,
        temperature, salt concentration, and length of the simulation. If
        there&apos;s a published paper, link it.
      </p>
      <p>
        <strong>Category</strong> — the rough biological domain. Surfaces
        your simulation in the matching tile on the browse page.
      </p>
      <p>
        <strong>Tags</strong> — free-text, comma-separated. Use these for
        engine names ({" "}
        <DocInline>gromacs</DocInline>, <DocInline>amber</DocInline>,{" "}
        <DocInline>namd</DocInline>), force fields, methods (e.g.{" "}
        <DocInline>metadynamics</DocInline>), and simulation length.
      </p>
      <p>
        <strong>License</strong> — defaults to CC BY 4.0 because most
        scientists want attribution-only reuse. CC0 if you don&apos;t care.
        CC BY-NC for non-commercial only. &quot;Custom&quot; lets you specify
        the terms in your description; reviewers will check the wording.
      </p>
      <p>
        <strong>Visibility</strong> — Public is indexed and crawled. Unlisted
        is only reachable via the URL. Private is you and collaborators you
        add later from the simulation page.
      </p>

      <DocH2>After you submit</DocH2>
      <ol className="list-decimal space-y-1.5 pl-5">
        <li>
          The trajectory and topology are uploaded to object storage.
        </li>
        <li>
          A worker parses the topology to extract chains, residue counts,
          atom counts, and a thumbnail of frame 0.
        </li>
        <li>
          For public uploads, a reviewer checks that the description matches
          the data and that the license is consistent. Most reviews complete
          within 24 hours.
        </li>
        <li>
          Once approved, your simulation appears on <Link href="/browse" className="text-primary underline-offset-4 hover:underline">browse</Link>.
          You&apos;ll get an email with the canonical URL.
        </li>
      </ol>

      <DocCallout title="Preview only">
        The upload form is live but the storage backend is not yet connected
        — submissions are validated and previewed but not stored. Public
        uploads open with the storage rollout in a coming release.
      </DocCallout>
    </DocPage>
  );
}
