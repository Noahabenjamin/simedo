import { NextRequest } from "next/server";
import { getSimulation } from "@/lib/data/simulations";
import { bundleSources, getContextBundle } from "@/lib/ai/context-bundle";

// Returns the sources list for a simulation. The AI sidebar shows these
// even before the user asks anything — they make the grounding contract visible.

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("simulationId");
  if (!id) return new Response("Missing simulationId", { status: 400 });

  const sim = await getSimulation(id);
  if (!sim) return new Response("Simulation not found", { status: 404 });

  const bundle = await getContextBundle(sim);
  const sources = bundleSources(bundle);
  return new Response(JSON.stringify({ sources }), {
    headers: { "Content-Type": "application/json" },
  });
}
