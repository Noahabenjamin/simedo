import Stripe from "stripe";

// Lazy singleton — we don't want to crash importers (e.g. during build
// when env isn't loaded) just because the key isn't there yet. Callers
// invoke getStripe() at request time.

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to .env.local — test keys live at https://dashboard.stripe.com/test/apikeys",
    );
  }
  cached = new Stripe(key);
  return cached;
}

// Sum of all confirmed (paid) Checkout sessions in EUR. We page through
// up to 100 sessions and stop when we hit a cursor we've already seen
// (Stripe's auto_pagination handles that internally).
export async function getRaisedEur(): Promise<number> {
  const stripe = getStripe();
  let total = 0;
  for await (const session of stripe.checkout.sessions.list({
    limit: 100,
    expand: ["data.payment_intent"],
  })) {
    if (session.payment_status !== "paid") continue;
    if (session.currency !== "eur") continue;
    total += (session.amount_total ?? 0) / 100;
  }
  return total;
}
