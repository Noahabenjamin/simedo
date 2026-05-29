import { Hero } from "@/components/hero/hero";
import { TrendingRow } from "@/components/trending-row";
import { CategoryGrid } from "@/components/category-grid";
import { LatestGrid } from "@/components/latest-grid";
import { mockSimulations } from "@/lib/mock-data";

export default function HomePage() {
  const trending = mockSimulations.slice(0, 6);

  return (
    <div className="flex flex-1 flex-col gap-24 pb-24 lg:gap-32 lg:pb-32">
      <Hero />
      <TrendingRow simulations={trending} />
      <CategoryGrid />
      <LatestGrid simulations={mockSimulations} />
    </div>
  );
}
