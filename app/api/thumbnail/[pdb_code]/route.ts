import type { NextRequest } from "next/server";

// Real protein thumbnails. Primary source: RCSB's published assembly-1 JPEG
// at https://cdn.rcsb.org/images/structures/<lower>_assembly-1.jpeg.
// Fallback: a clean, palette-matched SVG with the PDB code — never placehold.co.
//
// Cached for a day on the edge; the underlying RCSB images change rarely.

export const revalidate = 86400;

const RCSB_BASE = "https://cdn.rcsb.org/images/structures";

const VALID_CODE = /^[a-z0-9]{4}$/;

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ pdb_code: string }> },
) {
  const { pdb_code } = await ctx.params;
  const code = pdb_code.toLowerCase();

  if (!VALID_CODE.test(code)) {
    return new Response("invalid pdb code", { status: 400 });
  }

  const rcsbUrl = `${RCSB_BASE}/${code}_assembly-1.jpeg`;

  try {
    const res = await fetch(rcsbUrl, { next: { revalidate: 86400 } });
    if (res.ok) {
      const headers = new Headers({
        "content-type": res.headers.get("content-type") ?? "image/jpeg",
        "cache-control":
          "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      });
      return new Response(res.body, { status: 200, headers });
    }
  } catch {
    // fall through to SVG fallback below
  }

  const svg = fallbackSvg(code.toUpperCase());
  return new Response(svg, {
    status: 200,
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control":
        "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

function fallbackSvg(pdb: string): string {
  // Conservative encoding: the PDB code is /^[a-z0-9]{4}$/, so it's safe to
  // drop straight into the SVG without further escaping.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" role="img" aria-label="${pdb} structure thumbnail">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0a1437"/>
      <stop offset="1" stop-color="#050b22"/>
    </linearGradient>
    <linearGradient id="code" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#93c5fd"/>
      <stop offset="1" stop-color="#1e40af"/>
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#3b82f6" stop-opacity="0.25"/>
      <stop offset="1" stop-color="#3b82f6" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="800" height="450" fill="url(#bg)"/>
  <circle cx="400" cy="225" r="220" fill="url(#halo)"/>
  <text x="400" y="252" text-anchor="middle"
        font-family="ui-monospace,SFMono-Regular,Menlo,monospace"
        font-size="148" font-weight="600" fill="url(#code)"
        letter-spacing="6">${pdb}</text>
  <text x="400" y="310" text-anchor="middle"
        font-family="ui-sans-serif,system-ui,-apple-system,sans-serif"
        font-size="20" fill="#64748b"
        letter-spacing="6">PDB STRUCTURE</text>
</svg>`;
}
