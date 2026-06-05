"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { isDbAvailable } from "@/lib/data/db-available";
import { validateInstitutionalDomain } from "@/lib/institutional-domains";

// Verification flow server actions:
//   - verifyInstitution: emit a magic link to the user's institutional email
//   - confirmVerificationToken: callback for the link
//
// Resend is gated on RESEND_API_KEY; missing-key state is handled by the
// /verify-institution page so users see a clear "setup required" notice
// instead of an opaque crash.

function fromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
}

function originFromRequestOrEnv(rh: Headers): string {
  return (
    rh.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  );
}

function errorRedirect(message: string): never {
  redirect(`/verify-institution?error=${encodeURIComponent(message)}`);
}

function rejectionRedirect(
  message: string,
  opts: { email: string; canRequestReview: boolean },
): never {
  const params = new URLSearchParams({
    error: message,
    invalid_email: opts.email,
  });
  if (opts.canRequestReview) params.set("review", "1");
  redirect(`/verify-institution?${params.toString()}`);
}

export async function verifyInstitution(formData: FormData): Promise<void> {
  if (!isDbAvailable()) errorRedirect("Database is not configured.");
  if (!process.env.RESEND_API_KEY) {
    errorRedirect("Email is not configured — set RESEND_API_KEY.");
  }

  const email = String(formData.get("institutional_email") ?? "").trim();
  const institutionName = String(formData.get("institution_name") ?? "").trim();
  if (!email || !institutionName) {
    errorRedirect("Email and institution name are required.");
  }

  const check = validateInstitutionalDomain(email);
  if (!check.valid) {
    rejectionRedirect(check.reason, {
      email,
      canRequestReview: check.canRequestReview,
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?redirect=/verify-institution");

  const token = randomBytes(32).toString("hex");

  const { error } = await supabase.from("institutional_verifications").upsert(
    {
      user_id: user!.id,
      institutional_email: email.toLowerCase(),
      institution_name: institutionName,
      domain: check.domain,
      verification_token: token,
      verified_at: null,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
    { onConflict: "user_id,institutional_email" },
  );
  if (error) {
    console.error("[verify] insert failed", error);
    errorRedirect("Could not start verification. Try again.");
  }

  const origin = originFromRequestOrEnv(await headers());
  const verifyUrl = `${origin}/verify-institution/callback?token=${token}`;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: `Simedo <${fromAddress()}>`,
      to: email,
      subject: "Verify your Simedo academic account",
      text:
        `Click below to verify ${email} for Simedo. This lets you upload molecular dynamics simulations.\n\n` +
        `${verifyUrl}\n\n` +
        `The link expires in 24 hours. If you didn't request this, you can ignore the email.`,
    });
  } catch (e) {
    console.error("[verify] resend failed", e);
    errorRedirect("Could not send the verification email. Try again later.");
  }

  redirect(`/verify-institution?sent=${encodeURIComponent(email)}`);
}

export async function confirmVerificationToken(
  token: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!token) return { ok: false, reason: "Missing token." };
  if (!isDbAvailable())
    return { ok: false, reason: "Database is not configured." };

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("institutional_verifications")
    .select(
      "id, user_id, institutional_email, institution_name, domain, verified_at, expires_at",
    )
    .eq("verification_token", token)
    .maybeSingle();

  if (!row) return { ok: false, reason: "Unknown verification link." };
  if (row.verified_at) return { ok: true };

  const expires = new Date(row.expires_at).getTime();
  if (Number.isNaN(expires) || expires < Date.now()) {
    return { ok: false, reason: "This verification link has expired." };
  }

  const { error: updErr } = await supabase
    .from("institutional_verifications")
    .update({ verified_at: new Date().toISOString() })
    .eq("id", row.id);
  if (updErr) {
    console.error("[verify] update verifications failed", updErr);
    return { ok: false, reason: "Could not confirm verification." };
  }

  const { error: userErr } = await supabase
    .from("users")
    .update({
      institutional_email: row.institutional_email,
      institutional_domain: row.domain,
      verification_level: "email_verified",
      is_verified_academic: true,
      institution: row.institution_name,
    })
    .eq("id", row.user_id);
  if (userErr) {
    console.error("[verify] update user failed", userErr);
    return { ok: false, reason: "Could not finalize verification." };
  }

  revalidatePath("/upload");
  revalidatePath("/settings");
  return { ok: true };
}
