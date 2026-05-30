import {
  DocCallout,
  DocH2,
  DocInline,
  DocPage,
} from "@/components/docs/doc-page";

export const metadata = { title: "The AI guide" };

export default function Page() {
  return (
    <DocPage
      eyebrow="Exploring simulations"
      title="The AI guide"
      lede="Every simulation has a side panel that answers plain-language questions about what you're looking at. The guide is grounded in public databases and the simulation's own metadata — not free invention."
      href="/docs/ai-guide"
    >
      <DocH2>What it&apos;s good at</DocH2>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          Identifying the system: protein name, organism, function, related
          PDB entries.
        </li>
        <li>
          Explaining the representation: what cartoons, ribbons, surfaces
          show and when to switch.
        </li>
        <li>
          Pointing at chains, residues, and ligands by name when the
          topology has them labelled.
        </li>
        <li>
          Summarising the simulation conditions from the uploader&apos;s
          description (force field, length, temperature).
        </li>
        <li>
          Suggesting questions worth asking next based on the system at
          hand.
        </li>
      </ul>

      <DocH2>What it isn&apos;t</DocH2>
      <p>
        The guide is not a structural biologist. It does not invent residue
        numbers or interactions that aren&apos;t in the topology, and it
        won&apos;t speculate about the underlying biology in ways that go
        beyond the cited sources. If you ask something it can&apos;t
        answer from the simulation and the linked databases, it&apos;ll say
        so rather than guess.
      </p>

      <DocH2>How it&apos;s grounded</DocH2>
      <p>
        Each answer is generated against three context sources, in order of
        priority:
      </p>
      <ol className="list-decimal space-y-1.5 pl-5">
        <li>
          The simulation&apos;s own topology and metadata (chain IDs, residue
          counts, uploader description).
        </li>
        <li>
          UniProt and the Protein Data Bank, looked up by the related PDB IDs
          the uploader linked or that the topology mentions.
        </li>
        <li>
          A small curated library of explanatory write-ups on canonical
          systems (lysozyme, T4 lysozyme variants, common kinase domains,
          ribozymes, etc.).
        </li>
      </ol>
      <p>
        Citations appear inline at the end of each paragraph. Click one to
        jump to the source.
      </p>

      <DocH2>Asking good questions</DocH2>
      <p>
        The guide does best when you ask for a specific kind of help:
      </p>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          <em>&quot;What am I looking at?&quot;</em> — orientation question.
        </li>
        <li>
          <em>&quot;Where is the active site?&quot;</em> — points the camera
          at a residue or region.
        </li>
        <li>
          <em>&quot;Explain the difference between cartoon and ribbon
          here.&quot;</em> — pedagogical / representational.
        </li>
        <li>
          <em>&quot;What residues move the most over this trajectory?&quot;</em>{" "}
          — runs a quick RMSF query on the simulation.
        </li>
      </ul>

      <DocCallout title="Privacy">
        The guide only sees what&apos;s in the open simulation. If you have
        a private simulation, the guide runs in a sandbox that does not
        retain prompts and does not surface answers to other users. See{" "}
        <DocInline>/privacy</DocInline> for the long version.
      </DocCallout>
    </DocPage>
  );
}
