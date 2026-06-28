import type { StructureSource } from "@/types";

export function isPrediction(source: StructureSource): boolean {
  return (
    source.startsWith("alphafold") ||
    source === "rosetta" ||
    source === "other-prediction"
  );
}

export function predictionBadgeLabel(source: StructureSource): string {
  switch (source) {
    case "alphafold2":
      return "AlphaFold 2 prediction";
    case "alphafold-multimer":
      return "AlphaFold Multimer prediction";
    case "alphafold3":
      return "AlphaFold 3 prediction";
    case "rosetta":
      return "Rosetta prediction";
    case "other-prediction":
      return "Computational prediction";
    default:
      return "";
  }
}

// Bucket the score into AlphaFold's canonical confidence bands. Used in
// the badge tooltip so the number gets a plain-language qualifier.
export function plddtBucket(plddt: number): "Very low" | "Low" | "Confident" | "Very high" {
  if (plddt >= 90) return "Very high";
  if (plddt >= 70) return "Confident";
  if (plddt >= 50) return "Low";
  return "Very low";
}

// Plain-language explanation shown as a native browser tooltip on hover.
// Includes the entry's own score + bucket so the user gets the
// interpretation without leaving the tooltip.
export function plddtTooltip(plddt: number | null): string {
  const base =
    "pLDDT measures AlphaFold's confidence in the predicted structure. " +
    "Above 90 is very high, 70-90 is confident, 50-70 is low, below 50 is very low.";
  if (plddt === null) return base;
  return `${base} This entry: ${plddt.toFixed(1)} (${plddtBucket(plddt)}).`;
}
