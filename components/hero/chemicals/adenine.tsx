// Adenine (C5H5N5) — purine.
// Hand-authored credible illustration; not pixel-perfect IUPAC.
// TODO(launch): swap for https://commons.wikimedia.org/wiki/File:Adenine.svg

export function AdenineSVG({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 110 80"
      fill="none"
      stroke="#67E8F9"
      strokeWidth="1.4"
      strokeLinejoin="round"
      strokeLinecap="round"
      className={className}
      aria-label="Adenine"
    >
      <path d="M 38 18 L 55 26 L 55 48 L 38 56 L 22 48 L 22 26 Z" />
      <path d="M 55 26 L 72 22 L 80 38 L 72 54 L 55 48" />
      <path d="M 26 30 L 36 35" />
      <path d="M 38 22 L 50 28" />
      <path d="M 51 44 L 38 51" />
      <line x1="38" y1="18" x2="38" y2="8" />
      <text x="29" y="6" fontSize="7" stroke="none" fill="#67E8F9">NH₂</text>
      <text x="14" y="30" fontSize="7" stroke="none" fill="#67E8F9">N</text>
      <text x="14" y="50" fontSize="7" stroke="none" fill="#67E8F9">N</text>
      <text x="72" y="18" fontSize="7" stroke="none" fill="#67E8F9">N</text>
      <text x="72" y="62" fontSize="7" stroke="none" fill="#67E8F9">N</text>
      <line x1="80" y1="38" x2="92" y2="38" strokeDasharray="2 2" />
    </svg>
  );
}
