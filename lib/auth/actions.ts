"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// Auth server actions. Used as <form action={fn}>.
// Convention: success → redirect; failure → redirect to the same page with an
// `error` query param the form re-renders from.

function errorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function isEmailNotConfirmed(err: { code?: string; message?: string }): boolean {
  if (err.code === "email_not_confirmed") return true;
  const msg = err.message?.toLowerCase() ?? "";
  return msg.includes("email not confirmed") || msg.includes("not confirmed");
}

export async function signInWithPassword(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "/");

  if (!email || !password) {
    errorRedirect("/sign-in", "Email and password are required.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (isEmailNotConfirmed(error as { code?: string; message?: string })) {
      // Surface a separate, actionable state on the sign-in page so the
      // user gets a resend-confirmation button instead of the misleading
      // "invalid login credentials" message.
      const params = new URLSearchParams({
        unconfirmed: "1",
        email,
        redirect: redirectTo,
      });
      redirect(`/sign-in?${params.toString()}`);
    }
    errorRedirect("/sign-in", error.message);
  }

  redirect(redirectTo);
}

export async function signUp(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const displayName = String(formData.get("display_name") ?? "").trim();

  if (!email || !password || !username) {
    errorRedirect("/sign-up", "Email, password, and username are required.");
  }
  if (password.length < 8) {
    errorRedirect("/sign-up", "Password must be at least 8 characters.");
  }
  if (!/^[a-z0-9_]{2,32}$/.test(username)) {
    errorRedirect(
      "/sign-up",
      "Username must be 2–32 characters, lowercase letters, numbers, and underscores only.",
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, display_name: displayName || username },
    },
  });
  if (error) errorRedirect("/sign-up", error.message);

  // Don't drop the user on /onboarding — their email isn't confirmed yet
  // and any authed route would bounce them around. Send them to the
  // "Check your inbox" screen with the address they signed up with.
  redirect(`/sign-up/check-email?email=${encodeURIComponent(email)}`);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function requestPasswordReset(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) errorRedirect("/forgot-password", "Email is required.");

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/settings`,
  });
  if (error) errorRedirect("/forgot-password", error.message);
  redirect("/forgot-password?sent=1");
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const redirectTo = String(formData.get("redirect") ?? "/");
  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
    },
  });
  if (error) errorRedirect("/sign-in", error.message);
  if (data?.url) redirect(data.url);
  errorRedirect("/sign-in", "Couldn't reach Google sign-in.");
}

export async function updateProfile(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) errorRedirect("/sign-in", "Not signed in.");

  const bio = String(formData.get("bio") ?? "").trim();
  const institution = String(formData.get("institution") ?? "").trim();
  const orcid = String(formData.get("orcid") ?? "").trim();
  const displayName = String(formData.get("display_name") ?? "").trim();

  const { error } = await supabase
    .from("users")
    .update({
      bio,
      institution: institution || null,
      orcid: orcid || null,
      display_name: displayName || null,
    })
    .eq("id", user!.id);

  if (error) errorRedirect("/settings", error.message);
  redirect("/settings?saved=1");
}
