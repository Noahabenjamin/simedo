import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ContactFooter } from "@/components/auth/contact-footer";
import { ResendFromInput } from "@/components/auth/resend-from-input";

export const metadata = {
  title: "Confirmation link expired — Simedo",
};

type SearchParams = Promise<{ email?: string; reason?: string }>;

export default async function CallbackErrorPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { email, reason } = await searchParams;
  const trimmed = email?.trim() ?? "";

  return (
    <AuthLayout
      title="This confirmation link has expired or is invalid."
      subtitle="Sign up again or request a new link below."
      footer={<ContactFooter />}
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-amber-700 dark:text-amber-300">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} />
          <span className="text-sm leading-relaxed">
            {reason ?? "We couldn't verify the link in your email."}
          </span>
        </div>

        <ResendFromInput defaultEmail={trimmed} />

        <div className="flex items-center gap-3 text-sm">
          <Link
            href="/sign-up"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Start over with a new account
          </Link>
          <span className="text-muted-foreground/50">·</span>
          <Link
            href="/sign-in"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
