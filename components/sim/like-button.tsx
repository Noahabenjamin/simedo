import Link from "next/link";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isDbAvailable } from "@/lib/data/db-available";
import { formatCount } from "@/lib/format";
import { toggleLike } from "@/lib/like-actions";

type Props = {
  simulationId: string;
  count: number;
};

// Server component — checks whether the viewer has already liked this
// sim, then renders either a signed-out CTA, an unliked button, or a
// liked-state button. The action is form-driven so it works without JS.

export async function LikeButton({ simulationId, count }: Props) {
  let liked = false;
  let viewerSignedIn = false;

  if (isDbAvailable()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    viewerSignedIn = !!user;
    if (user) {
      const { data } = await supabase
        .from("likes")
        .select("user_id")
        .eq("user_id", user.id)
        .eq("simulation_id", simulationId)
        .maybeSingle();
      liked = !!data;
    }
  }

  if (!viewerSignedIn) {
    return (
      <Link
        href={`/sign-in?redirect=/simulation/${simulationId}`}
        className="flex items-center gap-1.5 tabular-nums text-muted-foreground transition-colors hover:text-foreground"
        title="Sign in to like"
      >
        <Heart className="size-4" />
        {formatCount(count)}
      </Link>
    );
  }

  return (
    <form action={toggleLike}>
      <input type="hidden" name="simulation_id" value={simulationId} />
      <input
        type="hidden"
        name="currently_liked"
        value={liked ? "1" : "0"}
      />
      <button
        type="submit"
        className={
          liked
            ? "flex items-center gap-1.5 tabular-nums text-rose-500 transition-colors hover:text-rose-400"
            : "flex items-center gap-1.5 tabular-nums text-muted-foreground transition-colors hover:text-foreground"
        }
        aria-pressed={liked}
        aria-label={liked ? "Unlike simulation" : "Like simulation"}
      >
        <Heart
          className="size-4"
          fill={liked ? "currentColor" : "none"}
          strokeWidth={1.6}
        />
        {formatCount(count)}
      </button>
    </form>
  );
}
