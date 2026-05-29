import type { MetadataRoute } from "next";
import { listSimulations, getAllFamilies } from "@/lib/data/simulations";
import { familySlug } from "@/lib/browse-filters";

// Auto-generated sitemap.
// - Includes all public simulations (private + unlisted are excluded by RLS).
// - Includes all family pages we can derive from the data.
// - Static marketing pages too.

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://simedo.work";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/browse",
    "/about",
    "/privacy",
    "/terms",
    "/guidelines",
    "/contact",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "" ? 1.0 : 0.6,
  }));

  const sims = await listSimulations();
  const simRoutes: MetadataRoute.Sitemap = sims.map((s) => ({
    url: `${siteUrl}/simulation/${s.id}`,
    lastModified: new Date(s.createdAt),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const families = await getAllFamilies();
  const familyRoutes: MetadataRoute.Sitemap = families.map((f) => ({
    url: `${siteUrl}/family/${familySlug(f)}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...simRoutes, ...familyRoutes];
}
