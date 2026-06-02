"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDbAvailable } from "@/lib/data/db-available";

const VALID_EMOJI = new Set([
  "thumbs_up",
  "heart",
  "microscope",
  "idea",
]);

export async function postComment(formData: FormData): Promise<void> {
  const simulationId = String(formData.get("simulation_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const parentId = (formData.get("parent_id") as string) || null;
  const frameRaw = formData.get("frame_number");
  const frameNumber =
    frameRaw && frameRaw !== "" ? Number(frameRaw) : null;
  const atomSelection =
    (formData.get("atom_selection") as string)?.trim() || null;

  if (!simulationId || !body) return;
  if (body.length > 5000) return;
  if (!isDbAvailable()) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirect=/simulation/${simulationId}`);
  }

  await supabase.from("comments").insert({
    simulation_id: simulationId,
    user_id: user!.id,
    parent_id: parentId,
    body,
    frame_number:
      typeof frameNumber === "number" && !Number.isNaN(frameNumber)
        ? Math.max(0, Math.floor(frameNumber))
        : null,
    atom_selection: atomSelection,
  });

  revalidatePath(`/simulation/${simulationId}`);
}

export async function deleteComment(formData: FormData): Promise<void> {
  const commentId = String(formData.get("comment_id") ?? "");
  const simulationId = String(formData.get("simulation_id") ?? "");
  if (!commentId || !simulationId) return;
  if (!isDbAvailable()) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Soft delete: keeps thread structure intact for replies.
  await supabase
    .from("comments")
    .update({ is_deleted: true, body: "[deleted]" })
    .eq("id", commentId)
    .eq("user_id", user.id);

  revalidatePath(`/simulation/${simulationId}`);
}

export async function toggleReaction(formData: FormData): Promise<void> {
  const commentId = String(formData.get("comment_id") ?? "");
  const simulationId = String(formData.get("simulation_id") ?? "");
  const emoji = String(formData.get("emoji") ?? "");
  const currentlyReacted =
    String(formData.get("currently_reacted") ?? "") === "1";

  if (!commentId || !simulationId || !VALID_EMOJI.has(emoji)) return;
  if (!isDbAvailable()) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirect=/simulation/${simulationId}`);
  }

  if (currentlyReacted) {
    await supabase
      .from("comment_reactions")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", user!.id)
      .eq("emoji", emoji);
  } else {
    await supabase
      .from("comment_reactions")
      .insert({
        comment_id: commentId,
        user_id: user!.id,
        emoji,
      });
  }

  revalidatePath(`/simulation/${simulationId}`);
}
