import { createClient } from "@/lib/supabase/server";
import { isDbAvailable } from "./db-available";

// Lightweight viewer profile fetch for header/account UI. Returns only the
// bits the header needs — no follow counts, no bio. Heavier profile data
// lives in lib/data/profiles.ts.

export type ViewerSummary = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
};

function fallbackAvatar(seed: string): string {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
    seed,
  )}&backgroundColor=0F6E56`;
}

export async function getViewerSummary(): Promise<ViewerSummary | null> {
  if (!isDbAvailable()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("username, display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const username = data?.username ?? "you";
  const displayName = data?.display_name?.trim() || username;
  return {
    id: user.id,
    username,
    displayName,
    avatarUrl: data?.avatar_url ?? fallbackAvatar(username),
  };
}
