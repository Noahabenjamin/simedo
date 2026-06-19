import type { NextRequest } from "next/server";
import { getStripe } from "@/lib/donate/stripe";

export const runtime = "nodejs";

// Creates a Stripe Checkout session for a donation in EUR and returns
// the hosted Checkout URL. The client redirects to it.

const MIN_EUR = 1;
const MAX_EUR = 1000;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const amount = Number((body as { amount?: unknown })?.amount);
  if (!Number.isFinite(amount) || amount < MIN_EUR || amount > MAX_EUR) {
    return json(
      { error: `Amount must be between €${MIN_EUR} and €${MAX_EUR}.` },
      400,
    );
  }

  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Donation to Simedo",
              description: "Helps cover hosting, domain, and AI costs.",
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      submit_type: "donate",
      success_url: `${origin}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/donate/cancel`,
    });

    if (!session.url) {
      return json({ error: "Stripe did not return a checkout URL." }, 500);
    }
    return json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    return json({ error: message }, 500);
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
