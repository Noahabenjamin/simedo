import { createClient } from "@/lib/supabase/server";
import { mockSimulations } from "@/lib/mock-data";
import { isDbAvailable } from "./db-available";
import type { Profile, Simulation } from "@/types";

// Server-side profile fetchers. Falls back to a synthetic Helix Team
// profile derived from the mock simulations when the DB isn't configured.

type DbUserRow = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  institution: string | null;
  orcid: string | null;
  avatar_url: string | null;
  is_verified_academic: boolean | null;
  created_at: string;
};

// Stays in sync with seed.sql's Helix Team account.
const SEED_USER_ID = "00000000-0000-0000-0000-000000000001";

function fallbackAvatar(seed: string): string {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
    seed,
  )}&backgroundColor=0F6E56`;
}

function mockProfileForTeam(): Profile {
  return {
    id: SEED_USER_ID,
    username: "helix-team",
    displayName: "Helix Team",
    bio: "Reference structures curated by the Helix team. Browse to explore — upload your own simulation to claim a real profile.",
    institution: null,
    orcid: null,
    avatarUrl: mockSimulations[0]?.author.avatarUrl ?? fallbackAvatar("helix-team"),
    isVerifiedAcademic: false,
    isSeed: true,
    createdAt: "2025-09-01T00:00:00Z",
    simulationCount: mockSimulations.length,
    followerCount: 0,
    followingCount: 0,
  };
}

export async function getProfileByUsername(
  username: string,
): Promise<Profile | null> {
  const normalized = username.toLowerCase();
  if (!isDbAvailable()) {
    return normalized === "helix-team" ? mockProfileForTeam() : null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select(
      "id, username, display_name, bio, institution, orcid, avatar_url, is_verified_academic, created_at",
    )
    .eq("username", normalized)
    .single<DbUserRow>();

  if (error || !data) return null;

  const [simCount, followers, following] = await Promise.all([
    supabase
      .from("simulations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", data.id)
      .eq("visibility", "public"),
    supabase
      .from("follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("followed_id", data.id),
    supabase
      .from("follows")
      .select("followed_id", { count: "exact", head: true })
      .eq("follower_id", data.id),
  ]);

  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name?.trim() || data.username,
    bio: data.bio ?? "",
    institution: data.institution,
    orcid: data.orcid,
    avatarUrl: data.avatar_url ?? fallbackAvatar(data.username),
    isVerifiedAcademic: !!data.is_verified_academic,
    isSeed: data.id === SEED_USER_ID,
    createdAt: data.created_at,
    simulationCount: simCount.count ?? 0,
    followerCount: followers.count ?? 0,
    followingCount: following.count ?? 0,
  };
}

export async function getProfileSimulations(
  userId: string,
  limit = 24,
): Promise<Simulation[]> {
  if (!isDbAvailable()) {
    return userId === SEED_USER_ID ? mockSimulations.slice(0, limit) : [];
  }
  const { listSimulationsByUser } = await import("./simulations");
  return listSimulationsByUser(userId, limit);
}

export async function getProfileLikes(
  userId: string,
  limit = 24,
): Promise<Simulation[]> {
  if (!isDbAvailable()) return [];
  const { listSimulationsLikedBy } = await import("./simulations");
  return listSimulationsLikedBy(userId, limit);
}

export async function isFollowing(
  followerId: string,
  followedId: string,
): Promise<boolean> {
  if (!isDbAvailable() || followerId === followedId) return false;
  const supabase = await createClient();
  const { data } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("followed_id", followedId)
    .maybeSingle();
  return !!data;
}
