"use client";

import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";

type Props = {
  email: string;
};

// Opens the user's mail client with a pre-filled "Verification request"
// template, then forwards them to a soft confirmation page so they have
// somewhere to land when they come back from composing.

const REVIEW_ADDRESS = "verify@simedo.work";

function buildMailto(email: string): string {
  const subject = `Verification request — ${email}`;
  const body = `Hi Simedo team,

I'd like to request manual verification for uploads.

Email: ${email}
Name:
Institution / Affiliation:
Field of research:
Link to publications, lab page, ORCID, or LinkedIn:
Brief description of the simulations I'd like to share:

Thanks!`;
  const params = new URLSearchParams({ subject, body });
  return `mailto:${REVIEW_ADDRESS}?${params.toString()}`;
}

export function ManualReviewButton({ email }: Props) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        window.location.href = buildMailto(email);
        // Give the mail client a beat to open before we navigate, so the
        // user has something to come back to.
        setTimeout(() => {
          router.push("/verify-institution/manual-review");
        }, 600);
      }}
      className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
    >
      <Mail className="size-3.5" />
      Request manual review
    </button>
  );
}
