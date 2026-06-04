import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Simedo auth proxy.
// - Refreshes the Supabase session cookie on every request.
// - Gates /upload, /settings, /onboarding, /verify-institution behind auth.
// - Gates /upload behind academic verification — unverified users are
//   bounced to /verify-institution so the upload form is never a dead end.
//
// Without Supabase env vars set, the proxy short-circuits and passes
// everything through. Lets local dev work without the backend wired up.

const PROTECTED_PREFIXES = [
  "/upload",
  "/settings",
  "/onboarding",
  "/verify-institution",
];

// /upload additionally requires verification_level <> 'none'.
const VERIFICATION_REQUIRED_PREFIXES = ["/upload"];

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Refresh session if expired. getUser() touches the auth server and is the
  // canonical way to validate the session — getSession() reads cookies only.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (isProtected && !user) {
    const loginUrl = new URL("/sign-in", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verification gate. Cheap to check — one column on public.users.
  const needsVerification = VERIFICATION_REQUIRED_PREFIXES.some((p) =>
    pathname.startsWith(p),
  );
  if (needsVerification && user) {
    const { data } = await supabase
      .from("users")
      .select("verification_level")
      .eq("id", user.id)
      .maybeSingle();
    if (
      !data ||
      data.verification_level == null ||
      data.verification_level === "none"
    ) {
      return NextResponse.redirect(new URL("/verify-institution", request.url));
    }
  }

  return response;
}

export const config = {
  // Match everything except: static assets, _next, favicon, auth callback,
  // and image/font assets.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2)$).*)",
  ],
};
