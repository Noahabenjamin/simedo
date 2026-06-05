import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";

export const metadata = {
  title: "Manual review requested — Simedo",
  description:
    "We received your manual-review request. We'll follow up within 2–3 days.",
};

export default function ManualReviewConfirmation() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16 sm:px-6 lg:py-24">
      <div className="rounded-2xl border border-border bg-card p-8">
        <div className="flex flex-col gap-4">
          <Mail className="size-7 text-primary" strokeWidth={1.5} />
          <h1 className="text-2xl font-medium tracking-[-0.02em] text-foreground">
            Thanks — your request is in.
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We&apos;ll follow up at the email you used to sign up, usually
            within 2–3 days. In the meantime, you can browse and use the AI
            features freely.
          </p>
          <p className="text-xs text-muted-foreground">
            Didn&apos;t see the email composer open? You can reach us
            directly at{" "}
            <a
              href="mailto:verify@simedo.work"
              className="text-foreground underline-offset-2 hover:underline"
            >
              verify@simedo.work
            </a>
            .
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/browse"
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
            >
              Browse simulations
              <ArrowRight className="size-3.5" />
            </Link>
            <Link
              href="/"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
