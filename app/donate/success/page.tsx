import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = { title: "Thanks for donating" };

export default function DonateSuccessPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 px-4 py-24 text-center">
      <div className="flex size-12 items-center justify-center rounded-full border border-primary/30 bg-primary/5">
        <span className="size-3 rounded-full bg-primary" />
      </div>
      <h1 className="text-2xl font-medium tracking-[-0.02em] text-foreground sm:text-3xl">
        Thank you
      </h1>
      <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
        Your donation helps keep Simedo open and ad-free. The funding progress
        bar will update once Stripe confirms the payment.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-foreground/30"
      >
        Back to Simedo
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
