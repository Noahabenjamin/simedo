/* eslint-disable @next/next/no-img-element */

// Cytosine (C4H5N3O) — pyrimidine base.
// Public-domain SVG from Wikimedia Commons:
//   https://commons.wikimedia.org/wiki/File:Cytosine_structure_2022.svg

export function CytosineSVG({ className }: { className?: string }) {
  return (
    <img
      src="/chemistry/cytosine.svg"
      alt="Cytosine chemical structure"
      width={104}
      height={88}
      className={className}
      style={{ display: "block", width: "100%", height: "auto" }}
    />
  );
}
