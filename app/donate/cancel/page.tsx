import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Donation cancelled" };

export default function DonateCancelPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 px-4 py-24 text-center">
      <h1 className="text-2xl font-medium tracking-[-0.02em] text-foreground sm:text-3xl">
        No worries
      </h1>
      <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
        Your card wasn&apos;t charged. If you changed your mind or had an
        issue, you can try again any time.
      </p>
      <Link
        href="/donate"
        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Back to donate page
      </Link>
    </div>
  );
}
