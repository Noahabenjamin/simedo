import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck, Mail, ArrowLeft } from "lucide-react";
import { AuthFormError } from "@/components/auth/auth-form-error";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { isDbAvailable } from "@/lib/data/db-available";
import { verifyInstitution } from "@/lib/verification-actions";

export const metadata = {
  title: "Verify your institution",
  description: "Verify your academic email to upload simulations to Simedo.",
};

type SearchParams = Promise<{ error?: string; sent?: string }>;

export default async function VerifyInstitutionPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const sent = params.sent;

  if (!isDbAvailable()) {
    return (
      <UnavailableShell title="Database is not configured" />
    );
  }
  if (!process.env.RESEND_API_KEY) {
    return (
      <UnavailableShell
        title="Email is not configured"
        body="Set RESEND_API_KEY (and RESEND_FROM_EMAIL) so we can send the magic link, then come back."
      />
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?redirect=/verify-institution");

  const { data: profile } = await supabase
    .from("users")
    .select("verification_level, institution, institutional_email, display_name")
    .eq("id", user.id)
    .single();

  if (
    profile?.verification_level &&
    profile.verification_level !== "none"
  ) {
    return (
      <Shell>
        <SuccessCard
          institutionalEmail={profile.institutional_email}
          institution={profile.institution}
        />
      </Shell>
    );
  }

  if (sent) {
    return (
      <Shell>
        <div className="rounded-2xl border border-border bg-card p-8">
          <div className="flex flex-col gap-4">
            <Mail className="size-7 text-primary" strokeWidth={1.5} />
            <h1 className="text-2xl font-medium tracking-[-0.02em] text-foreground">
              Check your inbox.
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We sent a verification link to{" "}
              <span className="font-mono text-foreground">{sent}</span>. Click
              it within 24 hours to finish setting up your academic account.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-muted-foreground">
              <Link
                href="/verify-institution"
                className="underline-offset-2 hover:text-foreground hover:underline"
              >
                Use a different email
              </Link>
              <span>·</span>
              <Link
                href="/browse"
                className="underline-offset-2 hover:text-foreground hover:underline"
              >
                Browse simulations
              </Link>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <header className="flex flex-col gap-3">
        <Link
          href="/browse"
          className="inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          Back to browse
        </Link>
        <h1 className="text-3xl font-medium tracking-[-0.02em] text-foreground sm:text-4xl">
          Verify your institution.
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          One quick check so we can show your simulation came from a real lab.
          Most universities and research institutes work — .edu, .ac.uk, .gov,
          plus major European and Asian research institutes.
        </p>
      </header>

      <form action={verifyInstitution} className="mt-8 flex flex-col gap-5">
        <Label label="Institutional email" hint="Yours, not a shared lab address.">
          <Input
            type="email"
            name="institutional_email"
            required
            autoComplete="email"
            placeholder="you@university.edu"
            className="h-11"
          />
        </Label>

        <Label
          label="Institution"
          hint="The lab, department, or institute as you'd write it on a paper."
        >
          <Input
            name="institution_name"
            required
            maxLength={150}
            placeholder="e.g. Max Planck Institute for Biophysics"
            className="h-11"
          />
        </Label>

        <AuthFormError message={params.error} />

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/browse"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Not now
          </Link>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
          >
            <Mail className="size-3.5" />
            Send verification link
          </button>
        </div>
      </form>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16 sm:px-6 lg:py-24">
      {children}
    </div>
  );
}

function UnavailableShell({
  title,
  body,
}: {
  title: string;
  body?: string;
}) {
  return (
    <Shell>
      <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {body && (
          <p className="mt-1 text-xs text-muted-foreground">{body}</p>
        )}
      </div>
    </Shell>
  );
}

function SuccessCard({
  institutionalEmail,
  institution,
}: {
  institutionalEmail: string | null;
  institution: string | null;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-8">
      <div className="flex flex-col gap-4">
        <ShieldCheck className="size-7 text-emerald-500" strokeWidth={1.5} />
        <h1 className="text-2xl font-medium tracking-[-0.02em] text-foreground">
          You&apos;re verified.
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {institution
            ? `Welcome from ${institution}. `
            : "Welcome. "}
          You can now upload molecular dynamics simulations. They&apos;ll be
          tagged with a verified-academic badge on your profile and on the
          simulation page.
        </p>
        {institutionalEmail && (
          <p className="font-mono text-[11px] text-muted-foreground">
            Verified email: {institutionalEmail}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="/upload"
            className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
          >
            Share a simulation
          </Link>
          <Link
            href="/settings"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Edit profile
          </Link>
        </div>
      </div>
    </div>
  );
}

function Label({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}
