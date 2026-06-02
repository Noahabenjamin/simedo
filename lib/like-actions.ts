"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDbAvailable } from "@/lib/data/db-available";

// Toggle a like on a simulation. Idempotent on both sides — insert is
// rejected by the unique constraint if the row already exists, delete
// is a no-op if it doesn't.

export async function toggleLike(formData: FormData): Promise<void> {
  const simulationId = String(formData.get("simulation_id") ?? "");
  const currentlyLiked = String(formData.get("currently_liked") ?? "") === "1";

  if (!simulationId) return;
  if (!isDbAvailable()) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirect=/simulation/${simulationId}`);
  }

  if (currentlyLiked) {
    await supabase
      .from("likes")
      .delete()
      .eq("user_id", user!.id)
      .eq("simulation_id", simulationId);
  } else {
    await supabase
      .from("likes")
      .insert({ user_id: user!.id, simulation_id: simulationId });
  }

  revalidatePath(`/simulation/${simulationId}`);
}
