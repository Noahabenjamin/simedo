import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ConfigureSupabase } from "@/components/auth/configure-supabase";
import { AuthFormError } from "@/components/auth/auth-form-error";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { isDbAvailable } from "@/lib/data/db-available";

export const metadata = {
  title: "Edit profile",
};

type SearchParams = Promise<{ error?: string; saved?: string }>;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  if (!isDbAvailable()) return <ConfigureSupabase />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?redirect=/settings");

  const { data: profile } = await supabase
    .from("users")
    .select("username, display_name, bio, institution, orcid")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 lg:py-20">
      <header className="mb-10 flex flex-col gap-3">
        <Link
          href={profile?.username ? `/u/${profile.username}` : "/"}
          className="inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          Back to profile
        </Link>
        <h1 className="text-3xl font-medium tracking-[-0.02em] sm:text-4xl">
          Edit profile
        </h1>
        <p className="text-sm text-muted-foreground">
          Update your public profile. Username can&apos;t be changed once
          your handle is in use.
        </p>
      </header>

      <form action={updateProfile} className="flex flex-col gap-5">
        <Row label="Username">
          <Input
            value={profile?.username ?? ""}
            readOnly
            disabled
            className="h-11 font-mono text-muted-foreground"
          />
        </Row>

        <Row label="Display name">
          <Input
            name="display_name"
            defaultValue={profile?.display_name ?? ""}
            placeholder={profile?.username ?? ""}
            className="h-11"
            maxLength={80}
          />
        </Row>

        <Row label="Bio">
          <Textarea
            name="bio"
            defaultValue={profile?.bio ?? ""}
            placeholder="One or two lines on what you work on."
            rows={3}
            maxLength={400}
            className="resize-none"
          />
        </Row>

        <Row label="Institution">
          <Input
            name="institution"
            defaultValue={profile?.institution ?? ""}
            placeholder="e.g. Imperial College London"
            className="h-11"
            maxLength={120}
          />
        </Row>

        <Row
          label="ORCID iD"
          hint="If you have one. Format: 0000-0000-0000-0000."
        >
          <Input
            name="orcid"
            defaultValue={profile?.orcid ?? ""}
            placeholder="0000-0000-0000-0000"
            pattern="[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{3}[0-9X]"
            className="h-11 font-mono"
          />
        </Row>

        <AuthFormError message={params.error} />

        {params.saved && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            Saved.
          </p>
        )}

        <div className="mt-4 flex items-center justify-end gap-3 border-t border-border pt-6">
          <Link
            href={profile?.username ? `/u/${profile.username}` : "/"}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="h-10 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
          >
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}

function Row({
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
