/* eslint-disable @next/next/no-img-element */

// Thymine (C5H6N2O2) — pyrimidine base.
// Public-domain SVG from Wikimedia Commons:
//   https://commons.wikimedia.org/wiki/File:Thymin.svg

export function ThymineSVG({ className }: { className?: string }) {
  return (
    <img
      src="/chemistry/thymine.svg"
      alt="Thymine chemical structure"
      width={104}
      height={88}
      className={className}
      style={{ display: "block", width: "100%", height: "auto" }}
    />
  );
}
