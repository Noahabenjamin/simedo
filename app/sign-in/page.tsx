import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthFormError } from "@/components/auth/auth-form-error";
import { ConfigureSupabase } from "@/components/auth/configure-supabase";
import { Input } from "@/components/ui/input";
import { signInWithGoogle, signInWithPassword } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { isDbAvailable } from "@/lib/data/db-available";
import { ResendConfirmationButton } from "@/components/auth/resend-confirmation-button";
import { Mail } from "lucide-react";

void redirect;

type SearchParams = Promise<{
  redirect?: string;
  error?: string;
  unconfirmed?: string;
  email?: string;
}>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const redirectTo = params.redirect ?? "/";

  if (!isDbAvailable()) return <ConfigureSupabase />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(redirectTo);

  // signInWithPassword handles both success (redirect) and failure
  // (redirect with ?error=...) internally.

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back."
      footer={
        <span>
          Don&apos;t have an account?{" "}
          <Link
            href={`/sign-up?redirect=${encodeURIComponent(redirectTo)}`}
            className="text-foreground transition-colors hover:text-primary"
          >
            Create one
          </Link>
        </span>
      }
    >
      <div className="flex flex-col gap-4">
        <form action={signInWithGoogle}>
          <input type="hidden" name="redirect" value={redirectTo} />
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-md border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-foreground/30"
          >
            <GoogleMark />
            Continue with Google
          </button>
        </form>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span>or with email</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <form action={signInWithPassword} className="flex flex-col gap-3">
          <input type="hidden" name="redirect" value={redirectTo} />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Email</span>
            <Input
              type="email"
              name="email"
              required
              autoComplete="email"
              defaultValue={params.email ?? ""}
              className="h-11"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Password</span>
            <Input
              type="password"
              name="password"
              required
              minLength={8}
              autoComplete="current-password"
              className="h-11"
            />
          </label>

          {params.unconfirmed === "1" ? (
            <UnconfirmedNotice email={params.email ?? ""} />
          ) : (
            <AuthFormError message={params.error} />
          )}

          <button
            type="submit"
            className="mt-2 h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Sign in
          </button>

          <Link
            href="/forgot-password"
            className="text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Forgot password?
          </Link>
        </form>
      </div>
    </AuthLayout>
  );
}

function UnconfirmedNotice({ email }: { email: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-amber-700 dark:text-amber-300">
      <div className="flex items-start gap-2 text-sm leading-relaxed">
        <Mail className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} />
        <span>
          Your email isn&apos;t confirmed yet. Check your inbox for the
          confirmation link we sent when you signed up — or resend it below.
        </span>
      </div>
      <ResendConfirmationButton email={email} variant="ghost" />
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.07.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
