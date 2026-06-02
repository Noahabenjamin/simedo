import { NextRequest } from "next/server";
import { getSimulation } from "@/lib/data/simulations";
import { bundleSources, getContextBundle } from "@/lib/ai/context-bundle";

// Returns the sources list for a simulation along with an `aiEnabled` flag
// that reflects whether ANTHROPIC_API_KEY is configured. The sidebar uses
// the flag to either auto-summary the simulation or show a clear empty
// state instead of pretending the AI works.

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("simulationId");
  if (!id) return new Response("Missing simulationId", { status: 400 });

  const sim = await getSimulation(id);
  if (!sim) return new Response("Simulation not found", { status: 404 });

  const aiEnabled = !!process.env.ANTHROPIC_API_KEY;
  const bundle = await getContextBundle(sim);
  const sources = bundleSources(bundle);

  return new Response(JSON.stringify({ sources, aiEnabled }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "private, max-age=60",
    },
  });
}
