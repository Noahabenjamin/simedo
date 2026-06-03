import { ImageResponse } from "next/og";
import { getSimulation } from "@/lib/data/simulations";

// Per-simulation Open Graph preview image. 1200x630, brand-neutral, no shadows.
// Cached via Next's response cache on the route.

export const runtime = "nodejs";
export const revalidate = 3600;

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const sim = await getSimulation(id);

  const title = sim?.title ?? "Simedo";
  const pdbCode = sim?.pdbCode ?? "";
  const author = sim?.author?.name ?? "Simedo";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          backgroundColor: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "999px",
              backgroundColor: "#0A7C5C",
            }}
          />
          <div style={{ fontSize: "22px", fontWeight: 500, color: "#0A0A0A" }}>
            Simedo
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {pdbCode && (
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "20px",
                color: "#0A7C5C",
                letterSpacing: "0.08em",
              }}
            >
              {pdbCode}
            </div>
          )}
          <div
            style={{
              fontSize: "72px",
              fontWeight: 500,
              color: "#0A0A0A",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              maxWidth: "1000px",
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: "24px", color: "#525252" }}>
            by {author}
          </div>
        </div>

        <div
          style={{
            fontSize: "16px",
            color: "#A3A3A3",
            display: "flex",
            justifyContent: "space-between",
            borderTop: "1px solid #EAEAEA",
            paddingTop: "16px",
          }}
        >
          <span>simedo.work</span>
          <span>See molecules in motion</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
