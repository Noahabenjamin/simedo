import { getRaisedEur } from "@/lib/donate/stripe";

export const runtime = "nodejs";
// Always re-fetch — donations can land at any time.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const raised = await getRaisedEur();
    return json({ raised });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    return json({ raised: 0, error: message }, 500);
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
