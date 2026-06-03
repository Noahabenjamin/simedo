import {
  DocCallout,
  DocH2,
  DocInline,
  DocPage,
} from "@/components/docs/doc-page";

export const metadata = { title: "Supported formats" };

const TRAJECTORY = [
  { ext: ".xtc", from: "GROMACS", notes: "Compressed, lossy. Most common." },
  { ext: ".trr", from: "GROMACS", notes: "Full precision, includes velocities and forces." },
  { ext: ".dcd", from: "CHARMM / NAMD", notes: "Binary, common in NAMD and OpenMM exports." },
  { ext: ".nc", from: "AMBER", notes: "NetCDF, AMBER-flavoured." },
  { ext: ".lh5", from: "MDTraj", notes: "Lossy HDF5, compact for sharing." },
];

const TOPOLOGY = [
  { ext: ".pdb", from: "Protein Data Bank", notes: "Universal but lossy. No bond orders." },
  { ext: ".gro", from: "GROMACS", notes: "Coordinates + residues, no bonds." },
  { ext: ".psf", from: "CHARMM / NAMD", notes: "Bonds and connectivity, pairs with .dcd." },
  { ext: ".prmtop", from: "AMBER", notes: "Full topology with charges and parameters." },
  { ext: ".top", from: "GROMACS", notes: "Force-field topology, pairs with .gro." },
  { ext: ".cif", from: "PDBx / mmCIF", notes: "Modern PDB, recommended for new uploads." },
];

export default function Page() {
  return (
    <DocPage
      eyebrow="Sharing your work"
      title="Supported formats"
      lede="Simedo can read most trajectory and topology formats used by GROMACS, AMBER, NAMD, and CHARMM. Use this page as the reference when preparing an upload."
      href="/docs/formats"
    >
      <DocH2>Trajectories</DocH2>
      <FormatTable rows={TRAJECTORY} />

      <DocH2>Topologies</DocH2>
      <FormatTable rows={TOPOLOGY} />

      <DocH2>What gets indexed</DocH2>
      <p>
        When you upload a topology, our parser extracts:
      </p>
      <ul className="list-disc space-y-1 pl-5">
        <li>Chain IDs and residue counts</li>
        <li>Atom counts per chain and per residue type</li>
        <li>Bond list (if available)</li>
        <li>A thumbnail of frame 0</li>
        <li>Estimated simulation length from the trajectory frame count</li>
      </ul>
      <p>
        This metadata is what powers the search filters on{" "}
        <DocInline>/browse</DocInline> and the title bar on each simulation
        page.
      </p>

      <DocH2>Best practices</DocH2>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          Strip waters and ions from the trajectory you upload — they bloat
          file size without adding interpretability. Keep them in a separate
          run if reviewers ask.
        </li>
        <li>
          Use <DocInline>.xtc</DocInline> for the public version.{" "}
          <DocInline>.trr</DocInline> doubles file size for fidelity most
          viewers won&apos;t notice.
        </li>
        <li>
          Match the stride to the analysis you want viewers to do. 10 ps
          stride is the sweet spot for protein-scale dynamics; 1 ps for fast
          loops.
        </li>
        <li>
          If your topology lacks bond information (e.g. plain PDB), the
          viewer will infer bonds by distance — usually fine but check the
          preview before publishing.
        </li>
      </ul>

      <DocCallout title="On the roadmap">
        Native support for OpenMM <DocInline>.dat</DocInline> reporters and
        for streaming partial trajectories without a full download is in
        design. Open an issue if your engine produces something we don&apos;t
        list above.
      </DocCallout>
    </DocPage>
  );
}

function FormatTable({
  rows,
}: {
  rows: { ext: string; from: string; notes: string }[];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-2 font-medium">Extension</th>
            <th className="px-4 py-2 font-medium">From</th>
            <th className="px-4 py-2 font-medium">Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.ext} className={i % 2 === 0 ? "" : "bg-muted/20"}>
              <td className="px-4 py-2 font-mono text-[12.5px]">{r.ext}</td>
              <td className="px-4 py-2 text-muted-foreground">{r.from}</td>
              <td className="px-4 py-2 text-foreground/90">{r.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
