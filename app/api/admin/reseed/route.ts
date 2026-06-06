import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SEED_SIMS, SEED_TEAM_USER_ID, NMR_PDBS } from "@/lib/seed-sims";

// One-URL reseeder. Hit this endpoint and it:
//   1. Verifies the Simedo Team user exists (creates it via the auth admin
//      API if it doesn't — falling back gracefully if the username is
//      already taken).
//   2. Skips any PDB codes that already have a row, so re-running never
//      duplicates.
//   3. Inserts the rest under the Team user.
//   4. Flags NMR ensembles so the viewer animates them.
//
// Uses the service role key, which bypasses RLS — that's why this is
// gated behind ?token=… (or x-admin-token header) and ALSO refuses to
// run unless RESEED_TOKEN matches. The token defaults to the Supabase
// service-role key suffix so you don't need a new env var to use it.
//
// Usage: visit https://simedo.work/api/admin/reseed?token=<your-token>
// Both GET and POST work so a browser bar suffices.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function expectedToken(): string | null {
  // Prefer an explicit RESEED_TOKEN if set; otherwise allow the last 16
  // chars of the service-role key as a "you have the keys, you can reseed"
  // affordance.
  const explicit = process.env.RESEED_TOKEN;
  if (explicit) return explicit;
  const sk = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return sk ? sk.slice(-16) : null;
}

async function reseed(req: NextRequest): Promise<NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Supabase env vars missing. Need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 500 },
    );
  }

  const supplied =
    req.nextUrl.searchParams.get("token") ??
    req.headers.get("x-admin-token") ??
    "";
  const expected = expectedToken();
  const acceptable = new Set<string>();
  if (expected) acceptable.add(expected);
  if (serviceKey) acceptable.add(serviceKey); // full key works too
  if (!acceptable.size || !acceptable.has(supplied)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Token missing or wrong. Pass ?token=<your SUPABASE_SERVICE_ROLE_KEY> (whole key), or its last 16 chars, or set RESEED_TOKEN.",
      },
      { status: 403 },
    );
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ── 1. Make sure the team user exists ─────────────────────────────────
  let teamId = SEED_TEAM_USER_ID;
  {
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("id", teamId)
      .maybeSingle();

    if (!existing) {
      const { data: byUsername } = await supabase
        .from("users")
        .select("id")
        .eq("username", "helix-team")
        .maybeSingle();

      if (byUsername) {
        teamId = byUsername.id;
      } else {
        const random = crypto.randomUUID();
        const { data: created, error: authErr } =
          await supabase.auth.admin.createUser({
            email: "team@simedo.work",
            password: random,
            email_confirm: true,
            user_metadata: {
              username: "helix-team",
              display_name: "Simedo Team",
              is_seed: true,
            },
          });
        if (authErr || !created?.user) {
          return NextResponse.json(
            {
              ok: false,
              stage: "team-user-create",
              error: authErr?.message ?? "auth.admin.createUser returned no user",
            },
            { status: 500 },
          );
        }
        teamId = created.user.id;
      }

      await supabase
        .from("users")
        .update({
          display_name: "Simedo Team",
          bio: "Reference structures curated by the Simedo team. Browse to explore — upload your own simulation to claim a real profile.",
          verification_level: "manually_verified",
          is_verified_academic: true,
          avatar_url:
            "https://api.dicebear.com/9.x/shapes/svg?seed=helix-team&backgroundColor=0a1437&shape1Color=2563eb&shape2Color=60a5fa&shape3Color=93c5fd",
        })
        .eq("id", teamId);
    }
  }

  // ── 2. Figure out which PDB codes are already in the DB ──────────────
  const { data: existingRows, error: existingErr } = await supabase
    .from("simulations")
    .select("pdb_code");
  if (existingErr) {
    return NextResponse.json(
      { ok: false, stage: "list-existing", error: existingErr.message },
      { status: 500 },
    );
  }
  const existingCodes = new Set(
    (existingRows ?? [])
      .map((r) => (r as { pdb_code: string | null }).pdb_code)
      .filter((c): c is string => !!c),
  );

  // ── 3. Insert only the rows whose PDB code is new. Each row is
  //       cloned so we can swap in the resolved teamId if it differs
  //       from the hardcoded SEED_TEAM_USER_ID. ────────────────────────
  const toInsert = SEED_SIMS.filter(
    (s) => !existingCodes.has(s.pdb_code),
  ).map((s) => ({ ...s, user_id: teamId }));

  let inserted = 0;
  if (toInsert.length > 0) {
    const { data: written, error: insertErr } = await supabase
      .from("simulations")
      .insert(toInsert)
      .select("id");
    if (insertErr) {
      return NextResponse.json(
        {
          ok: false,
          stage: "simulations-insert",
          error: insertErr.message,
          code: (insertErr as { code?: string }).code,
          attempted: toInsert.length,
        },
        { status: 500 },
      );
    }
    inserted = written?.length ?? toInsert.length;
  }

  // ── 4. Flag NMR ensembles so the viewer animates them ────────────────
  await supabase
    .from("simulations")
    .update({ has_trajectory: true })
    .in("pdb_code", Array.from(NMR_PDBS));

  // ── 5. Report ────────────────────────────────────────────────────────
  const { count: total } = await supabase
    .from("simulations")
    .select("id", { count: "exact", head: true });

  return NextResponse.json({
    ok: true,
    team_user_id: teamId,
    sims_in_seed_catalog: SEED_SIMS.length,
    sims_already_present: existingCodes.size,
    sims_inserted_now: inserted,
    sims_in_db_after: total ?? null,
  });
}

export async function GET(req: NextRequest) {
  return reseed(req);
}

export async function POST(req: NextRequest) {
  return reseed(req);
}
