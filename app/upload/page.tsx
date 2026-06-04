import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { UploadForm } from "@/components/upload/upload-form";
import { isDbAvailable } from "@/lib/data/db-available";
import { isR2Configured } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Upload simulation",
  description:
    "Share a molecular dynamics simulation with the Simedo community.",
};

type SearchParams = Promise<{ verified?: string }>;

export default async function UploadPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { verified } = await searchParams;

  if (!isDbAvailable()) {
    return <Unavailable title="Database is not configured" />;
  }

  if (!isR2Configured()) {
    return (
      <Unavailable
        title="Uploads temporarily unavailable"
        body="Trajectory storage isn't connected yet. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_PUBLIC_URL to enable uploads."
      />
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?redirect=/upload");

  const { data: profile } = await supabase
    .from("users")
    .select(
      "display_name, institution, institutional_email, verification_level",
    )
    .eq("id", user.id)
    .single();

  // Proxy already redirects unverified users, but defense in depth.
  if (
    !profile ||
    !profile.verification_level ||
    profile.verification_level === "none"
  ) {
    redirect("/verify-institution");
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:py-20">
      <header className="mb-10 flex flex-col gap-4">
        <Link
          href="/browse"
          className="inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          Back to browse
        </Link>
        <h1 className="text-4xl font-medium tracking-[-0.02em] sm:text-5xl">
          Share a simulation.
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          Most uploads take about 4 minutes. Your work gets a permanent link,
          a citable trust badge, and an embed code for your lab&apos;s website.
        </p>
        {verified && (
          <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="size-3.5" />
            You&apos;re verified.
          </div>
        )}
      </header>

      <UploadForm
        defaults={{
          email: profile.institutional_email ?? "",
          institution: profile.institution ?? "",
          displayName: profile.display_name?.trim() || "",
        }}
      />
    </div>
  );
}

function Unavailable({
  title,
  body,
}: {
  title: string;
  body?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 lg:py-24">
      <div className="rounded-2xl border border-border bg-card px-6 py-16 text-center">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {body && (
          <p className="mt-1 max-w-md text-xs text-muted-foreground">{body}</p>
        )}
      </div>
    </div>
  );
}
