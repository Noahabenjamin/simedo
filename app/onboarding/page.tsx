import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthFormError } from "@/components/auth/auth-form-error";
import { ConfigureSupabase } from "@/components/auth/configure-supabase";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { isDbAvailable } from "@/lib/data/db-available";

type SearchParams = Promise<{ error?: string }>;

export default async function OnboardingPage({
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
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("display_name, bio, institution, orcid")
    .eq("id", user.id)
    .single();

  // updateProfile handles its own redirects.

  return (
    <AuthLayout
      title="Tell us about yourself"
      subtitle="All optional. You can edit this any time."
      footer={
        <Link
          href="/"
          className="text-foreground transition-colors hover:text-primary"
        >
          Skip for now
        </Link>
      }
    >
      <form action={updateProfile} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Display name</span>
          <Input
            name="display_name"
            defaultValue={profile?.display_name ?? ""}
            className="h-11"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Bio</span>
          <Textarea
            name="bio"
            defaultValue={profile?.bio ?? ""}
            placeholder="One or two lines on what you work on."
            rows={3}
            className="resize-none"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Institution</span>
          <Input
            name="institution"
            defaultValue={profile?.institution ?? ""}
            placeholder="e.g. Imperial College London"
            className="h-11"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">
            ORCID iD <span className="text-muted-foreground/60">— optional</span>
          </span>
          <Input
            name="orcid"
            defaultValue={profile?.orcid ?? ""}
            placeholder="0000-0000-0000-0000"
            pattern="[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{3}[0-9X]"
            className="h-11 font-mono"
          />
          <span className="text-[11px] text-muted-foreground">
            Linking your ORCID adds a small verified badge to your profile.
          </span>
        </label>

        <AuthFormError message={params.error} />

        <button
          type="submit"
          className="mt-2 h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Save and continue
        </button>
      </form>
    </AuthLayout>
  );
}
