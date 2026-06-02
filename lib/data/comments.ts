import { createClient } from "@/lib/supabase/server";
import { isDbAvailable } from "./db-available";

export type ReactionEmoji = "thumbs_up" | "heart" | "microscope" | "idea";

export type Comment = {
  id: string;
  simulationId: string;
  parentId: string | null;
  body: string;
  frameNumber: number | null;
  atomSelection: string | null;
  isDeleted: boolean;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
  };
  reactions: { emoji: ReactionEmoji; count: number; mine: boolean }[];
  replies: Comment[];
};

export type CommentSort = "top" | "newest" | "oldest";

type DbCommentRow = {
  id: string;
  simulation_id: string;
  parent_id: string | null;
  body: string;
  frame_number: number | null;
  atom_selection: string | null;
  is_deleted: boolean;
  created_at: string;
  user_id: string;
  users: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

type DbReactionRow = {
  comment_id: string;
  emoji: ReactionEmoji;
  user_id: string;
};

function fallbackAvatar(username: string): string {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
    username,
  )}&backgroundColor=0F6E56`;
}

export async function getCommentsForSimulation(
  simulationId: string,
  sort: CommentSort = "top",
): Promise<Comment[]> {
  if (!isDbAvailable()) return [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewerId = user?.id ?? null;

  const { data: rows } = await supabase
    .from("comments")
    .select(
      "id, simulation_id, parent_id, body, frame_number, atom_selection, is_deleted, created_at, user_id, users:user_id (username, display_name, avatar_url)",
    )
    .eq("simulation_id", simulationId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: sort === "oldest" });

  if (!rows?.length) return [];

  const ids = (rows as unknown as DbCommentRow[]).map((r) => r.id);
  const { data: reactionRows } = await supabase
    .from("comment_reactions")
    .select("comment_id, emoji, user_id")
    .in("comment_id", ids);

  const reactionMap = new Map<string, Comment["reactions"]>();
  for (const r of (reactionRows ?? []) as DbReactionRow[]) {
    const bucket = reactionMap.get(r.comment_id) ?? [];
    const found = bucket.find((b) => b.emoji === r.emoji);
    if (found) {
      found.count += 1;
      if (viewerId && r.user_id === viewerId) found.mine = true;
    } else {
      bucket.push({
        emoji: r.emoji,
        count: 1,
        mine: viewerId === r.user_id,
      });
    }
    reactionMap.set(r.comment_id, bucket);
  }

  const map = new Map<string, Comment>();
  for (const r of rows as unknown as DbCommentRow[]) {
    map.set(r.id, {
      id: r.id,
      simulationId: r.simulation_id,
      parentId: r.parent_id,
      body: r.body,
      frameNumber: r.frame_number,
      atomSelection: r.atom_selection,
      isDeleted: r.is_deleted,
      createdAt: r.created_at,
      author: {
        id: r.user_id,
        username: r.users?.username ?? "unknown",
        displayName:
          r.users?.display_name?.trim() || r.users?.username || "Unknown",
        avatarUrl:
          r.users?.avatar_url ?? fallbackAvatar(r.users?.username ?? "U"),
      },
      reactions: reactionMap.get(r.id) ?? [],
      replies: [],
    });
  }

  const roots: Comment[] = [];
  for (const c of map.values()) {
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.replies.push(c);
    } else {
      roots.push(c);
    }
  }
  // Replies always sort oldest-first within a thread.
  for (const c of map.values()) {
    c.replies.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  if (sort === "top") {
    const score = (c: Comment) =>
      c.reactions.reduce((sum, r) => sum + r.count, 0);
    roots.sort((a, b) => score(b) - score(a));
  } else if (sort === "newest") {
    roots.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } else {
    roots.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  return roots;
}

export async function getCommentCountForSimulation(
  simulationId: string,
): Promise<number> {
  if (!isDbAvailable()) return 0;
  const supabase = await createClient();
  const { count } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("simulation_id", simulationId)
    .eq("is_deleted", false);
  return count ?? 0;
}
