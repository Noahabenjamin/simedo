"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/browser";

// Listens for live changes to the discussion (new comments, reactions)
// for one simulation and triggers a soft refresh of the server-rendered
// comment list. No-op when Supabase isn't configured.

type Props = { simulationId: string };

export function RealtimeCommentBridge({ simulationId }: Props) {
  const router = useRouter();

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    let refreshScheduled = false;
    const refreshSoon = () => {
      if (refreshScheduled) return;
      refreshScheduled = true;
      // Coalesce bursts (e.g., a comment + its reaction landing at once)
      // into a single refresh so the page doesn't fight itself.
      setTimeout(() => {
        refreshScheduled = false;
        router.refresh();
      }, 250);
    };

    const channel = supabase
      .channel(`sim:${simulationId}:comments`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `simulation_id=eq.${simulationId}`,
        },
        refreshSoon,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comment_reactions",
        },
        refreshSoon,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, simulationId]);

  return null;
}
