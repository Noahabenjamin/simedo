/* eslint-disable @next/next/no-img-element */

// Guanine (C5H5N5O) — purine base.
// Public-domain SVG from Wikimedia Commons:
//   https://commons.wikimedia.org/wiki/File:Guanin.svg

export function GuanineSVG({ className }: { className?: string }) {
  return (
    <img
      src="/chemistry/guanine.svg"
      alt="Guanine chemical structure"
      width={104}
      height={104}
      className={className}
      style={{ display: "block", width: "100%", height: "auto" }}
    />
  );
}
