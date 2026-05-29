// Large, clean A-T base pair illustration used in the deep-dive section.
// Adenine on the left, thymine on the right, joined by 2 hydrogen bonds.
// Atom-labeled, scientific illustration style.
// TODO(launch): replace with a polished SVG; this is hand-authored.

type Props = { className?: string };

export function AtBasePairSVG({ className }: Props) {
  return (
    <svg
      viewBox="0 0 460 260"
      fill="none"
      stroke="#0F172A"
      strokeWidth="1.6"
      strokeLinejoin="round"
      strokeLinecap="round"
      className={className}
      aria-label="Adenine–thymine base pair"
    >
      {/* ---- ADENINE (left) ---- */}
      <g transform="translate(20, 60)">
        {/* 6-ring */}
        <path d="M 60 20 L 100 36 L 100 80 L 60 96 L 20 80 L 20 36 Z" />
        {/* 5-ring */}
        <path d="M 100 36 L 140 28 L 150 58 L 140 88 L 100 80" />
        {/* aromaticity */}
        <path d="M 28 44 L 50 54" />
        <path d="M 60 30 L 92 42" />
        <path d="M 92 74 L 60 86" />
        {/* labels */}
        <text x="0" y="42" fontSize="11" stroke="none" fill="#0F172A">N1</text>
        <text x="0" y="86" fontSize="11" stroke="none" fill="#0F172A">N3</text>
        <text x="143" y="22" fontSize="11" stroke="none" fill="#0F172A">N7</text>
        <text x="143" y="94" fontSize="11" stroke="none" fill="#0F172A">N9</text>
        <text x="58" y="14" fontSize="11" stroke="none" fill="#0F172A">C6</text>
        {/* NH2 on C6 */}
        <line x1="60" y1="20" x2="60" y2="4" />
        <text x="48" y="-3" fontSize="11" stroke="none" fill="#0F172A">NH₂</text>
        {/* glycosidic to sugar */}
        <line x1="150" y1="58" x2="170" y2="58" strokeDasharray="4 3" />
        <text x="170" y="62" fontSize="10" stroke="none" fill="#64748B">to sugar</text>
        <text x="60" y="120" fontSize="13" stroke="none" fill="#0F172A" textAnchor="middle" fontWeight="500">Adenine</text>
      </g>

      {/* ---- HYDROGEN BONDS ---- */}
      <g transform="translate(0, 0)" stroke="#0EA5E9" strokeDasharray="3 3" strokeWidth="1.2">
        <line x1="190" y1="100" x2="240" y2="100" />
        <line x1="190" y1="140" x2="240" y2="140" />
      </g>
      <text x="215" y="80" fontSize="10" textAnchor="middle" stroke="none" fill="#0284C7">2 H-bonds</text>

      {/* ---- THYMINE (right) ---- */}
      <g transform="translate(250, 60)">
        {/* 6-ring */}
        <path d="M 60 12 L 20 28 L 20 76 L 60 92 L 100 76 L 100 28 Z" />
        <path d="M 28 36 L 28 68" />
        {/* labels */}
        <text x="56" y="9" fontSize="11" stroke="none" fill="#0F172A">N1</text>
        <text x="0" y="80" fontSize="11" stroke="none" fill="#0F172A">N3</text>
        {/* C2=O */}
        <line x1="20" y1="28" x2="4" y2="20" />
        <text x="-12" y="20" fontSize="11" stroke="none" fill="#0F172A">O</text>
        {/* C4=O */}
        <line x1="60" y1="92" x2="60" y2="110" />
        <text x="54" y="120" fontSize="11" stroke="none" fill="#0F172A">O</text>
        {/* CH3 on C5 */}
        <line x1="100" y1="76" x2="118" y2="86" />
        <text x="120" y="94" fontSize="11" stroke="none" fill="#0F172A">CH₃</text>
        {/* glycosidic */}
        <line x1="60" y1="12" x2="60" y2="-4" strokeDasharray="4 3" />
        <text x="64" y="-8" fontSize="10" stroke="none" fill="#64748B">to sugar</text>
        <text x="60" y="140" fontSize="13" stroke="none" fill="#0F172A" textAnchor="middle" fontWeight="500">Thymine</text>
      </g>
    </svg>
  );
}
