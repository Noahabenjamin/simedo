/* eslint-disable @next/next/no-img-element */

// Adenine (C5H5N5) — purine base.
// Public-domain SVG from Wikimedia Commons:
//   https://commons.wikimedia.org/wiki/File:Adenine_numbered.svg
// Served from /public/chemistry/adenine.svg so we don't ship a custom
// rendering of a structure whose authority comes from being widely
// recognized.

export function AdenineSVG({ className }: { className?: string }) {
  return (
    <img
      src="/chemistry/adenine.svg"
      alt="Adenine chemical structure"
      width={104}
      height={104}
      className={className}
      style={{ display: "block", width: "100%", height: "auto" }}
    />
  );
}
