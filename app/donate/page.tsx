import type { Metadata } from "next";
import { COST_ITEMS, GOAL_EUR, formatEuro } from "@/lib/donate/costs";
import { getRaisedEur } from "@/lib/donate/stripe";
import { DonateForm } from "./donate-form";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Support Simedo",
  description:
    "Help cover the running costs of an open platform for molecular dynamics simulations.",
};

export default async function DonatePage() {
  // Pull raised total from Stripe. If the key isn't set yet, we just show
  // €0 instead of crashing the page — the rest of the UI still reads.
  let raised = 0;
  let stripeError: string | null = null;
  try {
    raised = await getRaisedEur();
  } catch (err) {
    stripeError = err instanceof Error ? err.message : "Stripe error";
  }

  const pct = Math.min(100, Math.round((raised / GOAL_EUR) * 100));

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 sm:py-16 lg:py-24">
      <header className="flex flex-col gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Support Simedo
        </p>
        <h1 className="text-3xl font-medium tracking-[-0.02em] text-foreground sm:text-4xl">
          Help keep Simedo free
        </h1>
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground sm:text-base">
          I&apos;m a solo developer running Simedo on my own time. There are
          no ads, no paywalls, and no plans for either. A small one-off
          donation covers the running costs and keeps the lights on for the
          next stretch.
        </p>
      </header>

      <section className="mt-12 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="flex items-baseline justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-medium tabular-nums tracking-tight text-foreground sm:text-4xl">
              {formatEuro(raised)}
            </span>
            <span className="text-sm text-muted-foreground">
              of {formatEuro(GOAL_EUR)}
            </span>
          </div>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {pct}%
          </span>
        </div>

        <div
          className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={GOAL_EUR}
          aria-valuenow={raised}
          aria-label="Funding progress"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>

        <ul className="mt-8 flex flex-col divide-y divide-border">
          {COST_ITEMS.map((item) => (
            <li
              key={item.id}
              className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-foreground">
                  {item.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {item.detail}
                </span>
              </div>
              <span className="shrink-0 font-mono text-sm tabular-nums text-foreground">
                {formatEuro(item.amount)}
              </span>
            </li>
          ))}
          <li className="flex items-baseline justify-between gap-4 pt-4">
            <span className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Total
            </span>
            <span className="font-mono text-sm font-medium tabular-nums text-foreground">
              {formatEuro(GOAL_EUR)}
            </span>
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <DonateForm />
      </section>

      <footer className="mt-10 flex flex-col gap-2 text-xs text-muted-foreground">
        <p>
          Payments are processed by Stripe. We never see your card details.
        </p>
        {stripeError && (
          <p className="font-mono text-[11px] text-muted-foreground/70">
            Progress unavailable: {stripeError}
          </p>
        )}
      </footer>
    </div>
  );
}
