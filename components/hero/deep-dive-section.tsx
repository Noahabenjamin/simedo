import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AtBasePairSVG } from "./chemicals/at-base-pair";
import { SimulationCard } from "@/components/simulation-card";
import { mockSimulations } from "@/lib/mock-data";

// The "deep dive" section that emerges as the dark hero transitions to
// light blue. Sits *below* the 400vh hero in the document — the user lands
// here once the hero is fully scrolled.
//
// Static, no animation tied to scroll. The hero's last keyframe interpolates
// the bg color from navy to light blue, so the visual transition into this
// section's solid #DBEAFE feels seamless rather than abrupt.

const DEEP_DIVE_BG = "#DBEAFE";
const DOT_COLOR = "#BFDBFE";

export function DeepDiveSection() {
  // Curated DNA-adjacent simulations (DNA-only is just 1BNA in seed data,
  // so we widen the net to histones + CRISPR which both feature DNA).
  const featured = mockSimulations
    .filter(
      (s) =>
        s.category === "dna" ||
        s.proteinFamily === "Histones" ||
        s.proteinFamily === "CRISPR-Cas9",
    )
    .slice(0, 3);

  return (
    <section
      className="relative w-full"
      style={{
        background: `${DEEP_DIVE_BG} radial-gradient(circle at 1px 1px, ${DOT_COLOR} 1px, transparent 0) 0 0 / 32px 32px`,
      }}
    >
      <div className="mx-auto w-full max-w-7xl px-6 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: base pair illustration */}
          <div className="flex flex-col gap-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#1E3A8A]/70">
              Adenine · Thymine pairing
            </span>
            <div className="rounded-2xl border border-[#BFDBFE] bg-white p-6 sm:p-10">
              <AtBasePairSVG className="h-auto w-full" />
            </div>
            <p className="text-xs leading-relaxed text-[#1E3A8A]/70">
              A pairs with T via two hydrogen bonds. C pairs with G via three.
              The asymmetry is what makes the genetic code readable.
            </p>
          </div>

          {/* Right: editorial copy */}
          <div className="flex flex-col gap-6 lg:py-8">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#1E3A8A]/70">
              Chapter one — DNA
            </span>
            <h2 className="text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-[#0F172A] sm:text-5xl">
              Watch it breathe.
            </h2>
            <div className="flex flex-col gap-4 text-base leading-relaxed text-[#1E293B]/85">
              <p>
                B-form DNA isn&apos;t the rigid ladder textbooks draw. On the
                microsecond timescale, base pairs transiently open and close
                — the imino protons exchange with solvent, the helix samples
                rare Hoogsteen conformations, AT-rich tracts breathe more
                readily than GC tracts. NMR studies first hinted at it in the
                1970s; molecular dynamics simulations show it directly.
              </p>
              <p>
                Modern MD reaches millisecond trajectories of dodecamers and
                longer. They reveal how sequence context tunes flexibility,
                how transcription factors find their binding sites by
                exploiting these motions, and how mismatch repair enzymes
                read the geometry of breathing pairs to spot errors.
              </p>
              <p>
                This matters everywhere DNA structure matters: drug design
                (groove binders, intercalators), gene editing (Cas9 needs an
                accessible target), and the basic biology of replication and
                repair. Every conformational state you can see, you can
                target.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/browse?category=dna"
                className="flex items-center gap-1.5 rounded-md bg-[#1E40AF] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1D3FA8]"
              >
                Explore DNA simulations
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Featured tile row */}
        {featured.length > 0 && (
          <div className="mt-20 flex flex-col gap-6 lg:mt-28">
            <div className="flex items-end justify-between gap-4">
              <h3 className="text-xl font-medium tracking-tight text-[#0F172A]">
                Featured DNA simulations
              </h3>
              <Link
                href="/browse?category=dna"
                className="flex items-center gap-1 text-xs font-medium text-[#1E40AF] transition-colors hover:opacity-80"
              >
                Browse all
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
              {featured.map((s) => (
                <div key={s.id} className="[&_article]:bg-white">
                  <SimulationCard simulation={s} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Smooth handoff into the rest of the homepage */}
      <div
        aria-hidden="true"
        className="h-24 w-full"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, #FFFFFF 100%)",
        }}
      />
    </section>
  );
}
