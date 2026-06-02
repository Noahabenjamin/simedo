import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDbAvailable } from "@/lib/data/db-available";
import { mockSimulations } from "@/lib/mock-data";

// Returns grouped search results across simulations and users. Backed by
// Postgres full-text search via the search_tsv generated columns; falls
// back to a substring scan of the mock data when Supabase isn't set up.
//
// Shape:
//   { simulations: [...], users: [...] }
// Each row carries just enough to render a palette result row.

export const runtime = "nodejs";

type SimHit = {
  type: "simulation";
  id: string;
  title: string;
  pdbCode: string;
  category: string;
  proteinFamily: string | null;
  organism: string | null;
};

type UserHit = {
  type: "user";
  username: string;
  displayName: string;
  institution: string | null;
  avatarUrl: string | null;
};

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q || q.length < 2) {
    return new Response(
      JSON.stringify({ simulations: [], users: [] }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  if (!isDbAvailable()) {
    const needle = q.toLowerCase();
    const sims: SimHit[] = mockSimulations
      .filter((s) => {
        const hay =
          `${s.title} ${s.description} ${s.pdbCode} ${s.proteinFamily ?? ""} ${s.organism ?? ""}`.toLowerCase();
        return hay.includes(needle);
      })
      .slice(0, 8)
      .map((s) => ({
        type: "simulation",
        id: s.id,
        title: s.title,
        pdbCode: s.pdbCode,
        category: s.category,
        proteinFamily: s.proteinFamily ?? null,
        organism: s.organism ?? null,
      }));
    return new Response(
      JSON.stringify({ simulations: sims, users: [] }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  const supabase = await createClient();
  // websearch_to_tsquery lets users type natural queries like
  //   `crispr OR cas9` or quoted phrases and the parser sorts it out.
  const tsQuery = q;

  const [simRes, userRes] = await Promise.all([
    supabase
      .from("simulations")
      .select(
        "id, title, pdb_code, category, protein_family, organism, search_tsv",
      )
      .textSearch("search_tsv", tsQuery, { type: "websearch" })
      .eq("visibility", "public")
      .limit(8),
    supabase
      .from("users")
      .select("username, display_name, institution, avatar_url")
      .textSearch("search_tsv", tsQuery, { type: "websearch" })
      .limit(5),
  ]);

  const simulations: SimHit[] = (simRes.data ?? []).map(
    (s: {
      id: string;
      title: string;
      pdb_code: string | null;
      category: string;
      protein_family: string | null;
      organism: string | null;
    }) => ({
      type: "simulation",
      id: s.id,
      title: s.title,
      pdbCode: s.pdb_code ?? "",
      category: s.category,
      proteinFamily: s.protein_family,
      organism: s.organism,
    }),
  );

  const users: UserHit[] = (userRes.data ?? []).map(
    (u: {
      username: string;
      display_name: string | null;
      institution: string | null;
      avatar_url: string | null;
    }) => ({
      type: "user",
      username: u.username,
      displayName: u.display_name?.trim() || u.username,
      institution: u.institution,
      avatarUrl: u.avatar_url,
    }),
  );

  return new Response(JSON.stringify({ simulations, users }), {
    headers: { "Content-Type": "application/json" },
  });
}
