// Thymine (C5H6N2O2) — pyrimidine.
// TODO(launch): swap for https://commons.wikimedia.org/wiki/File:Thymin.svg

export function ThymineSVG({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 110 80"
      fill="none"
      stroke="#67E8F9"
      strokeWidth="1.4"
      strokeLinejoin="round"
      strokeLinecap="round"
      className={className}
      aria-label="Thymine"
    >
      <path d="M 50 14 L 32 24 L 32 46 L 50 56 L 68 46 L 68 24 Z" />
      <path d="M 36 28 L 36 42" />
      <text x="46" y="11" fontSize="7" stroke="none" fill="#67E8F9">N</text>
      <text x="22" y="48" fontSize="7" stroke="none" fill="#67E8F9">N</text>
      <line x1="32" y1="24" x2="20" y2="18" />
      <text x="6" y="16" fontSize="7" stroke="none" fill="#67E8F9">O</text>
      <line x1="50" y1="56" x2="50" y2="68" />
      <text x="44" y="76" fontSize="7" stroke="none" fill="#67E8F9">O</text>
      <line x1="68" y1="46" x2="82" y2="54" />
      <text x="82" y="62" fontSize="7" stroke="none" fill="#67E8F9">CH₃</text>
      <line x1="50" y1="14" x2="62" y2="6" strokeDasharray="2 2" />
    </svg>
  );
}
