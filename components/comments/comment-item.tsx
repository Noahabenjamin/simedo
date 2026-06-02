"use client";

import { useState } from "react";
import Link from "next/link";
import { Crosshair, Film, MoreHorizontal, Reply, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { deleteComment, toggleReaction } from "@/lib/comment-actions";
import { emit } from "@/lib/viewer-bus";
import { renderInline } from "@/lib/format/markdown";
import type { Comment } from "@/lib/data/comments";
import { CommentComposer } from "./comment-composer";

const EMOJI_LABEL: Record<string, string> = {
  thumbs_up: "👍",
  heart: "❤️",
  microscope: "🔬",
  idea: "💡",
};

const ALL_EMOJIS = ["thumbs_up", "heart", "microscope", "idea"] as const;

type Props = {
  comment: Comment;
  viewerUserId: string | null;
  depth?: number;
};

// Renders one comment node with reactions, anchor chips, and an optional
// reply composer. Replies are rendered recursively but capped at depth 1.

export function CommentItem({ comment, viewerUserId, depth = 0 }: Props) {
  const [replying, setReplying] = useState(false);
  const isOwn = viewerUserId === comment.author.id;
  const createdAt = new Date(comment.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <article className="flex gap-3">
      <Link
        href={`/u/${comment.author.username}`}
        className="shrink-0 transition-opacity hover:opacity-80"
      >
        <Avatar className="size-9">
          <AvatarImage src={comment.author.avatarUrl} alt="" />
          <AvatarFallback className="bg-muted text-xs text-muted-foreground">
            {initials(comment.author.displayName)}
          </AvatarFallback>
        </Avatar>
      </Link>

      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <Link
            href={`/u/${comment.author.username}`}
            className="text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            {comment.author.displayName}
          </Link>
          <span className="font-mono text-[11px] text-muted-foreground">
            @{comment.author.username} · {createdAt}
          </span>
        </div>

        {(comment.frameNumber !== null || comment.atomSelection) && (
          <div className="flex flex-wrap gap-1.5">
            {comment.frameNumber !== null && (
              <button
                type="button"
                onClick={() =>
                  emit("helix:viewer-goto-frame", {
                    frame: comment.frameNumber!,
                  })
                }
                className="flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-mono text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Film className="size-3" />
                Frame {comment.frameNumber}
              </button>
            )}
            {comment.atomSelection && (
              <button
                type="button"
                onClick={() =>
                  emit("helix:viewer-highlight", {
                    selection: comment.atomSelection!,
                  })
                }
                className="flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-mono text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Crosshair className="size-3" />
                {comment.atomSelection}
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 text-sm leading-relaxed text-foreground/90">
          {renderBody(comment.body)}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {ALL_EMOJIS.map((emoji) => {
            const r = comment.reactions.find((x) => x.emoji === emoji);
            const count = r?.count ?? 0;
            const mine = !!r?.mine;
            if (count === 0 && !viewerUserId) return null;
            return (
              <form key={emoji} action={toggleReaction}>
                <input type="hidden" name="comment_id" value={comment.id} />
                <input
                  type="hidden"
                  name="simulation_id"
                  value={comment.simulationId}
                />
                <input type="hidden" name="emoji" value={emoji} />
                <input
                  type="hidden"
                  name="currently_reacted"
                  value={mine ? "1" : "0"}
                />
                <button
                  type="submit"
                  className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-colors ${
                    mine
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  }`}
                >
                  <span>{EMOJI_LABEL[emoji]}</span>
                  {count > 0 && (
                    <span className="font-mono tabular-nums">{count}</span>
                  )}
                </button>
              </form>
            );
          })}

          {depth === 0 && viewerUserId && (
            <button
              type="button"
              onClick={() => setReplying((r) => !r)}
              className="flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              <Reply className="size-3" />
              Reply
            </button>
          )}

          {isOwn && !comment.isDeleted && (
            <form action={deleteComment} className="ml-1">
              <input type="hidden" name="comment_id" value={comment.id} />
              <input
                type="hidden"
                name="simulation_id"
                value={comment.simulationId}
              />
              <button
                type="submit"
                className="flex items-center gap-1 rounded-full p-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Delete comment"
              >
                <Trash2 className="size-3" />
              </button>
            </form>
          )}
        </div>

        {replying && (
          <div className="mt-2">
            <CommentComposer
              simulationId={comment.simulationId}
              parentId={comment.id}
              placeholder={`Reply to @${comment.author.username}`}
              autoFocus
              onSubmitted={() => setReplying(false)}
            />
          </div>
        )}

        {comment.replies.length > 0 && (
          <div className="mt-3 flex flex-col gap-4 border-l border-border pl-4">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                viewerUserId={viewerUserId}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        aria-label="More"
        className="self-start rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
      >
        <MoreHorizontal className="size-4" />
      </button>
    </article>
  );
}

// Render a comment body: walk paragraph-by-paragraph, then interleave
// markdown (bold, italic, code, links) with @-mention linking. Plain
// text only — the markdown renderer never emits raw HTML.
function renderBody(body: string): React.ReactNode {
  const paragraphs = body.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return paragraphs.map((para, i) => (
    <p key={i} className="whitespace-pre-wrap">
      {renderMentionsAndMarkdown(para)}
    </p>
  ));
}

function renderMentionsAndMarkdown(text: string): React.ReactNode {
  const re = /@([a-z0-9_-]{2,32})/gi;
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(<span key={`t-${i}`}>{renderInline(text.slice(last, m.index))}</span>);
    out.push(
      <Link
        key={`m-${i++}`}
        href={`/u/${m[1].toLowerCase()}`}
        className="text-foreground underline-offset-2 hover:text-primary hover:underline"
      >
        @{m[1]}
      </Link>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    out.push(<span key={`t-${i}`}>{renderInline(text.slice(last))}</span>);
  }
  return out;
}
