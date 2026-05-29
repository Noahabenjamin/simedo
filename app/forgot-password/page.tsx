import Link from "next/link";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthFormError } from "@/components/auth/auth-form-error";
import { ConfigureSupabase } from "@/components/auth/configure-supabase";
import { Input } from "@/components/ui/input";
import { requestPasswordReset } from "@/lib/auth/actions";
import { isDbAvailable } from "@/lib/data/db-available";

type SearchParams = Promise<{ error?: string; sent?: string }>;

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  if (!isDbAvailable()) return <ConfigureSupabase />;

  // requestPasswordReset handles its own redirects.

  if (params.sent) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="If we have an account for that address, you'll get a reset link shortly."
        footer={
          <Link
            href="/login"
            className="text-foreground transition-colors hover:text-primary"
          >
            Back to sign in
          </Link>
        }
      >
        <div />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll email you a link."
      footer={
        <Link
          href="/login"
          className="text-foreground transition-colors hover:text-primary"
        >
          Back to sign in
        </Link>
      }
    >
      <form action={requestPasswordReset} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Email</span>
          <Input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="h-11"
          />
        </label>
        <AuthFormError message={params.error} />
        <button
          type="submit"
          className="mt-2 h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Send reset link
        </button>
      </form>
    </AuthLayout>
  );
}
