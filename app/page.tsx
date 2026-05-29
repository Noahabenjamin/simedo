import { DNAHeroShell } from "@/components/hero/dna-hero-shell";
import { DeepDiveSection } from "@/components/hero/deep-dive-section";
import { TrendingRow } from "@/components/trending-row";
import { CategoryGrid } from "@/components/category-grid";
import { LatestGrid } from "@/components/latest-grid";
import { mockSimulations } from "@/lib/mock-data";

export default function HomePage() {
  const trending = mockSimulations.slice(0, 6);

  return (
    <div className="flex flex-1 flex-col">
      <DNAHeroShell />
      <DeepDiveSection />
      <div className="flex flex-col gap-24 pb-24 pt-16 lg:gap-32 lg:pb-32 lg:pt-24">
        <TrendingRow simulations={trending} />
        <CategoryGrid />
        <LatestGrid simulations={mockSimulations} />
      </div>
    </div>
  );
}
