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
      return "AlphaFold prediction";
    case "alphafold3":
      return "AlphaFold 3 multimer prediction";
    case "rosetta":
      return "Rosetta prediction";
    case "other-prediction":
      return "Computational prediction";
    default:
      return "";
  }
}

export function confidenceLabel(source: StructureSource): string {
  if (source === "alphafold3") return "ipTM";
  if (source.startsWith("alphafold")) return "Mean pLDDT";
  return "Confidence";
}

// Plain-language explanation shown as a native browser tooltip on hover.
// Short enough to be readable in the small <abbr> popup.
export function confidenceTooltip(source: StructureSource): string {
  if (source === "alphafold3") {
    return "ipTM (interface predicted TM-score) measures how confident AlphaFold 3 is in the geometry of the interface between chains in this complex. 0.8 and above means the interface is reliable; below 0.6 suggests the chains may not really interact this way.";
  }
  if (source.startsWith("alphafold")) {
    return "Mean pLDDT (predicted Local Distance Difference Test) is AlphaFold's per-residue confidence, averaged across the structure. 90+ is very high confidence, 70 to 90 is confident, 50 to 70 is low, and below 50 is very low — often a sign of intrinsic disorder rather than a wrong prediction.";
  }
  return "Confidence score reported by the prediction method.";
}

// ipTM is on a 0-1 scale, pLDDT on a 0-100 scale. Format accordingly.
export function formatConfidence(
  source: StructureSource,
  value: number,
): string {
  if (source === "alphafold3") return value.toFixed(2);
  return value.toFixed(1);
}
