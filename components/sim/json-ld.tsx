import type { Simulation } from "@/types";

// JSON-LD structured data marking the simulation as a scientific Dataset.
// Google Scholar indexes structured Dataset markup and surfaces these
// entries in search alongside papers.

type Props = {
  simulation: Simulation;
  url: string;
};

export function SimulationJsonLd({ simulation, url }: Props) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: simulation.title,
    description: simulation.description,
    url,
    identifier: simulation.pdbCode || simulation.id,
    creator: {
      "@type": "Person",
      name: simulation.author.name,
      url: `${origin(url)}/u/${simulation.author.username}`,
    },
    datePublished: simulation.createdAt,
    license: "https://creativecommons.org/licenses/by/4.0/",
    keywords: [
      simulation.category,
      simulation.proteinFamily,
      simulation.organism,
      simulation.experimentType,
      ...simulation.tags,
    ]
      .filter(Boolean)
      .join(", "),
    measurementTechnique: simulation.experimentType,
    isAccessibleForFree: true,
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

function origin(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return url.split("/simulation/")[0] ?? "";
  }
}
