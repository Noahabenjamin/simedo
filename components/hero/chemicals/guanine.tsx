// Guanine (C5H5N5O) — purine.
// TODO(launch): swap for https://commons.wikimedia.org/wiki/File:Guanin.svg

export function GuanineSVG({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 110 80"
      fill="none"
      stroke="#67E8F9"
      strokeWidth="1.4"
      strokeLinejoin="round"
      strokeLinecap="round"
      className={className}
      aria-label="Guanine"
    >
      {/* 6-ring */}
      <path d="M 38 18 L 55 26 L 55 48 L 38 56 L 22 48 L 22 26 Z" />
      {/* 5-ring */}
      <path d="M 55 26 L 72 22 L 80 38 L 72 54 L 55 48" />
      {/* Aromaticity accents */}
      <path d="M 26 30 L 36 35" />
      <path d="M 51 44 L 38 51" />
      {/* C6=O */}
      <line x1="38" y1="18" x2="38" y2="8" />
      <text x="34" y="6" fontSize="7" stroke="none" fill="#67E8F9">O</text>
      {/* C2-NH2 */}
      <line x1="22" y1="48" x2="10" y2="56" />
      <text x="0" y="64" fontSize="7" stroke="none" fill="#67E8F9">NH₂</text>
      {/* Heteroatom labels */}
      <text x="14" y="32" fontSize="7" stroke="none" fill="#67E8F9">N</text>
      <text x="72" y="18" fontSize="7" stroke="none" fill="#67E8F9">N</text>
      <text x="72" y="62" fontSize="7" stroke="none" fill="#67E8F9">N</text>
      {/* N1-H */}
      <text x="40" y="60" fontSize="7" stroke="none" fill="#67E8F9">N</text>
      {/* Glycosidic stub */}
      <line x1="80" y1="38" x2="92" y2="38" strokeDasharray="2 2" />
    </svg>
  );
}
