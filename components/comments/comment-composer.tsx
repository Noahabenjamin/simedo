"use client";

import { useEffect, useRef, useState } from "react";
import { Crosshair, Film, Send } from "lucide-react";
import { postComment } from "@/lib/comment-actions";
import { subscribe } from "@/lib/viewer-bus";

type Props = {
  simulationId: string;
  parentId?: string | null;
  placeholder?: string;
  autoFocus?: boolean;
  onSubmitted?: () => void;
};

// Comment composer with two anchor toggles:
//   - Frame: capture the trajectory frame the viewer is on right now
//   - Residue: capture the residue the user last clicked in the viewer
// Both subscribe to viewer-bus events emitted by the molecular viewer.

export function CommentComposer({
  simulationId,
  parentId = null,
  placeholder = "Share what you're seeing",
  autoFocus,
  onSubmitted,
}: Props) {
  const [body, setBody] = useState("");
  const [anchorFrame, setAnchorFrame] = useState<number | null>(null);
  const [anchorResidue, setAnchorResidue] = useState<{
    chain: string;
    residueNumber: number;
    label: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const currentFrameRef = useRef<number | null>(null);
  const lastPickRef = useRef<{
    chain: string;
    residueNumber: number;
    resname: string;
  } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const unsubFrame = subscribe("helix:viewer-frame", ({ frame }) => {
      currentFrameRef.current = frame;
    });
    const unsubAtom = subscribe(
      "helix:viewer-atom-pick",
      ({ chain, residueNumber, resname }) => {
        lastPickRef.current = { chain, residueNumber, resname };
      },
    );
    return () => {
      unsubFrame();
      unsubAtom();
    };
  }, []);

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        setSubmitting(true);
        try {
          await postComment(fd);
          setBody("");
          setAnchorFrame(null);
          setAnchorResidue(null);
          onSubmitted?.();
        } finally {
          setSubmitting(false);
        }
      }}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4"
    >
      <input type="hidden" name="simulation_id" value={simulationId} />
      {parentId && (
        <input type="hidden" name="parent_id" value={parentId} />
      )}
      {anchorFrame !== null && (
        <input type="hidden" name="frame_number" value={anchorFrame} />
      )}
      {anchorResidue && (
        <input
          type="hidden"
          name="atom_selection"
          value={`:${anchorResidue.chain} and ${anchorResidue.residueNumber}`}
        />
      )}

      <textarea
        name="body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          // Cmd/Ctrl + Enter posts. Plain Enter still inserts a newline so
          // multiline comments are easy to write.
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            formRef.current?.requestSubmit();
          }
        }}
        placeholder={placeholder}
        required
        maxLength={5000}
        autoFocus={autoFocus}
        rows={parentId ? 2 : 3}
        className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-foreground/30"
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (anchorFrame !== null) {
              setAnchorFrame(null);
            } else if (currentFrameRef.current !== null) {
              setAnchorFrame(currentFrameRef.current);
            }
          }}
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
            anchorFrame !== null
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
          }`}
        >
          <Film className="size-3" />
          {anchorFrame !== null ? `Frame ${anchorFrame}` : "Attach frame"}
        </button>

        <button
          type="button"
          onClick={() => {
            if (anchorResidue) {
              setAnchorResidue(null);
            } else if (lastPickRef.current) {
              const p = lastPickRef.current;
              setAnchorResidue({
                chain: p.chain,
                residueNumber: p.residueNumber,
                label: `${p.resname}${p.residueNumber}`,
              });
            }
          }}
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
            anchorResidue
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
          }`}
        >
          <Crosshair className="size-3" />
          {anchorResidue
            ? `${anchorResidue.label} (${anchorResidue.chain})`
            : "Attach residue"}
        </button>

        <div className="ml-auto flex items-center gap-3">
          <span className="font-mono text-[10px] text-muted-foreground">
            {body.length}/5000
          </span>
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            className="flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-colors hover:bg-foreground/85 disabled:opacity-50"
          >
            <Send className="size-3" />
            {parentId ? "Reply" : "Post"}
          </button>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Click an atom in the viewer to attach a residue, or scrub to a frame
        and tap Attach frame. <span className="font-mono">⌘↵</span> to post.
      </p>
    </form>
  );
}
