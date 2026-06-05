import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ContactFooter } from "@/components/auth/contact-footer";
import { createClient } from "@/lib/supabase/server";
import { isDbAvailable } from "@/lib/data/db-available";

export const metadata = {
  title: "Welcome to Simedo",
};

export default async function SignupConfirmedPage() {
  // If the user landed here without a session for some reason, send them
  // to sign-in instead of pretending we know who they are.
  let signedIn = false;
  if (isDbAvailable()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    signedIn = !!user;
  }

  return (
    <AuthLayout
      title="Your email is confirmed."
      subtitle="Welcome to Simedo. One quick step — tell us a bit about yourself — and you're in."
      footer={<ContactFooter />}
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-emerald-700 dark:text-emerald-300">
          <ShieldCheck className="size-4" strokeWidth={1.5} />
          <span className="text-sm font-medium">Account activated</span>
        </div>

        <Link
          href={signedIn ? "/onboarding" : "/sign-in"}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
        >
          Continue to Simedo
          <ArrowRight className="size-3.5" />
        </Link>

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          You can browse and use the AI features right away. To share a
          simulation, verify with your institutional email when you&apos;re
          ready.
        </p>
      </div>
    </AuthLayout>
  );
}
