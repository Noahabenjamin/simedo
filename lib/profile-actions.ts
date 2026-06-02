"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDbAvailable } from "@/lib/data/db-available";

// Follow / unfollow a profile. Called from the FollowButton form.
// Idempotent on both sides — insert is ignored if the row already exists,
// delete is a no-op if it doesn't.

export async function toggleFollow(formData: FormData): Promise<void> {
  const profileId = String(formData.get("profile_id") ?? "");
  const username = String(formData.get("username") ?? "");
  const currentlyFollowing =
    String(formData.get("currently_following") ?? "") === "1";

  if (!profileId) return;
  if (!isDbAvailable()) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirect=/u/${username}`);
  }
  if (user!.id === profileId) return;

  if (currentlyFollowing) {
    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user!.id)
      .eq("followed_id", profileId);
  } else {
    await supabase
      .from("follows")
      .insert({ follower_id: user!.id, followed_id: profileId });
  }

  revalidatePath(`/u/${username}`);
}
