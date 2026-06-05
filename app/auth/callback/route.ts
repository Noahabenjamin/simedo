import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Supabase callback for OAuth + email confirmation + password reset.
// Strategy: exchange the code, then route based on intent:
//
//   ?next=<path>           — explicit next (set by sign-in actions); honor.
//   sign-up confirmation   — land on /sign-up/confirmed with a welcome card.
//   anything else with no  — / is the safe default.
//
// Failures land on /auth/callback/error so the user gets a clear
// "link expired" screen with a resend form instead of being silently
// bounced back to /sign-in.

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const explicitNext = searchParams.get("next");
  const type = searchParams.get("type");
  // Supabase sometimes echoes the user's email back as ?email=… on the
  // confirmation link; pass it through to the error page if anything fails.
  const echoEmail = searchParams.get("email") ?? "";

  if (!code) {
    const params = new URLSearchParams({
      reason: "Missing confirmation code.",
    });
    if (echoEmail) params.set("email", echoEmail);
    return NextResponse.redirect(
      `${origin}/auth/callback/error?${params.toString()}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const params = new URLSearchParams({
      reason:
        error.message ?? "We couldn't verify the link in your email.",
    });
    if (echoEmail) params.set("email", echoEmail);
    return NextResponse.redirect(
      `${origin}/auth/callback/error?${params.toString()}`,
    );
  }

  // Where to land after success.
  let target = explicitNext ?? "/";
  if (!explicitNext) {
    // signup/email_change → confirmation screen; recovery → settings.
    if (type === "signup" || type === "email_change") {
      target = "/sign-up/confirmed";
    } else if (type === "recovery") {
      target = "/settings";
    }
  }
  return NextResponse.redirect(`${origin}${target}`);
}
