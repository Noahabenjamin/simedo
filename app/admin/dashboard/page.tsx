import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDbAvailable } from "@/lib/data/db-available";
import { ConfigureSupabase } from "@/components/auth/configure-supabase";
import { formatCount } from "@/lib/format";

// Admin dashboard. Access controlled by ADMIN_USERNAMES env var
// (comma-separated list of public.users.username values).
// 404 to non-admins so the page's existence isn't enumerable.

export const dynamic = "force-dynamic";

const adminUsernames = (process.env.ADMIN_USERNAMES ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export default async function AdminDashboard() {
  if (!isDbAvailable()) return <ConfigureSupabase />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/admin/dashboard");

  const { data: profile } = await supabase
    .from("users")
    .select("username")
    .eq("id", user.id)
    .single();
  if (!profile || !adminUsernames.includes(profile.username.toLowerCase())) {
    // Pretend it doesn't exist.
    notFound();
  }

  const [{ count: totalUsers }, { count: totalSims }, { count: weeklyUsers }] =
    await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase
        .from("simulations")
        .select("*", { count: "exact", head: true })
        .eq("visibility", "public"),
      supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .gte(
          "created_at",
          new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
        ),
    ]);

  const { data: topSims } = await supabase
    .from("simulations")
    .select("id, title, view_count, like_count, pdb_code")
    .eq("visibility", "public")
    .order("view_count", { ascending: false })
    .limit(8);

  const { data: aiUsage } = await supabase
    .from("ai_usage")
    .select("model, input_tokens, output_tokens, created_at")
    .gte(
      "created_at",
      new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    );

  const tokenTotals = (aiUsage ?? []).reduce(
    (acc, r) => {
      acc.input += r.input_tokens ?? 0;
      acc.output += r.output_tokens ?? 0;
      return acc;
    },
    { input: 0, output: 0 },
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="mb-10 flex flex-col gap-2">
        <h1 className="text-3xl font-medium tracking-[-0.02em]">
          Admin dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Internal overview. Visible only to allow-listed accounts.
        </p>
      </header>

      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Users" value={formatCount(totalUsers ?? 0)} />
        <Stat label="Public simulations" value={formatCount(totalSims ?? 0)} />
        <Stat
          label="New users (7d)"
          value={formatCount(weeklyUsers ?? 0)}
        />
        <Stat
          label="AI tokens (30d)"
          value={`${formatCount(tokenTotals.input + tokenTotals.output)}`}
        />
      </div>

      <section className="mb-10 flex flex-col gap-4">
        <h2 className="text-base font-medium tracking-tight">
          Top simulations by views
        </h2>
        <ul className="divide-y divide-border rounded-2xl border border-border">
          {(topSims ?? []).map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between px-4 py-3 text-sm"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">{s.title}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {s.pdb_code}
                </span>
              </div>
              <div className="flex items-center gap-4 font-mono text-xs text-muted-foreground tabular-nums">
                <span>{formatCount(s.view_count)} views</span>
                <span>{formatCount(s.like_count)} likes</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-medium tracking-tight">
          AI usage (30 days)
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Stat
            label="Input tokens"
            value={formatCount(tokenTotals.input)}
          />
          <Stat
            label="Output tokens"
            value={formatCount(tokenTotals.output)}
          />
          <Stat
            label="Approx cost"
            value={`$${estimateCost(tokenTotals).toFixed(2)}`}
          />
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono text-2xl font-medium tabular-nums">
        {value}
      </span>
    </div>
  );
}

// Rough average price ($/M tokens): assume mostly Haiku.
function estimateCost({ input, output }: { input: number; output: number }) {
  return (input / 1_000_000) * 0.8 + (output / 1_000_000) * 4;
}

