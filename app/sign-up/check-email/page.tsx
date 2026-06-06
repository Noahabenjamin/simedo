import Link from "next/link";
import { Mail } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ContactFooter } from "@/components/auth/contact-footer";
import { ResendConfirmationButton } from "@/components/auth/resend-confirmation-button";

export const metadata = {
  title: "Check your inbox",
};

type SearchParams = Promise<{ email?: string }>;

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { email } = await searchParams;
  const trimmed = email?.trim() ?? "";

  return (
    <AuthLayout
      title="Check your inbox"
      subtitle={
        trimmed
          ? "We sent a confirmation link to the address below. Click it to activate your account, then come back here to sign in."
          : "Check the inbox of the email you signed up with. We sent a confirmation link — click it to activate your account."
      }
      footer={<ContactFooter />}
    >
      <div className="flex flex-col gap-6">
        {trimmed && (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
            <Mail className="size-4 text-primary" strokeWidth={1.5} />
            <span className="font-mono text-sm text-foreground">{trimmed}</span>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <ResendConfirmationButton email={trimmed} variant="primary" />
          <span className="text-[11px] text-muted-foreground">
            Don&apos;t see the email? Check your spam folder. The link
            expires in 24 hours.
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <Link
            href="/sign-up"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Wrong email? Sign up again
          </Link>
          <span className="text-muted-foreground/50">·</span>
          <Link
            href="/sign-in"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Already confirmed? Sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
