import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthFormError } from "@/components/auth/auth-form-error";
import { ConfigureSupabase } from "@/components/auth/configure-supabase";
import { Input } from "@/components/ui/input";
import { signInWithGoogle, signUp } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { isDbAvailable } from "@/lib/data/db-available";

type SearchParams = Promise<{ redirect?: string; error?: string }>;

export default async function SignupPage({
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

  // signUp action handles its own success/error redirects internally.

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Share simulations. Discuss the science. Learn from the community."
      footer={
        <span>
          Already have an account?{" "}
          <Link
            href={`/sign-in?redirect=${encodeURIComponent(redirectTo)}`}
            className="text-foreground transition-colors hover:text-primary"
          >
            Sign in
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
            Continue with Google
          </button>
        </form>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span>or with email</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <form action={signUp} className="flex flex-col gap-3">
          <input type="hidden" name="redirect" value={redirectTo} />

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">
              Display name
            </span>
            <Input name="display_name" required className="h-11" />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Username</span>
            <Input
              name="username"
              required
              pattern="[a-z0-9_]{2,32}"
              placeholder="e.g. miraokafor"
              className="h-11 font-mono"
            />
            <span className="text-[11px] text-muted-foreground">
              Lowercase letters, numbers, and underscores. Your profile lives at
              <span className="font-mono"> /u/[username]</span>.
            </span>
          </label>

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

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Password</span>
            <Input
              type="password"
              name="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="h-11"
            />
            <span className="text-[11px] text-muted-foreground">
              At least 8 characters.
            </span>
          </label>

          <AuthFormError message={params.error} />

          <button
            type="submit"
            className="mt-2 h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Create account
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
