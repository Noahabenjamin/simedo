import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { confirmVerificationToken } from "@/lib/verification-actions";

export const metadata = { title: "Verifying" };

type SearchParams = Promise<{ token?: string }>;

export default async function VerifyCallbackPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { token } = await searchParams;
  const result = await confirmVerificationToken(token ?? "");

  if (result.ok) {
    redirect("/upload?verified=1");
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16 sm:px-6 lg:py-24">
      <div className="rounded-2xl border border-border bg-card p-8">
        <div className="flex flex-col gap-4">
          <ShieldAlert className="size-7 text-amber-500" strokeWidth={1.5} />
          <h1 className="text-2xl font-medium tracking-[-0.02em] text-foreground">
            We couldn&apos;t verify this link.
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {result.reason}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/verify-institution"
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
            >
              Start over
              <ArrowRight className="size-3.5" />
            </Link>
            <Link
              href="/browse"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Browse simulations
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
