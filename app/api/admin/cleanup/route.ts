import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Token-gated one-shot cleanup for the prod DB.
//   - Zero view_count / like_count / comment_count on every simulation
//     (no real engagement yet, the 8.2k / 612 / 211 numbers are seed
//     literals that look like fake metrics).
//   - Delete comments and likes on seed sims (none should exist, but
//     defensive in case earlier seed runs added any).
//   - Delete the pre-rebrand fictional auth.users rows so /u/jtanaka
//     etc. 404 instead of showing a fake RIKEN affiliation.
//
// Hit with ?token=<your SUPABASE_SERVICE_ROLE_KEY> (whole key, or last
// 16 chars).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FICTIONAL_USER_IDS = [
  "00000000-0000-0000-0000-000000000002",
  "00000000-0000-0000-0000-000000000003",
  "00000000-0000-0000-0000-000000000004",
  "00000000-0000-0000-0000-000000000005",
  "00000000-0000-0000-0000-000000000006",
  "00000000-0000-0000-0000-000000000007",
  "00000000-0000-0000-0000-000000000008",
  "00000000-0000-0000-0000-000000000009",
  "00000000-0000-0000-0000-00000000000a",
  "00000000-0000-0000-0000-00000000000b",
  "00000000-0000-0000-0000-00000000000c",
];

const TEAM_USER_ID = "00000000-0000-0000-0000-000000000001";

function tokenAcceptable(req: NextRequest, serviceKey: string): boolean {
  const supplied =
    req.nextUrl.searchParams.get("token") ??
    req.headers.get("x-admin-token") ??
    "";
  if (!supplied) return false;
  if (supplied === serviceKey) return true;
  if (supplied === serviceKey.slice(-16)) return true;
  if (process.env.RESEED_TOKEN && supplied === process.env.RESEED_TOKEN)
    return true;
  return false;
}

async function cleanup(req: NextRequest): Promise<NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json(
      { ok: false, error: "Supabase env vars missing." },
      { status: 500 },
    );
  }
  if (!tokenAcceptable(req, serviceKey)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Token missing or wrong. Pass ?token=<SUPABASE_SERVICE_ROLE_KEY> (whole key or last 16 chars).",
      },
      { status: 403 },
    );
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Zero the fake engagement counts on every simulation.
  const { error: zeroErr, count: zeroed } = await supabase
    .from("simulations")
    .update(
      { view_count: 0, like_count: 0, comment_count: 0 },
      { count: "exact" },
    )
    .gt("id", "00000000-0000-0000-0000-000000000000"); // matches every row
  if (zeroErr) {
    return NextResponse.json(
      { ok: false, stage: "zero-counts", error: zeroErr.message },
      { status: 500 },
    );
  }

  // 2. Defensive: blow away any comments + likes that landed on seed
  //    sims. simulations.id values starting with 11.../22.../33... are
  //    all team-curated seeds.
  const seedIdPrefixes = ["11111111-", "22222222-", "33333333-"];
  let commentsDeleted = 0;
  let likesDeleted = 0;
  for (const prefix of seedIdPrefixes) {
    const { count: c } = await supabase
      .from("comments")
      .delete({ count: "exact" })
      .like("simulation_id", `${prefix}%`);
    commentsDeleted += c ?? 0;
    const { count: l } = await supabase
      .from("likes")
      .delete({ count: "exact" })
      .like("simulation_id", `${prefix}%`);
    likesDeleted += l ?? 0;
  }

  // 3. Reassign any sims still pointing at fictional users, so deletes
  //    don't cascade away real data.
  await supabase
    .from("simulations")
    .update({ user_id: TEAM_USER_ID })
    .in("user_id", FICTIONAL_USER_IDS);

  // 4. Delete the fictional auth.users (public.users cascades).
  let usersDeleted = 0;
  for (const uid of FICTIONAL_USER_IDS) {
    const { error } = await supabase.auth.admin.deleteUser(uid);
    if (!error) usersDeleted += 1;
  }

  return NextResponse.json({
    ok: true,
    simulations_zeroed: zeroed ?? null,
    comments_deleted: commentsDeleted,
    likes_deleted: likesDeleted,
    fictional_users_deleted: usersDeleted,
  });
}

export async function GET(req: NextRequest) {
  return cleanup(req);
}

export async function POST(req: NextRequest) {
  return cleanup(req);
}
