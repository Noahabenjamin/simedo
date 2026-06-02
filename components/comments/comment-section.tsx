import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isDbAvailable } from "@/lib/data/db-available";
import { getCommentsForSimulation, type CommentSort } from "@/lib/data/comments";
import { CommentComposer } from "./comment-composer";
import { CommentItem } from "./comment-item";

type Props = {
  simulationId: string;
  sort: CommentSort;
};

const SORTS: { value: CommentSort; label: string }[] = [
  { value: "top", label: "Top" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
];

export async function CommentSection({ simulationId, sort }: Props) {
  const comments = await getCommentsForSimulation(simulationId, sort);

  let viewerUserId: string | null = null;
  if (isDbAvailable()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    viewerUserId = user?.id ?? null;
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-medium tracking-tight text-foreground">
          Discussion
          {comments.length > 0 && (
            <span className="ml-2 font-mono text-sm text-muted-foreground">
              {comments.length}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1 text-xs">
          {SORTS.map((s) => {
            const active = s.value === sort;
            return (
              <Link
                key={s.value}
                href={`?sort=${s.value}#discussion`}
                scroll={false}
                className={`rounded-full px-2.5 py-1 transition-colors ${
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
              </Link>
            );
          })}
        </div>
      </div>

      {viewerUserId ? (
        <CommentComposer simulationId={simulationId} />
      ) : (
        <SignedOutComposerPlaceholder />
      )}

      {comments.length === 0 ? (
        <EmptyDiscussion />
      ) : (
        <div className="flex flex-col gap-6">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              viewerUserId={viewerUserId}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function SignedOutComposerPlaceholder() {
  return (
    <div className="flex flex-col items-start gap-2 rounded-2xl border border-dashed border-border bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Sign in to leave a comment, react, or anchor your thoughts to a
        specific residue.
      </p>
      <Link
        href="/sign-in"
        className="whitespace-nowrap rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
      >
        Sign in
      </Link>
    </div>
  );
}

function EmptyDiscussion() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full border border-border text-muted-foreground">
        <MessageCircle className="size-5" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-medium text-foreground">
        No comments yet
      </p>
      <p className="max-w-md text-xs text-muted-foreground">
        Share what you're seeing in the trajectory. Attach a residue or a
        frame to ground the discussion in a specific moment.
      </p>
    </div>
  );
}
